import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Sidebar, PrimaryButton, SecondaryButton, TextInput, Modal, AlertModal } from '../components';
import { useAuthStore } from '../../../core/stores/useAuthStore';
import { usePOSStore } from '../../../core/stores/usePOSStore';
import { APIAdminRepository } from '../../data/repositories/APIAdminRepository';
import { APIClientPortalRepository } from '../../data/repositories/APIClientPortalRepository';
import { APISalesRepository } from '../../data/repositories/APISalesRepository';
import { APIInventoryRepository } from '../../data/repositories/APIInventoryRepository';
import { APIServicesRepository } from '../../data/repositories/APIServicesRepository';
import type { PredefinedService } from '../../domain/entities/SalesEntities';
import type { Branch } from '../../domain/entities/AdminEntities';
import type { Product } from '@/app/domain/entities/InventoryEntities';

const inventoryRepo = new APIInventoryRepository();
const salesRepo = new APISalesRepository();
const adminRepo = new APIAdminRepository();
const clientPortalRepo = new APIClientPortalRepository();
const servicesRepo = new APIServicesRepository();

// ─── Inline Editable Price Component ─────────────────────────────────────────

interface InlinePriceProps {
  cartId: string;
  unitPrice: number;
  originalPrice: number;
  isNoAplica: boolean;
  onUpdate: (cartId: string, price: number) => void;
}

const InlinePrice: React.FC<InlinePriceProps> = ({
  cartId, unitPrice, originalPrice, isNoAplica, onUpdate,
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(unitPrice));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  useEffect(() => {
    if (!editing) setValue(String(unitPrice));
  }, [unitPrice, editing]);

  const commit = () => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) onUpdate(cartId, num);
    else setValue(String(unitPrice));
    setEditing(false);
  };

  if (isNoAplica) {
    return (
      <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: '700' }}>
        $0.00
        <span style={{ fontSize: '10px', background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontWeight: '600', marginLeft: '6px' }}>
          No aplica
        </span>
      </span>
    );
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setValue(String(unitPrice)); setEditing(false); } }}
        style={{
          width: '90px', fontSize: '13px', fontWeight: '700', color: '#1d4ed8',
          border: '2px solid #3b82f6', borderRadius: '6px', padding: '2px 6px',
          outline: 'none', background: '#eff6ff',
        }}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Haz clic para editar el precio"
      style={{
        background: 'none', border: 'none', cursor: 'text', padding: 0,
        display: 'flex', alignItems: 'center', gap: '4px',
      }}
    >
      <span style={{ fontSize: '13px', color: '#2563eb', fontWeight: '700' }}>
        ${unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
      </span>
      {unitPrice !== originalPrice && (
        <span style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>
          ${originalPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      )}
      <Icon name="Pencil" size="sm" style={{ width: '10px', height: '10px', color: '#94a3b8' }} />
    </button>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const POSPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, accessToken, activeBranchId, clearAuth } = useAuthStore();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [allServices, setAllServices] = useState<PredefinedService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const {
    cart,
    searchValue,
    searchResults,
    serviceSearchValue,
    serviceResults,
    subtotal, tax, total,
    applyTax, isFullDiscount,
    toggleApplyTax,
    toggleFullDiscount,
    setSearchValue,
    setSearchResults,
    setServiceSearchValue,
    setServiceResults,
    addProductToCart,
    addServiceToCart,
    removeFromCart,
    updateQuantity,
    updateUnitPrice,
    toggleItemNoAplica,
    clearCart,
  } = usePOSStore();

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [processing, setProcessing] = useState(false);
  const [activeModal, setActiveModal] = useState<'checkout' | 'checkoutSuccess' | null>(null);
  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; isError: boolean }>({
    isOpen: false, title: '', message: '', isError: false,
  });

  // ── Listen to store errors ─────────────────────────────────────────────────
  const storeError = usePOSStore(state => state.error);
  const clearStoreError = usePOSStore(state => state.setError);
  useEffect(() => {
    if (storeError) {
      setAlertState({ isOpen: true, title: 'Atención', message: storeError, isError: true });
      clearStoreError(null);
    }
  }, [storeError, clearStoreError]);

  // ── Load branches ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await adminRepo.getBranches();
        if (data?.length) { setBranches(data); return; }
      } catch { }
      try {
        const publicData = await clientPortalRepo.getPublicBranches();
        if (publicData?.length) setBranches(publicData.map((b: any) => ({ ...b, id: b.id || b._id })));
      } catch { }
    };
    fetchBranches();
  }, [accessToken]);

  // ── Load services on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    const fetchServices = async () => {
      setLoadingServices(true);
      try {
        const data = await servicesRepo.getServices(accessToken, { isActive: true });
        setAllServices(data);
        setServiceResults(data);
      } catch (err: any) {
        if (err.message === 'UNAUTHORIZED') handleUnauthorized();
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
    // eslint-disable-next-line
  }, [accessToken]);

  // ── Service search (client-side filter) ───────────────────────────────────
  useEffect(() => {
    if (!serviceSearchValue.trim()) {
      setServiceResults(allServices);
    } else {
      const q = serviceSearchValue.toLowerCase();
      setServiceResults(allServices.filter(s => s.name.toLowerCase().includes(q)));
    }
  }, [serviceSearchValue, allServices]);

  // ── Product search ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    if (!searchValue.trim()) return;
    const id = setTimeout(async () => {
      try {
        const results = await inventoryRepo.getProducts(accessToken, { search: searchValue });
        setSearchResults(results);
      } catch (err: any) {
        if (err.message === 'UNAUTHORIZED') handleUnauthorized();
      }
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line
  }, [searchValue, accessToken]);

  const handleUnauthorized = () => { clearAuth(); navigate('/login'); };

  const activeBranch = branches.find(b => b.id === activeBranchId || (b as any)._id === activeBranchId);
  const activeBranchName = activeBranch?.name ?? (branches[0]?.name ?? 'Sucursal Principal');

  // ── Checkout ───────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!accessToken || cart.length === 0) return;
    setProcessing(true);

    if (paymentMethod === 'card') {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      const items = cart
        .filter(item => !item.isNoAplica)
        .map(item => ({
          type: item.type,
          ...(item.type === 'product' ? { productId: item.product?.id ?? (item.product as any)?._id } : { serviceId: item.service?.id ?? (item.service as any)?._id }),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: 0,
        }));

      // If full discount, send all items but with unitPrice 0
      const finalItems = isFullDiscount
        ? cart.map(item => ({
          type: item.type,
          ...(item.type === 'product' ? { productId: item.product?.id ?? (item.product as any)?._id } : { serviceId: item.service?.id ?? (item.service as any)?._id }),
          quantity: item.quantity,
          unitPrice: 0,
        }))
        : items;

      await salesRepo.createSale(accessToken, {
        items: finalItems,
        paymentMethod,
      });

      setActiveModal('checkoutSuccess');
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') handleUnauthorized();
      else setAlertState({ isOpen: true, title: 'Error al procesar venta', message: err.message, isError: true });
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseSuccess = () => { clearCart(); setActiveModal(null); };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="print:bg-white" style={{ background: '#f1f5f9', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="print:hidden">
        <Sidebar onLogout={handleUnauthorized} userName={user?.name || 'Admin'} />

        <div style={{ marginLeft: '240px', minHeight: '100vh', display: 'flex' }}>

          {/* ── Main POS Area ─────────────────────────────────────────── */}
          <main style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Punto de Venta</h1>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0' }}>
                  Sucursal: <strong>{activeBranchName}</strong>
                </p>
              </div>

            </div>

            {/* ── Tabs ───────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '4px', background: 'white', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
              {(['products', 'services'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    background: activeTab === tab ? '#2563eb' : 'transparent',
                    color: activeTab === tab ? 'white' : '#64748b',
                  }}
                >
                  {tab === 'products' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="Package" size="sm" />
                      Productos
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="Wrench" size="sm" />
                      Servicios
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Products Tab ───────────────────────────────────────────── */}
            {activeTab === 'products' && (
              <>
                <TextInput
                  placeholder="Buscar producto por nombre o SKU..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
                <div style={{ flex: 1, background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', overflowY: 'auto' }}>
                  {searchResults.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '16px' }}>
                      {searchResults.map((product: Product) => (
                        <div
                          key={product.id}
                          style={{
                            border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px',
                            display: 'flex', flexDirection: 'column', gap: '10px',
                            transition: 'box-shadow 0.15s', cursor: 'default',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', lineHeight: 1.3 }}>{product.name}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>SKU: {product.sku}</div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '17px', fontWeight: '700', color: '#2563eb' }}>
                                ${product.sellingPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </div>
                              <div style={{ fontSize: '11px', color: product.stock <= product.minStock ? '#ef4444' : '#94a3b8' }}>
                                Stock: {product.stock}
                              </div>
                            </div>
                            <PrimaryButton size="sm" onClick={() => { addProductToCart(product, 1); setSearchValue(''); }}>
                              <Icon name="Plus" size="sm" />
                            </PrimaryButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ height: '100%', minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <Icon name="Search" size="lg" className="mb-3" />
                      <p style={{ fontSize: '14px' }}>Busca un producto por nombre o SKU</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Services Tab ───────────────────────────────────────────── */}
            {activeTab === 'services' && (
              <>
                <TextInput
                  placeholder="Buscar servicio por nombre..."
                  value={serviceSearchValue}
                  onChange={(e) => setServiceSearchValue(e.target.value)}
                />
                <div style={{ flex: 1, background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', overflowY: 'auto' }}>
                  {loadingServices ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: '#94a3b8' }}>
                      <Icon name="Loader2" size="lg" className="animate-spin" />
                    </div>
                  ) : serviceResults.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                      {serviceResults.map((service) => (
                        <div
                          key={service.id}
                          style={{
                            border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '16px',
                            display: 'flex', flexDirection: 'column', gap: '10px', height: '100%',
                            background: 'white', transition: 'border-color 0.15s, box-shadow 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{service.name}</span>
                              </div>
                              {service.description && (
                                <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0', lineHeight: 1.4 }}>{service.description}</p>
                              )}
                            </div>
                          </div>

                          {/* Supplies list */}
                          {service.supplies.length > 0 && (
                            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '8px 10px' }}>
                              <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                                Insumos incluidos
                              </div>
                              {service.supplies.map((s, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', marginBottom: '2px' }}>
                                  <span>• {s.product.name}</span>
                                  <span style={{ fontWeight: '600', color: '#0f172a' }}>×{s.quantity}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '8px' }}>
                            <div>
                              <div style={{ fontSize: '18px', fontWeight: '700', color: '#f59e0b' }}>
                                ${service.basePrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </div>
                              <div style={{ fontSize: '10px', color: '#94a3b8' }}>Precio editable en carrito</div>
                            </div>
                            <PrimaryButton
                              size="sm"
                              style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
                              onClick={() => { addServiceToCart(service); }}
                            >
                              <Icon name="Plus" size="sm" />
                              Agregar
                            </PrimaryButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <Icon name="Wrench" size="lg" className="mb-3" />
                      <p style={{ fontSize: '14px' }}>No hay servicios configurados</p>
                      <p style={{ fontSize: '12px', marginTop: '4px' }}>El administrador puede crear servicios en Inventario → Servicios</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </main>

          {/* ── Cart Sidebar ───────────────────────────────────────────────── */}
          <aside style={{ width: '420px', background: 'white', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

            {/* Cart header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="ShoppingCart" size="sm" />
                <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                  Carrito
                </h2>
                {cart.length > 0 && (
                  <span style={{ background: '#2563eb', color: 'white', fontSize: '11px', fontWeight: '700', borderRadius: '20px', padding: '1px 8px' }}>
                    {cart.length}
                  </span>
                )}
              </div>
              {cart.length > 0 && (
                <button onClick={() => { clearCart(); setSearchValue(''); }} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                  Vaciar
                </button>
              )}
            </div>

            {/* Cart items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '60px' }}>
                  <Icon name="ShoppingCart" size="lg" className="mb-3" />
                  <p style={{ fontSize: '14px' }}>El carrito está vacío</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>Agrega productos o servicios</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {cart.filter(item => !item.parentCartId).map(item => {
                    const childItems = cart.filter(child => child.parentCartId === item.cartId);
                    
                    const renderItemRow = (cartItem: typeof cart[0]) => (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {cartItem.type === 'service' && (
                              <span style={{ fontSize: '10px', background: '#fffbeb', color: '#d97706', padding: '1px 6px', borderRadius: '4px', fontWeight: '700', border: '1px solid #fde68a', flexShrink: 0 }}>
                                Servicio
                              </span>
                            )}
                            {cartItem.parentCartId && (
                              <span style={{ fontSize: '10px', background: '#bae6fd', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontWeight: '700', border: '1px solid #7dd3fc', flexShrink: 0 }}>
                                Insumo de servicio
                              </span>
                            )}
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', wordBreak: 'break-word' }}>{cartItem.name}</span>
                          </div>
                          {cartItem.sku && (
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>SKU: {cartItem.sku}</div>
                          )}

                          {/* Inline price editor */}
                          <div style={{ marginTop: '6px' }}>
                            <InlinePrice
                              cartId={cartItem.cartId}
                              unitPrice={cartItem.unitPrice}
                              originalPrice={cartItem.originalPrice}
                              isNoAplica={!!cartItem.isNoAplica}
                              onUpdate={updateUnitPrice}
                            />
                          </div>

                          {/* No aplica toggle */}
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: cartItem.isNoAplica ? '#16a34a' : '#94a3b8', fontWeight: '600', cursor: 'pointer', marginTop: '6px', userSelect: 'none' }}>
                            <input
                              type="checkbox"
                              checked={!!cartItem.isNoAplica}
                              onChange={() => toggleItemNoAplica(cartItem.cartId)}
                              style={{ width: '13px', height: '13px', accentColor: '#16a34a' }}
                            />
                            No aplica
                          </label>
                        </div>

                        {/* Quantity controls + delete */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                          <button onClick={() => removeFromCart(cartItem.cartId)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                            <Icon name="Trash2" size="sm" />
                          </button>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button onClick={() => updateQuantity(cartItem.cartId, cartItem.quantity - 1)} style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '16px', lineHeight: 1 }}>−</button>
                            <span style={{ fontSize: '14px', fontWeight: '700', width: '22px', textAlign: 'center' }}>{cartItem.quantity}</span>
                            <button onClick={() => updateQuantity(cartItem.cartId, cartItem.quantity + 1)} style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '16px', lineHeight: 1 }}>+</button>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                            ${cartItem.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );

                    return (
                      <div key={item.cartId} style={{ border: '1px solid #f1f5f9', borderRadius: '10px', padding: '12px', background: '#fafafa' }}>
                        {renderItemRow(item)}

                        {childItems.length > 0 && (
                          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {childItems.map(child => (
                              <div key={child.cartId} style={{ border: '1px solid #bae6fd', borderRadius: '8px', padding: '10px', background: '#f0f9ff' }}>
                                {renderItemRow(child)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cart footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
              {cart.length > 0 && (
                <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* IVA */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', userSelect: 'none' }}>
                    <input type="checkbox" checked={applyTax} onChange={(e) => toggleApplyTax(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#2563eb' }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e3a8a' }}>
                      Aplicar IVA <span style={{ fontWeight: '400', color: '#3b82f6' }}>(16%)</span>
                    </span>
                  </label>

                  {/* Full discount */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', cursor: 'pointer', userSelect: 'none' }}>
                    <input type="checkbox" checked={isFullDiscount} onChange={(e) => toggleFullDiscount(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#16a34a' }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#14532d' }}>
                      No aplica <span style={{ fontWeight: '400', color: '#16a34a' }}>(100% Gratis)</span>
                    </span>
                  </label>
                </div>
              )}

              {/* Totals */}
              <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              {isFullDiscount && (
                <div style={{ fontSize: '13px', color: '#16a34a', display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: '600' }}>
                  <span>Descuento (100%)</span>
                  <span>-${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span>IVA {applyTax ? '(16%)' : '(No aplicable)'}</span>
                <span>${tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span>Total</span>
                <span>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <SecondaryButton
                  className="flex-1 justify-center"
                  disabled={cart.length === 0}
                  onClick={() => window.print()}
                >
                  <Icon name="Printer" size="sm" className="mr-2" />
                  Cotización
                </SecondaryButton>
              </div>

              <PrimaryButton
                className="w-full justify-center py-3 text-base"
                disabled={cart.length === 0}
                onClick={() => setActiveModal('checkout')}
              >
                <Icon name="CreditCard" size="sm" className="mr-2" />
                Cobrar ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </PrimaryButton>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Print Layout ─────────────────────────────────────────────────────── */}
      <div className="hidden print:block p-8 bg-white text-black">
        <div className="text-center mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold">Moto Servicio Nova FV</h1>
          <p className="text-gray-600">Cotización</p>
          <p className="text-sm text-gray-500 mt-2">
            Fecha: {new Date().toLocaleDateString('es-MX')} {new Date().toLocaleTimeString('es-MX')}
          </p>
          <p className="text-sm text-gray-500 font-medium">Sucursal: {activeBranchName}</p>
        </div>

        <table className="w-full text-left mb-8 border-collapse">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="py-2">Cant.</th>
              <th className="py-2">Descripción</th>
              <th className="py-2 text-right">P. Unitario</th>
              <th className="py-2 text-right">Importe</th>
            </tr>
          </thead>
          <tbody>
            {cart.filter(item => !item.parentCartId).map((item) => {
              const childItems = cart.filter(child => child.parentCartId === item.cartId);

              const renderPrintRow = (cartItem: typeof cart[0], isChild: boolean) => (
                <tr key={cartItem.cartId} className={isChild ? "bg-slate-50 border-b border-gray-100" : "border-b border-gray-200"}>
                  <td className={`py-2 ${isChild ? 'pl-6 text-slate-500 text-sm' : ''}`}>{cartItem.quantity}</td>
                  <td className={`py-2 ${isChild ? 'pl-6' : ''}`}>
                    <div className={isChild ? "text-slate-700 text-sm" : "font-medium"}>{cartItem.name}</div>
                    {cartItem.sku && <div className="text-xs text-gray-500 mt-1">SKU: {cartItem.sku}</div>}
                    {cartItem.type === 'service' && (
                      <div className="mt-1">
                        <span className="text-xs text-amber-600 font-semibold border border-amber-200 bg-amber-50 px-1 py-0.5 rounded">Servicio de taller</span>
                      </div>
                    )}
                    {cartItem.parentCartId && (
                      <div className="mt-1">
                        <span className="text-[10px] text-blue-600 font-semibold border border-blue-200 bg-blue-50 px-1 py-0.5 rounded">Insumo</span>
                      </div>
                    )}
                  </td>
                  <td className={`py-2 text-right ${isChild ? 'text-slate-600 text-sm' : ''}`}>${cartItem.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td className={`py-2 text-right ${isChild ? 'text-slate-600 text-sm' : ''}`}>${cartItem.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                </tr>
              );

              return (
                <React.Fragment key={item.cartId}>
                  {renderPrintRow(item, false)}
                  {childItems.map(child => renderPrintRow(child, true))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>

        <div className="w-64 ml-auto">
          <div className="flex justify-between py-1 text-gray-600">
            <span>Subtotal:</span>
            <span>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          </div>
          {isFullDiscount ? (
            <>
              <div className="flex justify-between py-1 text-green-600 font-medium">
                <span>Descuento (100%):</span>
                <span>-${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-1 text-gray-600 border-b border-black">
                <span>IVA (0%):</span>
                <span>$0.00</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between py-1 text-gray-600 border-b border-black">
              <span>IVA {applyTax ? '(16%):' : '(No aplicable):'}:</span>
              <span>${tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="flex justify-between py-2 text-xl font-bold">
            <span>Total:</span>
            <span>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>Esta cotización tiene una vigencia de 15 días a partir de su fecha de expedición.</p>
          <p>Gracias por su preferencia.</p>
        </div>
      </div>

      {/* ── Payment Modal ─────────────────────────────────────────────────────── */}
      <Modal isOpen={activeModal === 'checkout'} onClose={() => setActiveModal(null)} title="Confirmar Venta">
        <div style={{ marginBottom: '8px' }}>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
            Total: <strong style={{ color: '#0f172a' }}>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
          </p>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '10px' }}>Método de pago</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
            {[
              { value: 'cash', icon: 'DollarSign', label: 'Efectivo' },
              { value: 'card', icon: 'CreditCard', label: 'Tarjeta (Terminal MP)' },
              { value: 'transfer', icon: 'Smartphone', label: 'Transferencia' },
            ].map(({ value, icon, label }) => (
              <button
                key={value}
                onClick={() => setPaymentMethod(value as any)}
                style={{
                  padding: '14px 16px', borderRadius: '10px',
                  border: paymentMethod === value ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                  background: paymentMethod === value ? '#eff6ff' : 'white',
                  display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                }}
              >
                <Icon name={icon as any} className={paymentMethod === value ? 'text-primary' : 'text-[#64748b]'} />
                <span style={{ fontWeight: '600', fontSize: '15px', color: paymentMethod === value ? '#2563eb' : '#0f172a' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <SecondaryButton onClick={() => setActiveModal(null)} disabled={processing}>Cancelar</SecondaryButton>
          <PrimaryButton onClick={handleCheckout} loading={processing}>Confirmar y Cobrar</PrimaryButton>
        </div>
      </Modal>

      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState({ ...alertState, isOpen: false })}
        title={alertState.title}
        message={alertState.message}
        isError={alertState.isError}
      />

      {/* Success modal */}
      {activeModal === 'checkoutSuccess' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '16px', width: '400px', maxWidth: '90vw', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Icon name="Check" size="lg" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', color: '#0f172a' }}>¡Venta Registrada!</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>El cobro se ha procesado correctamente.</p>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '28px' }}>
              Los insumos han sido descontados del inventario de <strong>{activeBranchName}</strong>.
            </p>
            <PrimaryButton className="w-full justify-center" onClick={handleCloseSuccess}>
              Nueva Venta
            </PrimaryButton>
          </div>
        </div>
      )}
    </div>
  );
};

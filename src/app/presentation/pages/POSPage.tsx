import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Icon,
  Sidebar,
  PrimaryButton,
  SecondaryButton,
  TextInput,
  Modal,
  AlertModal,
  KbdBadge,
  TemporaryServiceModal,
  TicketReceipt,
  QuotationReceipt,
} from '../components';
import { useAuthStore } from '../../../core/stores/useAuthStore';
import { usePOSStore } from '../../../core/stores/usePOSStore';
import { useBarcodeScanner } from '../../../core/hooks/useBarcodeScanner';
import { APIAdminRepository } from '../../data/repositories/APIAdminRepository';
import { APIClientPortalRepository } from '../../data/repositories/APIClientPortalRepository';
import { APISalesRepository } from '../../data/repositories/APISalesRepository';
import { APIInventoryRepository } from '../../data/repositories/APIInventoryRepository';
import { APIServicesRepository } from '../../data/repositories/APIServicesRepository';
import type { PredefinedService, Sale } from '../../domain/entities/SalesEntities';
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
  const [initialProducts, setInitialProducts] = useState<Product[]>([]);
  const [allProductsForSupplies, setAllProductsForSupplies] = useState<Product[]>([]);
  const [isTempServiceModalOpen, setIsTempServiceModalOpen] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);


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
    addTemporaryServiceToCart,
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

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const highlightedCardRef = useRef<HTMLDivElement | null>(null);

  // Reset selected index when activeTab or search queries change
  useEffect(() => {
    setSelectedIndex(0);
  }, [activeTab, searchValue, serviceSearchValue]);

  // Auto scroll highlighted item into view
  useEffect(() => {
    if (highlightedCardRef.current) {
      highlightedCardRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

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

  // ── Load initial products (15-20 products) ─────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    const fetchInitialProducts = async () => {
      try {
        const res = await inventoryRepo.getProductsPaginated(accessToken, { limit: 20 });
        setInitialProducts(res.items);
        if (!searchValue.trim()) {
          setSearchResults(res.items);
        }
        // Also fetch all products for the temporary service supply picker
        const allRes = await inventoryRepo.getProducts(accessToken);
        setAllProductsForSupplies(allRes);
      } catch (err: any) {
        if (err.message === 'UNAUTHORIZED') handleUnauthorized();
      }
    };
    fetchInitialProducts();
    // eslint-disable-next-line
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

  // ── Service search (server & client fallback) ──────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    if (!serviceSearchValue.trim()) {
      setServiceResults(allServices);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const results = await servicesRepo.getServices(accessToken, { isActive: true, search: serviceSearchValue });
        setServiceResults(results);
      } catch (err: any) {
        if (err.message === 'UNAUTHORIZED') handleUnauthorized();
        // Fallback to client side filtering if offline
        const q = serviceSearchValue.toLowerCase();
        setServiceResults(allServices.filter(s => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)));
      }
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line
  }, [serviceSearchValue, accessToken, allServices]);

  // ── Product search ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    if (!searchValue.trim()) {
      setSearchResults(initialProducts);
      return;
    }
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
  }, [searchValue, accessToken, initialProducts]);

  const handleUnauthorized = () => { clearAuth(); navigate('/login'); };

  // ── Barcode Scanner Handler ───────────────────────────────────────────────
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    if (!accessToken) return;
    try {
      // 1. Check exact SKU match
      const product = await inventoryRepo.getProductBySku(accessToken, barcode);
      if (product) {
        setSearchValue(product.sku);
        addProductToCart(product, 1);
        setAlertState({
          isOpen: true,
          title: 'Producto Escaneado',
          message: `"${product.name}" agregado al carrito automáticamente.`,
          isError: false,
        });
        return;
      }
      // 2. Search fallback
      const results = await inventoryRepo.getProducts(accessToken, { search: barcode });
      if (results && results.length > 0) {
        setSearchValue(barcode);
        addProductToCart(results[0], 1);
        setAlertState({
          isOpen: true,
          title: 'Producto Escaneado',
          message: `"${results[0].name}" agregado al carrito automáticamente.`,
          isError: false,
        });
      } else {
        setAlertState({
          isOpen: true,
          title: 'Código no encontrado',
          message: `No se encontró ningún producto con SKU/código: ${barcode}`,
          isError: true,
        });
      }
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') handleUnauthorized();
    }
  }, [accessToken, setSearchValue, addProductToCart]);

  useBarcodeScanner({ onScan: handleBarcodeScan, enabled: activeTab === 'products' });

  // ── Keyboard Shortcuts Listener ───────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If modal or temp service modal is open, skip catalog navigation
      if (activeModal !== null || isTempServiceModalOpen) return;

      // Alt+P or F2 -> Switch to Products
      if ((e.altKey && (e.key === 'p' || e.key === 'P')) || e.key === 'F2') {
        e.preventDefault();
        setActiveTab('products');
      }
      // Alt+S or F3 -> Switch to Services
      else if ((e.altKey && (e.key === 's' || e.key === 'S')) || e.key === 'F3') {
        e.preventDefault();
        setActiveTab('services');
      }
      // Alt+F or F4 -> Focus search bar
      else if ((e.altKey && (e.key === 'f' || e.key === 'F')) || e.key === 'F4') {
        e.preventDefault();
        const inputEl = document.querySelector<HTMLInputElement>('#pos-search-input');
        inputEl?.focus();
      }
      // Alt+T or F6 -> Open Temporary Service modal
      else if ((e.altKey && (e.key === 't' || e.key === 'T')) || e.key === 'F6') {
        e.preventDefault();
        setIsTempServiceModalOpen(true);
      }
      // Alt+C or F8 -> Checkout / Cobrar
      else if ((e.altKey && (e.key === 'c' || e.key === 'C')) || e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) setActiveModal('checkout');
      }
      // Alt+V or F9 -> Vaciar carrito
      else if ((e.altKey && (e.key === 'v' || e.key === 'V')) || e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) clearCart();
      }
      // ── Arrow Keys Catalog Navigation ──
      else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        const listLen = activeTab === 'products' ? searchResults.length : serviceResults.length;
        if (listLen > 0) {
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, listLen - 1));
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        const listLen = activeTab === 'products' ? searchResults.length : serviceResults.length;
        if (listLen > 0) {
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
        }
      } else if (e.key === 'Enter') {
        if (activeTab === 'products') {
          if (searchResults.length > 0 && selectedIndex >= 0 && selectedIndex < searchResults.length) {
            e.preventDefault();
            const prod = searchResults[selectedIndex];
            if (prod) {
              addProductToCart(prod, 1);
              setSearchValue('');
              setSelectedIndex(0);
            }
          }
        } else if (activeTab === 'services') {
          if (serviceResults.length > 0 && selectedIndex >= 0 && selectedIndex < serviceResults.length) {
            e.preventDefault();
            const serv = serviceResults[selectedIndex];
            if (serv) {
              addServiceToCart(serv);
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    cart.length, clearCart, activeTab, searchResults, serviceResults,
    selectedIndex, activeModal, isTempServiceModalOpen, addProductToCart,
    addServiceToCart, setSearchValue,
  ]);

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
        .map(item => {
          if (item.type === 'product') {
            return {
              type: 'product' as const,
              productId: item.product?.id ?? (item.product as any)?._id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: 0,
            };
          } else {
            const sId = item.service?.id ?? (item.service as any)?._id;
            return {
              type: 'service' as const,
              ...(sId ? { serviceId: sId } : { name: item.name }),
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: 0,
            };
          }
        });

      // If full discount, set unitPrice 0
      const finalItems = isFullDiscount
        ? items.map(item => ({ ...item, unitPrice: 0 }))
        : items;

      const createdSale = await salesRepo.createSale(accessToken, {
        items: finalItems,
        paymentMethod,
      });

      setLastCompletedSale(createdSale);
      setActiveModal('checkoutSuccess');
      // Auto-print thermal receipt ticket automatically for USB thermal printers
      document.body.classList.remove('print-doc-mode');
      document.body.classList.add('print-ticket-mode');
      setTimeout(() => {
        window.print();
      }, 200);
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') handleUnauthorized();
      else setAlertState({ isOpen: true, title: 'Error al procesar venta', message: err.message, isError: true });
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseSuccess = () => { clearCart(); setActiveModal(null); setLastCompletedSale(null); };

  const handlePrintReceipt = () => {
    document.body.classList.remove('print-doc-mode');
    document.body.classList.add('print-ticket-mode');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrintQuotation = () => {
    document.body.classList.remove('print-ticket-mode');
    document.body.classList.add('print-doc-mode');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // ── Payment Modal Keyboard Shortcuts ──────────────────────────────────────
  useEffect(() => {
    if (activeModal !== 'checkout') return;

    const handleCheckoutKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.key === '1' || e.key === 'e' || e.key === 'E') {
        setPaymentMethod('cash');
      } else if (e.key === '2' || e.key === 't' || e.key === 'T') {
        setPaymentMethod('card');
      } else if (e.key === '3' || e.key === 'r' || e.key === 'R') {
        setPaymentMethod('transfer');
      }
    };

    window.addEventListener('keydown', handleCheckoutKeyDown);
    return () => window.removeEventListener('keydown', handleCheckoutKeyDown);
  }, [activeModal]);

  // ── Success Modal Keyboard Shortcuts ──────────────────────────────────────
  useEffect(() => {
    if (activeModal !== 'checkoutSuccess') return;

    const handleSuccessKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        handleCloseSuccess();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handlePrintReceipt();
      }
    };

    window.addEventListener('keydown', handleSuccessKeyDown);
    return () => window.removeEventListener('keydown', handleSuccessKeyDown);
  }, [activeModal]);

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
                      <KbdBadge keys="Alt+P" style={{ marginLeft: '4px' }} />
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="Wrench" size="sm" />
                      Servicios
                      <KbdBadge keys="Alt+S" style={{ marginLeft: '4px' }} />
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Products Tab ───────────────────────────────────────────── */}
            {activeTab === 'products' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ position: 'relative' }}>
                    <TextInput
                      id="pos-search-input"
                      placeholder="Buscar producto por nombre o SKU... (o usa el lector de código de barras)"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                    />
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <KbdBadge keys="Alt+F" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#475569', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                    <Icon name="Keyboard" size="xs" style={{ color: '#2563eb' }} />
                    <span>Navega con <KbdBadge keys="↑ ↓ ← →" /> y presiona <KbdBadge keys="Enter ↵" /> para agregar al carrito</span>
                  </div>
                </div>
                <div style={{ flex: 1, background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', overflowY: 'auto' }}>
                  {searchResults.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '16px' }}>
                      {searchResults.map((product: Product, idx: number) => {
                        const isSelected = idx === selectedIndex;
                        return (
                          <div
                            key={product.id}
                            ref={isSelected ? highlightedCardRef : null}
                            onClick={() => setSelectedIndex(idx)}
                            style={{
                              border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                              borderRadius: '12px', padding: '16px',
                              display: 'flex', flexDirection: 'column', gap: '10px',
                              boxShadow: isSelected ? '0 0 0 3px rgba(37, 99, 235, 0.2), 0 4px 12px rgba(0,0,0,0.05)' : 'none',
                              background: isSelected ? '#f0f7ff' : 'white',
                              transition: 'all 0.15s ease-in-out', cursor: 'pointer',
                              position: 'relative',
                            }}
                          >
                            {isSelected && (
                              <div style={{ position: 'absolute', top: '-10px', right: '10px', zIndex: 1 }}>
                                <KbdBadge keys="Enter ↵" style={{ background: '#2563eb', color: 'white', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }} />
                              </div>
                            )}
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', lineHeight: 1.3 }}>{product.name}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>SKU: {product.sku}</div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                              <div>
                                <div style={{ fontSize: '17px', fontWeight: '700', color: '#2563eb' }}>
                                  ${product.sellingPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </div>
                                <div style={{ fontSize: '11px', color: product.stock <= product.minStock ? '#ef4444' : '#94a3b8' }}>
                                  Stock: {product.stock}
                                </div>
                              </div>
                              <PrimaryButton size="sm" onClick={(e) => { e.stopPropagation(); addProductToCart(product, 1); setSearchValue(''); }}>
                                <Icon name="Plus" size="sm" />
                              </PrimaryButton>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ height: '100%', minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <Icon name="Search" size="lg" className="mb-3" />
                      <p style={{ fontSize: '14px' }}>No se encontraron productos</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Services Tab ───────────────────────────────────────────── */}
            {activeTab === 'services' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <TextInput
                        id="pos-search-input"
                        placeholder="Buscar servicio por nombre..."
                        value={serviceSearchValue}
                        onChange={(e) => setServiceSearchValue(e.target.value)}
                      />
                      <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                        <KbdBadge keys="Alt+F" />
                      </div>
                    </div>
                    <PrimaryButton
                      onClick={() => setIsTempServiceModalOpen(true)}
                      style={{ background: '#f59e0b', borderColor: '#f59e0b', whiteSpace: 'nowrap' }}
                    >
                      <Icon name="Plus" size="sm" className="mr-1" />
                      Servicio
                      <KbdBadge keys="Alt+T" style={{ marginLeft: '6px' }} />
                    </PrimaryButton>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#475569', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                    <Icon name="Keyboard" size="xs" style={{ color: '#f59e0b' }} />
                    <span>Navega con <KbdBadge keys="↑ ↓ ← →" /> y presiona <KbdBadge keys="Enter ↵" /> para agregar al carrito</span>
                  </div>
                </div>

                <div style={{ flex: 1, background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', overflowY: 'auto' }}>
                  {loadingServices ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: '#94a3b8' }}>
                      <Icon name="Loader2" size="lg" className="animate-spin" />
                    </div>
                  ) : serviceResults.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                      {serviceResults.map((service, idx: number) => {
                        const isSelected = idx === selectedIndex;
                        return (
                          <div
                            key={service.id}
                            ref={isSelected ? highlightedCardRef : null}
                            onClick={() => setSelectedIndex(idx)}
                            style={{
                              border: isSelected ? '2px solid #f59e0b' : '1.5px solid #e2e8f0', borderRadius: '12px', padding: '16px',
                              display: 'flex', flexDirection: 'column', gap: '10px', height: '100%',
                              boxShadow: isSelected ? '0 0 0 3px rgba(245, 158, 11, 0.25), 0 4px 12px rgba(0,0,0,0.05)' : 'none',
                              background: isSelected ? '#fffdf5' : 'white',
                              transition: 'all 0.15s ease-in-out', cursor: 'pointer',
                              position: 'relative',
                            }}
                          >
                            {isSelected && (
                              <div style={{ position: 'absolute', top: '-10px', right: '10px', zIndex: 1 }}>
                                <KbdBadge keys="Enter ↵" style={{ background: '#f59e0b', color: 'white', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }} />
                              </div>
                            )}
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
                                {service.supplies.map((s: any, sIdx: number) => (
                                  <div key={sIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', marginBottom: '2px' }}>
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
                                onClick={(e) => { e.stopPropagation(); addServiceToCart(service); }}
                              >
                                <Icon name="Plus" size="sm" />
                                Agregar
                              </PrimaryButton>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      <Icon name="Wrench" size="lg" className="mb-3" />
                      <p style={{ fontSize: '14px' }}>No hay servicios configurados</p>
                      <p style={{ fontSize: '12px', marginTop: '4px' }}>Usa el botón "Servicio Temporal" arriba para crear uno al vuelo</p>
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
                <button onClick={() => { clearCart(); setSearchValue(''); }} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Vaciar
                  <KbdBadge keys="Alt+V" />
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
                  onClick={handlePrintQuotation}
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
                <KbdBadge keys="Alt+C" style={{ marginLeft: '8px' }} />
              </PrimaryButton>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Printable Thermal Receipt Ticket ──────────────────────────────────── */}
      <TicketReceipt sale={lastCompletedSale} branchName={activeBranchName} sellerName={user?.name} />

      {/* ── Printable Quotation Document ──────────────────────────────────────── */}
      <QuotationReceipt
        items={cart}
        subtotal={subtotal}
        tax={tax}
        total={total}
        applyTax={applyTax}
        isFullDiscount={isFullDiscount}
        branchName={activeBranchName}
        sellerName={user?.name}
      />

      {/* ── Temporary Service Modal ────────────────────────────────────────────── */}
      <TemporaryServiceModal
        isOpen={isTempServiceModalOpen}
        onClose={() => setIsTempServiceModalOpen(false)}
        availableProducts={allProductsForSupplies}
        onAddService={(name, price, supplies) => addTemporaryServiceToCart(name, price, supplies)}
      />

      {/* ── Payment Modal ─────────────────────────────────────────────────────── */}
      <Modal isOpen={activeModal === 'checkout'} onClose={() => setActiveModal(null)} onConfirm={handleCheckout} title="Confirmar Venta">
        <div style={{ marginBottom: '8px' }}>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
            Total: <strong style={{ color: '#0f172a' }}>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong>
          </p>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '10px' }}>Método de pago</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
            {[
              { value: 'cash', icon: 'DollarSign', label: 'Efectivo', key: '1' },
              { value: 'card', icon: 'CreditCard', label: 'Tarjeta (Terminal MP)', key: '2' },
              { value: 'transfer', icon: 'Smartphone', label: 'Transferencia', key: '3' },
            ].map(({ value, icon, label, key }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPaymentMethod(value as any)}
                style={{
                  padding: '14px 16px', borderRadius: '10px',
                  border: paymentMethod === value ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                  background: paymentMethod === value ? '#eff6ff' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon name={icon as any} className={paymentMethod === value ? 'text-primary' : 'text-[#64748b]'} />
                  <span style={{ fontWeight: '600', fontSize: '15px', color: paymentMethod === value ? '#2563eb' : '#0f172a' }}>{label}</span>
                </div>
                <KbdBadge keys={key} />
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <SecondaryButton onClick={() => setActiveModal(null)} disabled={processing}>
            Cancelar <KbdBadge keys="Esc" style={{ marginLeft: '6px' }} />
          </SecondaryButton>
          <PrimaryButton onClick={handleCheckout} loading={processing}>
            Confirmar y Cobrar <KbdBadge keys="Enter ↵" style={{ marginLeft: '6px' }} />
          </PrimaryButton>
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
          <div style={{ background: 'white', padding: '40px', borderRadius: '16px', width: '420px', maxWidth: '90vw', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Icon name="Check" size="lg" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', color: '#0f172a' }}>¡Venta Registrada!</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>El cobro se ha procesado correctamente.</p>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '24px' }}>
              Los insumos han sido descontados del inventario de <strong>{activeBranchName}</strong>.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <SecondaryButton className="flex-1 justify-center" onClick={handlePrintReceipt}>
                <Icon name="Printer" size="sm" className="mr-2" />
                Imprimir Ticket <KbdBadge keys="P" style={{ marginLeft: '6px' }} />
              </SecondaryButton>
              <PrimaryButton className="flex-1 justify-center" onClick={handleCloseSuccess}>
                Nueva Venta <KbdBadge keys="Enter ↵" style={{ marginLeft: '6px' }} />
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

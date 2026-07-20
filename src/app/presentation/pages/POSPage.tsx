import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Sidebar, PrimaryButton, SecondaryButton, TextInput, Modal, AlertModal } from '../components';
import { useAuthStore } from '../../../core/stores/useAuthStore';
import { usePOSStore } from '../../../core/stores/usePOSStore';
import { APIInventoryRepository } from '../../data/repositories/APIInventoryRepository';
import { APISalesRepository } from '../../data/repositories/APISalesRepository';
import type { Product } from '../../domain/entities/InventoryEntities';

const inventoryRepo = new APIInventoryRepository();
const salesRepo = new APISalesRepository();

export const POSPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, accessToken, clearAuth } = useAuthStore();
  const { 
    cart, 
    searchValue, 
    searchResults, 
    subtotal, 
    tax, 
    total,
    setSearchValue,
    setSearchResults,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  } = usePOSStore();

  const [paymentMethod, setPaymentMethod] = useState<'cash'|'card'|'transfer'>('cash');
  const [processing, setProcessing] = useState(false);
  const [activeModal, setActiveModal] = useState<'checkout' | 'checkoutSuccess' | null>(null);
  const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; isError: boolean }>({
    isOpen: false, title: '', message: '', isError: false
  });

  const handleUnauthorized = () => {
    clearAuth();
    navigate('/login');
  };

  useEffect(() => {
    const search = async () => {
      if (!accessToken || searchValue.trim() === '') {
        setSearchResults([]);
        return;
      }
      try {
        const results = await inventoryRepo.getProducts(accessToken, { search: searchValue });
        setSearchResults(results);
      } catch (err: any) {
        if (err.message === 'UNAUTHORIZED') handleUnauthorized();
      }
    };
    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line
  }, [searchValue, accessToken]);

  const handleCheckout = async () => {
    if (!accessToken || cart.length === 0) return;
    setProcessing(true);
    
    // Simulate Mercado Pago if card
    if (paymentMethod === 'card') {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    try {
      const items = cart.map(i => ({ productId: i.product.id, quantity: i.quantity }));
      await salesRepo.createSale(accessToken, { items, paymentMethod });
      
      setActiveModal('checkoutSuccess');
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') handleUnauthorized();
      else setAlertState({ isOpen: true, title: 'Error', message: err.message, isError: true });
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseSuccess = () => {
    clearCart();
    setActiveModal(null);
  };

  return (
    <div style={{ background: '#f8f9ff', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar onLogout={handleUnauthorized} userName={user?.name || 'Admin'} />

      <div style={{ marginLeft: '240px', minHeight: '100vh', display: 'flex' }}>
        
        {/* Main POS Area */}
        <main style={{ flex: 1, padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <header style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#091426' }}>Punto de Venta</h1>
          </header>

          {/* Search Bar */}
          <div style={{ marginBottom: '24px', position: 'relative' }}>
            <TextInput 
              placeholder="Buscar producto por nombre o SKU..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>

          {/* Product Grid */}
          <div style={{ flex: 1, background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', overflowY: 'auto' }}>
            {searchResults.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                {searchResults.map((product: Product) => (
                  <div key={product.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#091426' }}>{product.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>SKU: {product.sku}</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#2563eb' }}>
                      ${product.sellingPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    <PrimaryButton size="sm" onClick={() => addToCart(product, 1)}>
                      Agregar
                    </PrimaryButton>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <Icon name="Search" size="lg" className="mb-4" />
                <p>Busca un producto para agregarlo al carrito</p>
              </div>
            )}
          </div>
        </main>

        {/* Cart Sidebar */}
        <aside style={{ width: '400px', background: 'white', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#091426' }}>Carrito actual</h2>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px' }}>
                El carrito está vacío
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {cart.map(item => (
                  <div key={item.product.id} style={{ display: 'flex', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{item.product.name}</div>
                      <div style={{ fontSize: '13px', color: '#2563eb', fontWeight: '600' }}>
                        ${item.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>-</button>
                      <span style={{ fontSize: '14px', fontWeight: '600', width: '24px', textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}>+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>
                      <Icon name="Trash2" size="sm" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: '24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px', color: '#64748b' }}>
              <span>IVA (16%)</span>
              <span>${tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '20px', fontWeight: '700', color: '#091426' }}>
              <span>Total</span>
              <span>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
            </div>
            
            <PrimaryButton 
              className="w-full justify-center py-3 text-lg" 
              disabled={cart.length === 0}
              onClick={() => setActiveModal('checkout')}
            >
              Cobrar ${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </PrimaryButton>
          </div>
        </aside>

      </div>

      {/* Payment Modal */}
      <Modal isOpen={activeModal === 'checkout'} onClose={() => setActiveModal(null)} title="Método de Pago">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          <button 
            onClick={() => setPaymentMethod('cash')}
            style={{ padding: '16px', borderRadius: '12px', border: paymentMethod === 'cash' ? '2px solid #2563eb' : '1px solid #e2e8f0', background: paymentMethod === 'cash' ? '#eff6ff' : 'white', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <Icon name="DollarSign" className={paymentMethod === 'cash' ? 'text-primary' : 'text-[#64748b]'} />
            <span style={{ fontWeight: '600', fontSize: '16px' }}>Efectivo</span>
          </button>
          
          <button 
            onClick={() => setPaymentMethod('card')}
            style={{ padding: '16px', borderRadius: '12px', border: paymentMethod === 'card' ? '2px solid #2563eb' : '1px solid #e2e8f0', background: paymentMethod === 'card' ? '#eff6ff' : 'white', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <Icon name="CreditCard" className={paymentMethod === 'card' ? 'text-primary' : 'text-[#64748b]'} />
            <span style={{ fontWeight: '600', fontSize: '16px' }}>Tarjeta (Terminal MP)</span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <SecondaryButton onClick={() => setActiveModal(null)} disabled={processing}>Cancelar</SecondaryButton>
          <PrimaryButton onClick={handleCheckout} loading={processing}>Confirmar Pago</PrimaryButton>
        </div>
      </Modal>

      <AlertModal
        isOpen={alertState.isOpen}
        onClose={() => setAlertState({ ...alertState, isOpen: false })}
        title={alertState.title}
        message={alertState.message}
        isError={alertState.isError}
      />

      {/* Success Modal */}
      {activeModal === 'checkoutSuccess' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '40px', borderRadius: '16px', width: '400px', maxWidth: '90vw', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Icon name="Check" size="lg" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#091426' }}>¡Venta Exitosa!</h2>
            <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '32px' }}>El cobro se ha procesado correctamente.</p>
            <PrimaryButton className="w-full justify-center" onClick={handleCloseSuccess}>
              Nueva Venta
            </PrimaryButton>
          </div>
        </div>
      )}

    </div>
  );
};

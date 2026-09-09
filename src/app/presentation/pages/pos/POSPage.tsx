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
  ProductDetailModal,
} from '@/app/presentation/components';

import { useAuthStore, usePOSStore, usePrinterSettingsStore } from '@/app/presentation/stores';
import { thermalPrintService } from '@/core/services';
import { useBarcodeScanner } from '@/core/hooks';
import type { Sale, CartItem, Product } from '@/app/domain';

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

// ─── Cart Item Row Component ──────────────────────────────────────────────────

interface CartItemRowProps {
  cartItem: CartItem;
  onUpdateUnitPrice: (cartId: string, price: number) => void;
  onToggleItemNoAplica: (cartId: string) => void;
  onRemoveFromCart: (cartId: string) => void;
  onUpdateQuantity: (cartId: string, quantity: number) => void;
  onSelectDetailProduct: (product: Product) => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({
  cartItem,
  onUpdateUnitPrice,
  onToggleItemNoAplica,
  onRemoveFromCart,
  onUpdateQuantity,
  onSelectDetailProduct,
}) => {
  const cartItemBrand = cartItem.product
    ? typeof cartItem.product.brand === 'object' && cartItem.product.brand?.name
      ? cartItem.product.brand.name
      : typeof cartItem.product.brand === 'string'
        ? cartItem.product.brand
        : ''
    : '';

  return (
    <div className="flex justify-between items-start gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {cartItem.type === 'service' && (
            <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold border border-amber-500/20 shrink-0">
              Servicio
            </span>
          )}
          {cartItem.parentCartId && (
            <span className="text-[10px] bg-info/10 text-info px-1.5 py-0.5 rounded font-bold border border-info/20 shrink-0">
              Consumible
            </span>
          )}
          {cartItemBrand && (
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold border border-primary/20 shrink-0">
              {cartItemBrand}
            </span>
          )}
          <span className="text-xs font-bold text-base-content break-words">{cartItem.name}</span>
          {cartItem.product && (
            <button
              type="button"
              onClick={() => onSelectDetailProduct(cartItem.product!)}
              title="Ver detalles del producto"
              className="bg-transparent border-none p-0 cursor-pointer text-primary inline-flex items-center ml-0.5"
            >
              <Icon name="Info" size="xs" />
            </button>
          )}
        </div>
        {cartItem.sku && (
          <div className="text-[11px] text-base-content/50 mt-0.5">SKU: {cartItem.sku}</div>
        )}

        <div className="mt-1.5">
          <InlinePrice
            cartId={cartItem.cartId}
            unitPrice={cartItem.unitPrice}
            originalPrice={cartItem.originalPrice}
            isNoAplica={!!cartItem.isNoAplica}
            onUpdate={onUpdateUnitPrice}
          />
        </div>

        <label className={`inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer mt-1.5 select-none ${cartItem.isNoAplica ? 'text-success' : 'text-base-content/50'}`}>
          <input
            type="checkbox"
            checked={!!cartItem.isNoAplica}
            onChange={() => onToggleItemNoAplica(cartItem.cartId)}
            className="w-3.5 h-3.5 accent-success rounded cursor-pointer"
          />
          No aplica
        </label>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <button onClick={() => onRemoveFromCart(cartItem.cartId)} className="text-error border-none bg-transparent cursor-pointer p-0 hover:opacity-80">
          <Icon name="Trash2" size="sm" />
        </button>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onUpdateQuantity(cartItem.cartId, cartItem.quantity - 1)} className="w-6 h-6 rounded-md border border-base-300 bg-base-100 text-base-content hover:bg-base-200 cursor-pointer font-bold text-sm leading-none flex items-center justify-center">−</button>
          <span className="text-xs font-bold text-base-content w-5 text-center">{cartItem.quantity}</span>
          <button onClick={() => onUpdateQuantity(cartItem.cartId, cartItem.quantity + 1)} className="w-6 h-6 rounded-md border border-base-300 bg-base-100 text-base-content hover:bg-base-200 cursor-pointer font-bold text-sm leading-none flex items-center justify-center">+</button>
        </div>
        <span className="text-xs font-bold text-base-content">
          ${cartItem.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

import { useShallow } from 'zustand/react/shallow';

export const POSPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const activeBranchId = useAuthStore((s) => s.activeBranchId);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const autoPrintOnSale = usePrinterSettingsStore((s) => s.autoPrintOnSale);

  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [isTempServiceModalOpen, setIsTempServiceModalOpen] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState<Product | null>(null);

  const {
    cart,
    carts,
    activeCartId,
    searchValue,
    searchResults,
    serviceSearchValue,
    serviceResults,
    subtotal, tax, total,
    applyTax, isFullDiscount,
    toggleApplyTax,
    toggleFullDiscount,
    setSearchValue,
    setServiceSearchValue,
    addProductToCart,
    addServiceToCart,
    addTemporaryServiceToCart,
    removeFromCart,
    updateQuantity,
    updateUnitPrice,
    toggleItemNoAplica,
    clearCart,
    createCart,
    switchCart,
    deleteCart,
    renameCart,
    branches,
    allProductsForSupplies,
    loadingServices,
    loadBranches,
    loadInitialProducts,
    loadServices,
    searchProducts,
    searchServices,
    scanBarcode,
    checkoutSale,
  } = usePOSStore(
    useShallow((s) => ({
      cart: s.cart,
      carts: s.carts,
      activeCartId: s.activeCartId,
      searchValue: s.searchValue,
      searchResults: s.searchResults,
      serviceSearchValue: s.serviceSearchValue,
      serviceResults: s.serviceResults,
      subtotal: s.subtotal,
      tax: s.tax,
      total: s.total,
      applyTax: s.applyTax,
      isFullDiscount: s.isFullDiscount,
      toggleApplyTax: s.toggleApplyTax,
      toggleFullDiscount: s.toggleFullDiscount,
      setSearchValue: s.setSearchValue,
      setServiceSearchValue: s.setServiceSearchValue,
      addProductToCart: s.addProductToCart,
      addServiceToCart: s.addServiceToCart,
      addTemporaryServiceToCart: s.addTemporaryServiceToCart,
      removeFromCart: s.removeFromCart,
      updateQuantity: s.updateQuantity,
      updateUnitPrice: s.updateUnitPrice,
      toggleItemNoAplica: s.toggleItemNoAplica,
      clearCart: s.clearCart,
      createCart: s.createCart,
      switchCart: s.switchCart,
      deleteCart: s.deleteCart,
      renameCart: s.renameCart,
      branches: s.branches,
      allProductsForSupplies: s.allProductsForSupplies,
      loadingServices: s.loadingServices,
      loadBranches: s.loadBranches,
      loadInitialProducts: s.loadInitialProducts,
      loadServices: s.loadServices,
      searchProducts: s.searchProducts,
      searchServices: s.searchServices,
      scanBarcode: s.scanBarcode,
      checkoutSale: s.checkoutSale,
    }))
  );

  const [editingCartLabel, setEditingCartLabel] = useState<string | null>(null);
  const [cartLabelValue, setCartLabelValue] = useState('');

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

  const handleUnauthorized = useCallback(() => { clearAuth(); navigate('/login'); }, [clearAuth, navigate]);

  // ── Load branches ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  // ── Load initial products (15-20 products) ─────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    loadInitialProducts(accessToken).catch((err) => {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') handleUnauthorized();
    });
  }, [accessToken, handleUnauthorized, loadInitialProducts]);

  // ── Load services on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    loadServices(accessToken).catch((err) => {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') handleUnauthorized();
    });
  }, [accessToken, handleUnauthorized, loadServices]);

  const isFirstServiceSearch = useRef(true);
  const isFirstProductSearch = useRef(true);

  // ── Service search (server & client fallback) ──────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    if (isFirstServiceSearch.current) {
      isFirstServiceSearch.current = false;
      return;
    }
    const id = setTimeout(() => {
      searchServices(accessToken, serviceSearchValue).catch((err) => {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') handleUnauthorized();
      });
    }, 300);
    return () => clearTimeout(id);
  }, [serviceSearchValue, accessToken, handleUnauthorized, searchServices]);

  // ── Product search ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    if (isFirstProductSearch.current) {
      isFirstProductSearch.current = false;
      return;
    }
    const id = setTimeout(() => {
      searchProducts(accessToken, searchValue).catch((err) => {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') handleUnauthorized();
      });
    }, 300);
    return () => clearTimeout(id);
  }, [searchValue, accessToken, handleUnauthorized, searchProducts]);

  // ── Barcode Scanner Handler ───────────────────────────────────────────────
  const handleBarcodeScan = useCallback(async (barcode: string) => {
    if (!accessToken) return;
    try {
      const product = await scanBarcode(accessToken, barcode);
      if (product) {
        setSearchValue(product.sku);
        addProductToCart(product, 1);
        setAlertState({
          isOpen: true,
          title: 'Producto Escaneado',
          message: `"${product.name}" agregado al carrito automáticamente.`,
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
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') handleUnauthorized();
    }
  }, [accessToken, scanBarcode, setSearchValue, addProductToCart, handleUnauthorized]);

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
      // Alt+N -> New cart
      else if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        createCart();
      }
      // Alt+1 through Alt+9 -> Switch to cart by index
      else if (e.altKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (idx < carts.length) {
          switchCart(carts[idx].id);
        }
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
    addServiceToCart, setSearchValue, createCart, switchCart, carts,
  ]);

  const activeBranch = branches.find(b => b.id === activeBranchId);
  const activeBranchName = activeBranch?.name ?? (branches[0]?.name ?? 'Sucursal Principal');

  // ── Checkout ───────────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (!accessToken || cart.length === 0) return;
    setProcessing(true);

    if (paymentMethod === 'card') {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      const items = cart.map(item => {
        const isConsumable = Boolean(item.parentCartId);
        const price = item.isNoAplica ? 0 : item.unitPrice;
        const displayName = isConsumable
          ? (item.name.startsWith('--') ? item.name : ` -- ${item.name}`)
          : item.name;

        if (item.type === 'product') {
          return {
            type: 'product' as const,
            productId: item.product?.id || (item.product as any)?._id,
            name: displayName,
            quantity: item.quantity,
            unitPrice: price,
            discount: 0,
          };
        } else {
          const sId = item.service?.id || (item.service as any)?._id;
          return {
            type: 'service' as const,
            ...(sId ? { serviceId: sId } : {}),
            name: displayName,
            quantity: item.quantity,
            unitPrice: price,
            discount: 0,
          };
        }
      });

      // If full discount, set unitPrice 0
      const finalItems = isFullDiscount
        ? items.map(item => ({ ...item, unitPrice: 0 }))
        : items;

      const createdSale = await checkoutSale(accessToken, {
        items: finalItems,
        paymentMethod,
      });

      // Prepare enriched sale for ticket printing to guarantee consumable names and 0 pesos appear only when isNoAplica is true
      const saleForPrint: Sale = {
        ...createdSale,
        id: createdSale?.id || (createdSale as any)?._id || `sale-${Date.now()}`,
        folio: createdSale?.folio,
        items: cart.map(ci => {
          const isConsumable = Boolean(ci.parentCartId);
          const hasNoAplica = Boolean(ci.isNoAplica);
          const basePrice = ci.unitPrice > 0 ? ci.unitPrice : (ci.originalPrice ?? 0);
          const finalPrice = hasNoAplica ? 0 : basePrice;
          const displayName = isConsumable
            ? (ci.name.startsWith('--') ? ci.name : ` -- ${ci.name}`)
            : ci.name;

          return {
            ...ci,
            name: displayName,
            unitPrice: finalPrice,
            subtotal: finalPrice * ci.quantity,
            isConsumable,
            isNoAplica: hasNoAplica,
          };
        }),
        subtotal: isFullDiscount ? 0 : cart.reduce((acc, ci) => acc + (ci.isNoAplica ? 0 : ci.unitPrice) * ci.quantity, 0),
        total: isFullDiscount ? 0 : (createdSale?.total ?? (isFullDiscount ? 0 : total)),
        paymentMethod,
        createdAt: createdSale?.createdAt || new Date().toISOString(),
        branch: { id: activeBranchId || '', name: activeBranchName || '' },
      };

      setLastCompletedSale(saleForPrint);
      setActiveModal('checkoutSuccess');

      // Impresión térmica directa y optimizada (compatible con Safari / macOS y USB/Bluetooth)
      if (autoPrintOnSale) {
        thermalPrintService.print({
          sale: saleForPrint,
          branchName: activeBranchName,
          sellerName: user?.name,
          settings: usePrinterSettingsStore.getState(),
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al procesar venta';
      if (msg === 'UNAUTHORIZED') handleUnauthorized();
      else setAlertState({ isOpen: true, title: 'Error al procesar venta', message: msg, isError: true });
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseSuccess = useCallback(() => {
    // After successful checkout, delete the completed cart and move to next
    if (carts.length > 1) {
      deleteCart(activeCartId);
    } else {
      clearCart();
    }
    setActiveModal(null);
    setLastCompletedSale(null);
  }, [carts.length, deleteCart, activeCartId, clearCart, setActiveModal, setLastCompletedSale]);

  const handlePrintReceipt = useCallback(() => {
    if (lastCompletedSale) {
      thermalPrintService.print({
        sale: lastCompletedSale,
        branchName: activeBranchName,
        sellerName: user?.name,
        settings: usePrinterSettingsStore.getState(),
      });
    }
  }, [lastCompletedSale, activeBranchName, user?.name]);

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
  }, [activeModal, handleCloseSuccess, handlePrintReceipt]);

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="print:bg-white bg-base-200 text-base-content h-screen overflow-hidden font-sans">
      <div className="print:hidden h-full">
        <Sidebar onLogout={handleUnauthorized} userName={user?.name || 'Admin'} />

        <div className="ml-[240px] h-screen flex overflow-hidden">

          {/* ── Main POS Area ─────────────────────────────────────────── */}
          <main className="flex-1 p-6 flex flex-col gap-4 overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-base-content m-0">Punto de Venta</h1>
                <p className="text-xs text-base-content/60 mt-0.5">
                  Sucursal: <strong className="text-base-content">{activeBranchName}</strong>
                </p>
              </div>
            </div>

            {/* ── Tabs ───────────────────────────────────────────────────── */}
            <div className="flex gap-1 bg-base-100 p-1 rounded-xl border border-base-300 w-fit shadow-xs">
              {(['products', 'services'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === tab
                    ? 'bg-primary text-primary-content shadow-xs'
                    : 'text-base-content/70 hover:text-base-content hover:bg-base-200'
                    }`}
                >
                  {tab === 'products' ? (
                    <span className="flex items-center gap-1.5">
                      <Icon name="Package" size="sm" />
                      Productos
                      <KbdBadge keys="Alt+P" className="ml-1" />
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Icon name="Wrench" size="sm" />
                      Servicios
                      <KbdBadge keys="Alt+S" className="ml-1" />
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Products Tab ───────────────────────────────────────────── */}
            {activeTab === 'products' && (
              <>
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <TextInput
                      id="pos-search-input"
                      placeholder="Buscar producto por nombre o SKU... (o usa el lector de código de barras)"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <KbdBadge keys="Alt+F" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-base-content/70 bg-base-100 p-2 px-3 rounded-lg border border-base-300 w-fit">
                    <Icon name="Keyboard" size="xs" className="text-primary" />
                    <span>Navega con <KbdBadge keys="↑ ↓ ← →" /> y presiona <KbdBadge keys="Enter ↵" /> para agregar al carrito</span>
                  </div>
                </div>
                <div className="flex-1 bg-base-100 rounded-xl border border-base-300 p-5 overflow-y-auto min-h-0">
                  {searchResults.length > 0 ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
                      {searchResults.map((product: Product, idx: number) => {
                        const isSelected = idx === selectedIndex;
                        const brandName =
                          typeof product.brand === 'object' && product.brand?.name
                            ? product.brand.name
                            : typeof product.brand === 'string'
                              ? product.brand
                              : '';

                        return (
                          <div
                            key={product.id}
                            ref={isSelected ? highlightedCardRef : null}
                            onClick={() => setSelectedIndex(idx)}
                            className={`rounded-xl p-4 flex flex-col gap-2.5 transition-all duration-150 cursor-pointer relative border ${isSelected
                              ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md'
                              : 'border-base-300 bg-base-200/40 hover:bg-base-200/80 hover:border-base-300'
                              }`}
                          >
                            {isSelected && (
                              <div className="absolute -top-2.5 right-2.5 z-10">
                                <KbdBadge keys="Enter ↵" className="bg-primary text-primary-content border-none shadow-sm" />
                              </div>
                            )}
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-base-content leading-snug break-words">
                                  {product.name}
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                  <span className="text-[11px] text-base-content/60">SKU: {product.sku}</span>
                                  {brandName && (
                                    <span className="text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                                      <Icon name="Tag" size="xs" className="w-2.5 h-2.5" />
                                      {brandName}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDetailProduct(product);
                                }}
                                title="Ver detalles del producto"
                                className="bg-base-200 hover:bg-base-300 border border-base-300 rounded-md p-1 cursor-pointer text-base-content/70 hover:text-primary transition-all flex items-center justify-center shrink-0"
                              >
                                <Icon name="Info" size="xs" />
                              </button>
                            </div>
                            <div className="flex justify-between items-center mt-auto pt-2">
                              <div>
                                <div className="text-base font-bold text-primary">
                                  ${product.sellingPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </div>
                                <div className={`text-[11px] font-medium ${product.stock <= product.minStock ? 'text-error' : 'text-base-content/50'}`}>
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
                    <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-base-content/40">
                      <Icon name="Search" size="lg" className="mb-3" />
                      <p className="text-sm">No se encontraron productos</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Services Tab ───────────────────────────────────────────── */}
            {activeTab === 'services' && (
              <>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-3 items-center">
                    <div className="flex-1 relative">
                      <TextInput
                        id="pos-search-input"
                        placeholder="Buscar servicio por nombre..."
                        value={serviceSearchValue}
                        onChange={(e) => setServiceSearchValue(e.target.value)}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <KbdBadge keys="Alt+F" />
                      </div>
                    </div>
                    <PrimaryButton
                      onClick={() => setIsTempServiceModalOpen(true)}
                      color="warning"
                      className="whitespace-nowrap"
                    >
                      <Icon name="Plus" size="sm" className="mr-1" />
                      Servicio
                      <KbdBadge keys="Alt+T" className="ml-1.5" />
                    </PrimaryButton>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-base-content/70 bg-base-100 p-2 px-3 rounded-lg border border-base-300 w-fit">
                    <Icon name="Keyboard" size="xs" className="text-warning" />
                    <span>Navega con <KbdBadge keys="↑ ↓ ← →" /> y presiona <KbdBadge keys="Enter ↵" /> para agregar al carrito</span>
                  </div>
                </div>

                <div className="flex-1 bg-base-100 rounded-xl border border-base-300 p-5 overflow-y-auto min-h-0">
                  {loadingServices ? (
                    <div className="flex justify-center p-16 text-base-content/40">
                      <Icon name="Loader2" size="lg" className="animate-spin" />
                    </div>
                  ) : serviceResults.length > 0 ? (
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
                      {serviceResults.map((service, idx: number) => {
                        const isSelected = idx === selectedIndex;
                        return (
                          <div
                            key={service.id}
                            ref={isSelected ? highlightedCardRef : null}
                            onClick={() => setSelectedIndex(idx)}
                            className={`rounded-xl p-4 flex flex-col gap-2.5 h-full transition-all duration-150 cursor-pointer relative border ${isSelected
                              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5 shadow-md'
                              : 'border-base-300 bg-base-200/40 hover:bg-base-200/80 hover:border-base-300'
                              }`}
                          >
                            {isSelected && (
                              <div className="absolute -top-2.5 right-2.5 z-10">
                                <KbdBadge keys="Enter ↵" className="bg-amber-500 text-white border-none shadow-sm" />
                              </div>
                            )}
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                  <span className="text-xs font-bold text-base-content">{service.name}</span>
                                </div>
                                {service.description && (
                                  <p className="text-[11px] text-base-content/60 mt-0.5 leading-relaxed">{service.description}</p>
                                )}
                              </div>
                            </div>

                            {/* Supplies list */}
                            {service.supplies.length > 0 && (
                              <div className="bg-base-200 rounded-lg p-2 px-2.5">
                                <div className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider mb-1.5">
                                  Insumos incluidos
                                </div>
                                {service.supplies.map((s, sIdx: number) => (
                                  <div key={sIdx} className="flex justify-between text-xs text-base-content/70 mb-0.5">
                                    <span>• {s.product.name}</span>
                                    <span className="font-semibold text-base-content">×{s.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex justify-between items-center mt-auto pt-2">
                              <div>
                                <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                                  ${service.basePrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-[10px] text-base-content/50">Precio editable en carrito</div>
                              </div>
                              <PrimaryButton
                                size="sm"
                                color="warning"
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
                    <div className="min-h-[200px] flex flex-col items-center justify-center text-base-content/40">
                      <Icon name="Wrench" size="lg" className="mb-3" />
                      <p className="text-sm">No hay servicios configurados</p>
                      <p className="text-xs mt-1">Usa el botón "Servicio" arriba para crear uno al vuelo</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </main>

          {/* ── Cart Sidebar ───────────────────────────────────────────────── */}
          <aside className="w-[420px] bg-base-100 border-l border-base-300 flex flex-col h-screen shrink-0">

            {/* ── Multi-Cart Tabs Bar ── */}
            <div className="flex items-center gap-1 p-2 px-3 border-b border-base-300 bg-base-200/50 overflow-x-auto thin-scrollbar">
              {carts.map((c, idx) => {
                const isActive = c.id === activeCartId;
                const itemCount = c.items.filter(i => !i.parentCartId).length;
                return (
                  <div
                    key={c.id}
                    onClick={() => switchCart(c.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${isActive
                      ? 'bg-primary text-primary-content border-primary shadow-xs'
                      : 'bg-base-100 text-base-content/70 border-base-300 hover:bg-base-200'
                      }`}
                  >
                    {editingCartLabel === c.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={cartLabelValue}
                        onChange={(e) => setCartLabelValue(e.target.value)}
                        onBlur={() => { renameCart(c.id, cartLabelValue || c.label); setEditingCartLabel(null); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { renameCart(c.id, cartLabelValue || c.label); setEditingCartLabel(null); }
                          if (e.key === 'Escape') setEditingCartLabel(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-16 text-[11px] font-semibold border-b border-current outline-none bg-transparent text-inherit p-0"
                      />
                    ) : (
                      <span
                        onDoubleClick={(e) => { e.stopPropagation(); setEditingCartLabel(c.id); setCartLabelValue(c.label); }}
                        title="Doble clic para renombrar"
                      >
                        {c.label}
                      </span>
                    )}
                    {itemCount > 0 && (
                      <span className={`text-[10px] font-bold rounded-full px-1.5 min-w-4 text-center leading-tight ${isActive ? 'bg-primary-content/20 text-primary-content' : 'bg-base-300 text-base-content'
                        }`}>
                        {itemCount}
                      </span>
                    )}
                    {idx <= 8 && (
                      <span className={`text-[9px] opacity-60 px-1 py-0.5 rounded font-mono ${isActive ? 'bg-primary-content/20' : 'bg-base-200'
                        }`}>
                        Alt+{idx + 1}
                      </span>
                    )}
                    {carts.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteCart(c.id); }}
                        className="bg-transparent border-none cursor-pointer p-0 text-inherit opacity-70 hover:opacity-100 flex items-center"
                        title="Cerrar este carrito"
                      >
                        <Icon name="X" size="xs" />
                      </button>
                    )}
                  </div>
                );
              })}
              {/* Add new cart button */}
              <button
                onClick={() => createCart()}
                title="Nuevo carrito (Alt+N)"
                className="flex items-center justify-center gap-1 px-2.5 h-7 rounded-lg border border-dashed border-base-300 hover:border-primary text-base-content/60 hover:text-primary cursor-pointer text-sm shrink-0 transition-all bg-transparent"
              >
                <Icon name="Plus" size="xs" />
                <KbdBadge keys="Alt+N" />
              </button>
            </div>

            {/* Cart header */}
            <div className="p-3.5 px-6 border-b border-base-300 flex justify-between items-center bg-base-100">
              <div className="flex items-center gap-2">
                <Icon name="ShoppingCart" size="sm" />
                <h2 className="text-sm font-bold text-base-content m-0">
                  {carts.find(c => c.id === activeCartId)?.label || 'Carrito'}
                </h2>
                {cart.length > 0 && (
                  <span className="bg-primary text-primary-content text-[11px] font-bold rounded-full px-2 py-0.5 leading-none">
                    {cart.length}
                  </span>
                )}
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => { clearCart(); setSearchValue(''); }}
                  className="text-xs text-error bg-transparent border-none cursor-pointer font-semibold flex items-center gap-1 hover:opacity-80"
                >
                  Vaciar
                  <KbdBadge keys="Alt+V" />
                </button>
              )}
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-4 px-6">
              {cart.length === 0 ? (
                <div className="text-center text-base-content/40 mt-16">
                  <Icon name="ShoppingCart" size="lg" className="mb-3 mx-auto" />
                  <p className="text-sm font-medium">El carrito está vacío</p>
                  <p className="text-xs mt-1">Agrega productos o servicios</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {cart.filter(item => !item.parentCartId).map(item => {
                    const childItems = cart.filter(child => child.parentCartId === item.cartId);

                    return (
                      <div key={item.cartId} className="border border-base-300 rounded-xl p-3 bg-base-200/40">
                        <CartItemRow
                          cartItem={item}
                          onUpdateUnitPrice={updateUnitPrice}
                          onToggleItemNoAplica={toggleItemNoAplica}
                          onRemoveFromCart={removeFromCart}
                          onUpdateQuantity={updateQuantity}
                          onSelectDetailProduct={setSelectedDetailProduct}
                        />

                        {childItems.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-dashed border-base-300 flex flex-col gap-2">
                            {childItems.map(child => (
                              <div key={child.cartId} className="border border-info/30 rounded-lg p-2.5 bg-info/5">
                                <CartItemRow
                                  cartItem={child}
                                  onUpdateUnitPrice={updateUnitPrice}
                                  onToggleItemNoAplica={toggleItemNoAplica}
                                  onRemoveFromCart={removeFromCart}
                                  onUpdateQuantity={updateQuantity}
                                  onSelectDetailProduct={setSelectedDetailProduct}
                                />
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
            <div className="p-4 px-6 border-t border-base-300 bg-base-200/50">
              {cart.length > 0 && (
                <div className="mb-3.5 flex flex-col gap-2">
                  {/* IVA */}
                  <label className="flex items-center gap-2 p-2 px-3 bg-primary/10 border border-primary/20 rounded-lg cursor-pointer select-none text-xs font-semibold text-primary">
                    <input type="checkbox" checked={applyTax} onChange={(e) => toggleApplyTax(e.target.checked)} className="w-4 h-4 accent-primary rounded cursor-pointer" />
                    <span>
                      Aplicar IVA <span className="font-normal opacity-80">(16%)</span>
                    </span>
                  </label>

                  {/* Full discount */}
                  <label className="flex items-center gap-2 p-2 px-3 bg-success/10 border border-success/20 rounded-lg cursor-pointer select-none text-xs font-semibold text-success">
                    <input type="checkbox" checked={isFullDiscount} onChange={(e) => toggleFullDiscount(e.target.checked)} className="w-4 h-4 accent-success rounded cursor-pointer" />
                    <span>
                      No aplica <span className="font-normal opacity-80">(100% Gratis)</span>
                    </span>
                  </label>
                </div>
              )}

              {/* Totals */}
              <div className="text-xs text-base-content/70 flex justify-between mb-1.5">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              {isFullDiscount && (
                <div className="text-xs text-success flex justify-between mb-1.5 font-semibold">
                  <span>Descuento (100%)</span>
                  <span>-${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="text-xs text-base-content/70 flex justify-between mb-3">
                <span>IVA {applyTax ? '(16%)' : '(No aplicable)'}</span>
                <span>${tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="text-lg font-extrabold text-base-content flex justify-between mb-4">
                <span>Total</span>
                <span>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2.5 mb-2.5">
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
                <KbdBadge keys="Alt+C" className="ml-2" />
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
            {(
              [
                { value: 'cash' as const, icon: 'DollarSign' as const, label: 'Efectivo', key: '1' },
                { value: 'card' as const, icon: 'CreditCard' as const, label: 'Tarjeta (Terminal MP)', key: '2' },
                { value: 'transfer' as const, icon: 'Smartphone' as const, label: 'Transferencia', key: '3' },
              ]
            ).map(({ value, icon, label, key }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPaymentMethod(value)}
                style={{
                  padding: '14px 16px', borderRadius: '10px',
                  border: paymentMethod === value ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                  background: paymentMethod === value ? '#eff6ff' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon name={icon} className={paymentMethod === value ? 'text-primary' : 'text-[#64748b]'} />
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

      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={!!selectedDetailProduct}
        onClose={() => setSelectedDetailProduct(null)}
        product={selectedDetailProduct}
        onAddToCart={(prod: Product) => addProductToCart(prod, 1)}
      />
    </div>
  );
};

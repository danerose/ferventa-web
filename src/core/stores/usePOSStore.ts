import { create } from 'zustand';
import type { Product } from '../../app/domain/entities/InventoryEntities';
import type { SaleItem } from '../../app/domain/entities/SalesEntities';

interface POSState {
  cart: SaleItem[];
  searchValue: string;
  searchResults: Product[];
  loading: boolean;
  error: string | null;
  activeModal: 'payment' | 'checkoutSuccess' | null;
  
  // Totals
  subtotal: number;
  tax: number;
  total: number;
  applyTax: boolean;
  isFullDiscount: boolean;

  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleItemNoAplica: (productId: string, val?: boolean) => void;
  clearCart: () => void;
  toggleApplyTax: (val?: boolean) => void;
  toggleFullDiscount: (val?: boolean) => void;
  
  setSearchValue: (val: string) => void;
  setSearchResults: (results: Product[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveModal: (modal: 'payment' | 'checkoutSuccess' | null) => void;
  calculateTotals: () => void;
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  searchValue: '',
  searchResults: [],
  loading: false,
  error: null,
  activeModal: null,
  
  subtotal: 0,
  tax: 0,
  total: 0,
  applyTax: false,
  isFullDiscount: false,

  calculateTotals: () => {
    const { cart, applyTax, isFullDiscount } = get();
    const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    if (isFullDiscount) {
      set({ subtotal, tax: 0, total: 0 });
    } else if (applyTax) {
      const tax = subtotal * 0.16;
      const total = subtotal + tax;
      set({ subtotal, tax, total });
    } else {
      set({ subtotal, tax: 0, total: subtotal });
    }
  },

  toggleApplyTax: (val) => {
    const current = get().applyTax;
    const nextVal = val !== undefined ? val : !current;
    set({ applyTax: nextVal });
    get().calculateTotals();
  },

  toggleFullDiscount: (val) => {
    const current = get().isFullDiscount;
    const nextVal = val !== undefined ? val : !current;
    set({ isFullDiscount: nextVal });
    get().calculateTotals();
  },

  addToCart: (product, quantity) => {
    const { cart } = get();
    const existing = cart.find(item => item.product.id === product.id);
    
    if (existing) {
      const updatedCart = cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * item.unitPrice }
          : item
      );
      set({ cart: updatedCart });
    } else {
      set({ cart: [...cart, { product, quantity, unitPrice: product.sellingPrice, originalPrice: product.sellingPrice, isNoAplica: false, subtotal: quantity * product.sellingPrice }] });
    }
    get().calculateTotals();
  },

  removeFromCart: (productId) => {
    set({ cart: get().cart.filter(item => item.product.id !== productId) });
    get().calculateTotals();
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    const updatedCart = get().cart.map(item => 
      item.product.id === productId 
        ? { ...item, quantity, subtotal: quantity * item.unitPrice }
        : item
    );
    set({ cart: updatedCart });
    get().calculateTotals();
  },

  toggleItemNoAplica: (productId, val) => {
    const updatedCart = get().cart.map(item => {
      if (item.product.id !== productId) return item;

      const isNoAplica = val !== undefined ? val : !item.isNoAplica;
      const originalPrice = item.originalPrice ?? (item.unitPrice > 0 ? item.unitPrice : item.product.sellingPrice);
      const newUnitPrice = isNoAplica ? 0 : originalPrice;
      const newSubtotal = item.quantity * newUnitPrice;

      return {
        ...item,
        originalPrice,
        isNoAplica,
        unitPrice: newUnitPrice,
        subtotal: newSubtotal,
      };
    });

    set({ cart: updatedCart });
    get().calculateTotals();
  },

  clearCart: () => {
    set({ cart: [], subtotal: 0, tax: 0, total: 0, applyTax: false, isFullDiscount: false });
  },

  setSearchValue: (searchValue) => set({ searchValue }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setActiveModal: (activeModal) => set({ activeModal }),
}));

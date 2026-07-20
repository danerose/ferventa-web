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

  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
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

  calculateTotals: () => {
    const { cart } = get();
    const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
    const tax = subtotal * 0.16;
    const total = subtotal + tax;
    set({ subtotal, tax, total });
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
      set({ cart: [...cart, { product, quantity, unitPrice: product.sellingPrice, subtotal: quantity * product.sellingPrice }] });
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

  clearCart: () => {
    set({ cart: [], subtotal: 0, tax: 0, total: 0 });
  },

  setSearchValue: (searchValue) => set({ searchValue }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setActiveModal: (activeModal) => set({ activeModal }),
}));

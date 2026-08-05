import { create } from 'zustand';
import type { Product } from '../../app/domain/entities/InventoryEntities';
import type {
  CartItem,
  PredefinedService,
} from '../../app/domain/entities/SalesEntities';

export type { CartItem, PredefinedService };


interface POSState {
  cart: CartItem[];
  searchValue: string;
  searchResults: Product[];
  serviceSearchValue: string;
  serviceResults: PredefinedService[];
  loading: boolean;
  error: string | null;
  activeModal: 'payment' | 'checkoutSuccess' | null;
  activeTab: 'products' | 'services';

  // Totals
  subtotal: number;
  tax: number;
  total: number;
  applyTax: boolean;
  isFullDiscount: boolean;

  // Cart actions
  addProductToCart: (product: Product, quantity?: number) => void;
  addServiceToCart: (service: PredefinedService) => void;
  addTemporaryServiceToCart: (
    name: string,
    unitPrice: number,
    supplies: { product: Product; quantity: number; unitPrice: number }[]
  ) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  updateUnitPrice: (cartId: string, newPrice: number) => void;
  toggleItemNoAplica: (cartId: string, val?: boolean) => void;
  clearCart: () => void;

  // Totals toggles
  toggleApplyTax: (val?: boolean) => void;
  toggleFullDiscount: (val?: boolean) => void;
  calculateTotals: () => void;
  setActiveTab: (tab: 'products' | 'services') => void;

  // Search
  setSearchValue: (val: string) => void;
  setSearchResults: (results: Product[]) => void;
  setServiceSearchValue: (val: string) => void;
  setServiceResults: (results: PredefinedService[]) => void;

  // Misc
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveModal: (modal: 'payment' | 'checkoutSuccess' | null) => void;
}

function makeCartId(): string {
  return `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const usePOSStore = create<POSState>((set, get) => ({
  cart: [],
  searchValue: '',
  searchResults: [],
  serviceSearchValue: '',
  serviceResults: [],
  loading: false,
  error: null,
  activeModal: null,
  activeTab: 'products',

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
      set({ subtotal, tax, total: subtotal + tax });
    } else {
      set({ subtotal, tax: 0, total: subtotal });
    }
  },

  toggleApplyTax: (val) => {
    const next = val !== undefined ? val : !get().applyTax;
    set({ applyTax: next });
    get().calculateTotals();
  },

  toggleFullDiscount: (val) => {
    const next = val !== undefined ? val : !get().isFullDiscount;
    set({ isFullDiscount: next });
    get().calculateTotals();
  },

  addProductToCart: (product, quantity = 1) => {
    const { cart } = get();
    const existing = cart.find(
      (item) => item.type === 'product' && item.product?.id === product.id
    );

    const currentQty = existing ? existing.quantity : 0;
    if (currentQty + quantity > product.stock) {
      get().setError(`Stock insuficiente. Solo hay ${product.stock} unidades disponibles de ${product.name}.`);
      return;
    }

    if (existing) {
      const newQty = existing.quantity + quantity;
      const updatedCart = cart.map((item) =>
        item.cartId === existing.cartId
          ? { ...item, quantity: newQty, subtotal: newQty * item.unitPrice }
          : item
      );
      set({ cart: updatedCart });
    } else {
      const newItem: CartItem = {
        cartId: makeCartId(),
        type: 'product',
        product,
        name: product.name,
        sku: product.sku,
        quantity,
        unitPrice: product.sellingPrice,
        originalPrice: product.sellingPrice,
        subtotal: quantity * product.sellingPrice,
        isNoAplica: false,
      };
      set({ cart: [...cart, newItem] });
    }
    get().calculateTotals();
  },

  addServiceToCart: (service) => {
    const { cart } = get();

    // 1. Add the service itself (labor/base cost)
    const serviceItem: CartItem = {
      cartId: makeCartId(),
      type: 'service',
      service,
      name: service.name,
      quantity: 1,
      unitPrice: service.basePrice,
      originalPrice: service.basePrice,
      subtotal: service.basePrice,
      isNoAplica: false,
    };

    // 2. Add each supply as a regular product item so they can be modified independently
    const supplyItems: CartItem[] = service.supplies.map(supply => ({
      cartId: makeCartId(),
      parentCartId: serviceItem.cartId,
      type: 'product',
      product: supply.product as any, // Cast since the structure is mostly compatible
      name: supply.product.name,
      sku: supply.product.sku,
      quantity: supply.quantity,
      unitPrice: supply.product.sellingPrice,
      originalPrice: supply.product.sellingPrice,
      subtotal: supply.product.sellingPrice * supply.quantity,
      isNoAplica: false,
    }));

    set({ cart: [...cart, serviceItem, ...supplyItems] });
    get().calculateTotals();
  },

  addTemporaryServiceToCart: (name, unitPrice, supplies) => {
    const { cart } = get();

    const serviceItem: CartItem = {
      cartId: makeCartId(),
      type: 'service',
      name: name.trim(),
      quantity: 1,
      unitPrice,
      originalPrice: unitPrice,
      subtotal: unitPrice,
      isNoAplica: false,
    };

    const supplyItems: CartItem[] = supplies.map(s => ({
      cartId: makeCartId(),
      parentCartId: serviceItem.cartId,
      type: 'product',
      product: s.product,
      name: s.product.name,
      sku: s.product.sku,
      quantity: s.quantity,
      unitPrice: s.unitPrice,
      originalPrice: s.product.sellingPrice,
      subtotal: s.unitPrice * s.quantity,
      isNoAplica: false,
    }));

    set({ cart: [...cart, serviceItem, ...supplyItems] });
    get().calculateTotals();
  },

  removeFromCart: (cartId) => {
    set({ cart: get().cart.filter((item) => item.cartId !== cartId && item.parentCartId !== cartId) });
    get().calculateTotals();
  },

  updateQuantity: (cartId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(cartId);
      return;
    }

    const item = get().cart.find(i => i.cartId === cartId);
    if (item?.type === 'product' && item.product && quantity > item.product.stock) {
      get().setError(`Stock insuficiente. Solo hay ${item.product.stock} unidades disponibles de ${item.product.name}.`);
      return;
    }

    const updatedCart = get().cart.map((item) =>
      item.cartId === cartId
        ? { ...item, quantity, subtotal: item.isNoAplica ? 0 : quantity * item.unitPrice }
        : item
    );
    set({ cart: updatedCart });
    get().calculateTotals();
  },

  updateUnitPrice: (cartId, newPrice) => {
    const updatedCart = get().cart.map((item) => {
      if (item.cartId !== cartId) return item;
      const price = Math.max(0, newPrice);
      return {
        ...item,
        unitPrice: price,
        subtotal: item.isNoAplica ? 0 : item.quantity * price,
      };
    });
    set({ cart: updatedCart });
    get().calculateTotals();
  },

  toggleItemNoAplica: (cartId, val) => {
    const updatedCart = get().cart.map((item) => {
      if (item.cartId !== cartId) return item;
      const isNoAplica = val !== undefined ? val : !item.isNoAplica;
      return {
        ...item,
        isNoAplica,
        unitPrice: isNoAplica ? 0 : item.unitPrice === 0 ? item.originalPrice : item.unitPrice,
        subtotal: item.quantity * (isNoAplica ? 0 : item.unitPrice === 0 ? item.originalPrice : item.unitPrice),
      };
    });
    set({ cart: updatedCart });
    get().calculateTotals();
  },

  clearCart: () => {
    set({
      cart: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      applyTax: false,
      isFullDiscount: false,
    });
  },

  setActiveTab: (activeTab) => set({ activeTab }),
  setSearchValue: (searchValue) => set({ searchValue }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setServiceSearchValue: (serviceSearchValue) => set({ serviceSearchValue }),
  setServiceResults: (serviceResults) => set({ serviceResults }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setActiveModal: (activeModal) => set({ activeModal }),
}));

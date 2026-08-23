import { create } from 'zustand';
import type { Product } from '@/app/domain';
import type {
  CartItem,
  PredefinedService,
} from '@/app/domain';

export type { CartItem, PredefinedService };

// ─── Cart Instance ────────────────────────────────────────────────────────────

export interface Cart {
  id: string;
  label: string;
  items: CartItem[];
  applyTax: boolean;
  isFullDiscount: boolean;
  createdAt: number;
}

function makeCartId(): string {
  return `cart-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeNewCart(label?: string): Cart {
  const id = makeCartId();
  return {
    id,
    label: label || 'Venta',
    items: [],
    applyTax: false,
    isFullDiscount: false,
    createdAt: Date.now(),
  };
}

function calculateCartTotals(cart: Cart) {
  const subtotal = cart.items.reduce((acc, item) => acc + item.subtotal, 0);
  if (cart.isFullDiscount) {
    return { subtotal, tax: 0, total: 0 };
  } else if (cart.applyTax) {
    const tax = subtotal * 0.16;
    return { subtotal, tax, total: subtotal + tax };
  } else {
    return { subtotal, tax: 0, total: subtotal };
  }
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface POSState {
  // Multi-cart state
  carts: Cart[];
  activeCartId: string;

  // Search state (shared across carts)
  searchValue: string;
  searchResults: Product[];
  serviceSearchValue: string;
  serviceResults: PredefinedService[];
  loading: boolean;
  error: string | null;
  activeModal: 'payment' | 'checkoutSuccess' | null;
  activeTab: 'products' | 'services';

  // Computed from active cart
  cart: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  applyTax: boolean;
  isFullDiscount: boolean;

  // Multi-cart actions
  createCart: (label?: string) => void;
  switchCart: (cartId: string) => void;
  deleteCart: (cartId: string) => void;
  renameCart: (cartId: string, label: string) => void;

  // Cart actions (operate on active cart)
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getActiveCart(state: { carts: Cart[]; activeCartId: string }): Cart {
  return state.carts.find(c => c.id === state.activeCartId) || state.carts[0];
}

function updateActiveCart(
  state: { carts: Cart[]; activeCartId: string },
  updater: (cart: Cart) => Cart,
) {
  return state.carts.map(c =>
    c.id === state.activeCartId ? updater(c) : c
  );
}

function syncFromActiveCart(carts: Cart[], activeCartId: string) {
  const active = carts.find(c => c.id === activeCartId) || carts[0];
  const totals = calculateCartTotals(active);
  return {
    carts,
    cart: active.items,
    applyTax: active.applyTax,
    isFullDiscount: active.isFullDiscount,
    ...totals,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

const initialCart = makeNewCart();

export const usePOSStore = create<POSState>((set, get) => ({
  carts: [initialCart],
  activeCartId: initialCart.id,

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

  // ── Multi-cart actions ──────────────────────────────────────────────────────

  createCart: (label) => {
    const { carts } = get();
    const newCart = makeNewCart(label || `Venta ${carts.length + 1}`);
    const newCarts = [...carts, newCart];
    set({
      ...syncFromActiveCart(newCarts, newCart.id),
      activeCartId: newCart.id,
    });
  },

  switchCart: (cartId) => {
    const { carts } = get();
    const target = carts.find(c => c.id === cartId);
    if (!target) return;
    set({
      activeCartId: cartId,
      ...syncFromActiveCart(carts, cartId),
    });
  },

  deleteCart: (cartId) => {
    const { carts, activeCartId } = get();
    if (carts.length <= 1) {
      // Can't delete the last cart, just clear it
      get().clearCart();
      return;
    }
    const newCarts = carts.filter(c => c.id !== cartId);
    const newActiveId = cartId === activeCartId
      ? newCarts[0].id
      : activeCartId;
    set({
      ...syncFromActiveCart(newCarts, newActiveId),
      activeCartId: newActiveId,
    });
  },

  renameCart: (cartId, label) => {
    const { carts } = get();
    const newCarts = carts.map(c =>
      c.id === cartId ? { ...c, label } : c
    );
    set({ carts: newCarts });
    // No need to sync totals, label doesn't affect them
  },

  // ── Calculate Totals ────────────────────────────────────────────────────────

  calculateTotals: () => {
    const { carts, activeCartId } = get();
    set(syncFromActiveCart(carts, activeCartId));
  },

  toggleApplyTax: (val) => {
    const { activeCartId } = get();
    const next = val !== undefined ? val : !get().applyTax;
    const newCarts = updateActiveCart(get(), cart => ({ ...cart, applyTax: next }));
    set(syncFromActiveCart(newCarts, activeCartId));
  },

  toggleFullDiscount: (val) => {
    const { activeCartId } = get();
    const next = val !== undefined ? val : !get().isFullDiscount;
    const newCarts = updateActiveCart(get(), cart => ({ ...cart, isFullDiscount: next }));
    set(syncFromActiveCart(newCarts, activeCartId));
  },

  // ── Cart Item Actions ───────────────────────────────────────────────────────

  addProductToCart: (product, quantity = 1) => {
    const { activeCartId } = get();
    const activeCart = getActiveCart(get());
    const existing = activeCart.items.find(
      (item) => item.type === 'product' && item.product?.id === product.id
    );

    const currentQty = existing ? existing.quantity : 0;
    if (currentQty + quantity > product.stock) {
      get().setError(`Stock insuficiente. Solo hay ${product.stock} unidades disponibles de ${product.name}.`);
      return;
    }

    let newItems: CartItem[];
    if (existing) {
      const newQty = existing.quantity + quantity;
      newItems = activeCart.items.map((item) =>
        item.cartId === existing.cartId
          ? { ...item, quantity: newQty, subtotal: newQty * item.unitPrice }
          : item
      );
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
      newItems = [...activeCart.items, newItem];
    }

    const newCarts = updateActiveCart(get(), cart => ({ ...cart, items: newItems }));
    set(syncFromActiveCart(newCarts, activeCartId));
  },

  addServiceToCart: (service) => {
    const { activeCartId } = get();
    const activeCart = getActiveCart(get());

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

    const supplyItems: CartItem[] = service.supplies.map(supply => ({
      cartId: makeCartId(),
      parentCartId: serviceItem.cartId,
      type: 'product',
      product: supply.product as any,
      name: supply.product.name,
      sku: supply.product.sku,
      quantity: supply.quantity,
      unitPrice: supply.product.sellingPrice,
      originalPrice: supply.product.sellingPrice,
      subtotal: supply.product.sellingPrice * supply.quantity,
      isNoAplica: false,
    }));

    const newItems = [...activeCart.items, serviceItem, ...supplyItems];
    const newCarts = updateActiveCart(get(), cart => ({ ...cart, items: newItems }));
    set(syncFromActiveCart(newCarts, activeCartId));
  },

  addTemporaryServiceToCart: (name, unitPrice, supplies) => {
    const { activeCartId } = get();
    const activeCart = getActiveCart(get());

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

    const newItems = [...activeCart.items, serviceItem, ...supplyItems];
    const newCarts = updateActiveCart(get(), cart => ({ ...cart, items: newItems }));
    set(syncFromActiveCart(newCarts, activeCartId));
  },

  removeFromCart: (cartId) => {
    const { activeCartId } = get();
    const activeCart = getActiveCart(get());
    const newItems = activeCart.items.filter((item) => item.cartId !== cartId && item.parentCartId !== cartId);
    const newCarts = updateActiveCart(get(), cart => ({ ...cart, items: newItems }));
    set(syncFromActiveCart(newCarts, activeCartId));
  },

  updateQuantity: (cartId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(cartId);
      return;
    }

    const activeCart = getActiveCart(get());
    const item = activeCart.items.find(i => i.cartId === cartId);
    if (item?.type === 'product' && item.product && quantity > item.product.stock) {
      get().setError(`Stock insuficiente. Solo hay ${item.product.stock} unidades disponibles de ${item.product.name}.`);
      return;
    }

    const { activeCartId } = get();
    const newItems = activeCart.items.map((item) =>
      item.cartId === cartId
        ? { ...item, quantity, subtotal: item.isNoAplica ? 0 : quantity * item.unitPrice }
        : item
    );
    const newCarts = updateActiveCart(get(), cart => ({ ...cart, items: newItems }));
    set(syncFromActiveCart(newCarts, activeCartId));
  },

  updateUnitPrice: (cartId, newPrice) => {
    const { activeCartId } = get();
    const activeCart = getActiveCart(get());
    const newItems = activeCart.items.map((item) => {
      if (item.cartId !== cartId) return item;
      const price = Math.max(0, newPrice);
      return {
        ...item,
        unitPrice: price,
        subtotal: item.isNoAplica ? 0 : item.quantity * price,
      };
    });
    const newCarts = updateActiveCart(get(), cart => ({ ...cart, items: newItems }));
    set(syncFromActiveCart(newCarts, activeCartId));
  },

  toggleItemNoAplica: (cartId, val) => {
    const { activeCartId } = get();
    const activeCart = getActiveCart(get());
    const newItems = activeCart.items.map((item) => {
      if (item.cartId !== cartId) return item;
      const isNoAplica = val !== undefined ? val : !item.isNoAplica;
      return {
        ...item,
        isNoAplica,
        unitPrice: isNoAplica ? 0 : item.unitPrice === 0 ? item.originalPrice : item.unitPrice,
        subtotal: item.quantity * (isNoAplica ? 0 : item.unitPrice === 0 ? item.originalPrice : item.unitPrice),
      };
    });
    const newCarts = updateActiveCart(get(), cart => ({ ...cart, items: newItems }));
    set(syncFromActiveCart(newCarts, activeCartId));
  },

  clearCart: () => {
    const { activeCartId, carts } = get();
    const newCarts = carts.map(c =>
      c.id === activeCartId
        ? { ...c, items: [], applyTax: false, isFullDiscount: false }
        : c
    );
    set(syncFromActiveCart(newCarts, activeCartId));
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

import { create } from 'zustand';
import type {
  Product,
  CartItem,
  PredefinedService,
  Branch,
  Sale,
} from '@/app/domain';
import { posUseCases } from '@/core/di/container';

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

  // Catalog & Branch data
  branches: Branch[];
  initialProducts: Product[];
  allProductsForSupplies: Product[];
  allServices: PredefinedService[];
  loadingServices: boolean;

  // Async actions using POSUseCases
  loadBranches: () => Promise<Branch[]>;
  loadInitialProducts: (accessToken: string) => Promise<void>;
  loadServices: (accessToken: string) => Promise<void>;
  searchProducts: (accessToken: string, query: string) => Promise<void>;
  searchServices: (accessToken: string, query: string) => Promise<void>;
  scanBarcode: (accessToken: string, barcode: string) => Promise<Product | null>;
  checkoutSale: (accessToken: string, saleData: Parameters<typeof posUseCases.createSale>[1]) => Promise<Sale>;

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
    const { activeCartId, allProductsForSupplies } = get();
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

    const supplyItems: CartItem[] = service.supplies.map(supply => {
      const prodId = supply.product.id || supply.product._id;
      const catalogProd = allProductsForSupplies.find(
        p => p.id === prodId || (p as any)._id === prodId
      );
      const prodName = supply.product.name || catalogProd?.name || 'Insumo de servicio';
      const prodSku = supply.product.sku || catalogProd?.sku || '';
      const prodPrice = (supply.product.sellingPrice && supply.product.sellingPrice > 0)
        ? supply.product.sellingPrice
        : (catalogProd?.sellingPrice ?? (catalogProd as any)?.price ?? (supply.product as any)?.price ?? 0);

      return {
        cartId: makeCartId(),
        parentCartId: serviceItem.cartId,
        type: 'product',
        product: {
          ...(catalogProd || {}),
          ...supply.product,
          id: prodId,
          name: prodName,
          sku: prodSku,
          sellingPrice: prodPrice,
        } as unknown as Product,
        name: prodName,
        sku: prodSku,
        quantity: supply.quantity,
        unitPrice: prodPrice,
        originalPrice: prodPrice,
        subtotal: prodPrice * supply.quantity,
        isNoAplica: false,
      };
    });

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

    const supplyItems: CartItem[] = supplies.map(s => {
      const price = typeof s.unitPrice === 'number' && s.unitPrice >= 0
        ? s.unitPrice
        : (s.product?.sellingPrice ?? (s.product as any)?.price ?? 0);
      return {
        cartId: makeCartId(),
        parentCartId: serviceItem.cartId,
        type: 'product',
        product: s.product,
        name: s.product.name,
        sku: s.product.sku,
        quantity: s.quantity,
        unitPrice: price,
        originalPrice: s.product?.sellingPrice || price,
        subtotal: price * s.quantity,
        isNoAplica: false,
      };
    });

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
        originalPrice: price > 0 ? price : item.originalPrice,
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
      const basePrice = item.originalPrice > 0 ? item.originalPrice : (item.unitPrice > 0 ? item.unitPrice : 0);
      const finalPrice = isNoAplica ? 0 : basePrice;
      return {
        ...item,
        isNoAplica,
        unitPrice: finalPrice,
        subtotal: item.quantity * finalPrice,
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

  branches: [],
  initialProducts: [],
  allProductsForSupplies: [],
  allServices: [],
  loadingServices: false,

  loadBranches: async () => {
    try {
      const branches = await posUseCases.getBranches();
      set({ branches });
      return branches;
    } catch {
      return [];
    }
  },

  loadInitialProducts: async (accessToken: string) => {
    const { initial, allForSupplies } = await posUseCases.getInitialProducts(accessToken);
    set({
      initialProducts: initial,
      allProductsForSupplies: allForSupplies,
    });
    if (!get().searchValue.trim()) {
      set({ searchResults: initial });
    }
  },

  loadServices: async (accessToken: string) => {
    set({ loadingServices: true });
    try {
      const services = await posUseCases.getServices(accessToken);
      set({ allServices: services, serviceResults: services });
    } finally {
      set({ loadingServices: false });
    }
  },

  searchProducts: async (accessToken: string, query: string) => {
    if (!query.trim()) {
      set({ searchResults: get().initialProducts });
      return;
    }
    const results = await posUseCases.getProducts(accessToken, query);
    set({ searchResults: results });
  },

  searchServices: async (accessToken: string, query: string) => {
    if (!query.trim()) {
      set({ serviceResults: get().allServices });
      return;
    }
    try {
      const results = await posUseCases.getServices(accessToken, query);
      set({ serviceResults: results });
    } catch {
      const q = query.toLowerCase();
      set({
        serviceResults: get().allServices.filter(s =>
          s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
        ),
      });
    }
  },

  scanBarcode: async (accessToken: string, barcode: string) => {
    return posUseCases.findProductByBarcode(accessToken, barcode);
  },

  checkoutSale: async (accessToken: string, saleData) => {
    return posUseCases.createSale(accessToken, saleData);
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

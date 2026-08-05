import { create } from 'zustand';
import type { Brand, Category, Provider, Product, StockMovement } from '../../app/domain/entities/InventoryEntities';

interface InventoryState {
  brands: Brand[];
  categories: Category[];
  providers: Provider[];
  products: Product[];
  movements: StockMovement[];
  loading: boolean;
  error: string | null;
  activeTab: 'inventory' | 'providers' | 'categories' | 'brands' | 'services';
  searchValue: string;
  categoryFilter: string;
  activeModal: 'addProduct' | 'addProvider' | 'addProductBatch' | 'stockAdjustment' | 'addMovement' | 'addService' | null;
  selectedProduct: Product | null;
  selectedProvider: Provider | null;

  // Pagination state
  page: number;
  limit: number;
  total: number;
  totalPages: number;

  setBrands: (brands: Brand[]) => void;
  setCategories: (categories: Category[]) => void;
  setProviders: (providers: Provider[]) => void;
  setProducts: (products: Product[]) => void;
  setMovements: (movements: StockMovement[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: 'inventory' | 'providers' | 'categories' | 'brands' | 'services') => void;
  setSearchValue: (val: string) => void;
  setCategoryFilter: (val: string) => void;
  setActiveModal: (modal: 'addProduct' | 'addProvider' | 'addProductBatch' | 'stockAdjustment' | 'addMovement' | 'addService' | null) => void;
  setSelectedProduct: (product: Product | null) => void;
  setSelectedProvider: (provider: Provider | null) => void;

  setPage: (page: number) => void;
  setPagination: (data: { page: number; limit: number; total: number; totalPages: number }) => void;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  brands: [],
  categories: [],
  providers: [],
  products: [],
  movements: [],
  loading: false,
  error: null,
  activeTab: 'inventory',
  searchValue: '',
  categoryFilter: 'all',
  activeModal: null,
  selectedProduct: null,
  selectedProvider: null,

  page: 1,
  limit: 50,
  total: 0,
  totalPages: 1,

  setBrands: (brands) => set({ brands }),
  setCategories: (categories) => set({ categories }),
  setProviders: (providers) => set({ providers }),
  setProducts: (products) => set({ products }),
  setMovements: (movements) => set({ movements }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setActiveTab: (activeTab) => set({ activeTab, page: 1, searchValue: '' }),
  setSearchValue: (searchValue) => set({ searchValue, page: 1 }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setActiveModal: (activeModal) => set({ activeModal }),
  setSelectedProduct: (selectedProduct) => set({ selectedProduct }),
  setSelectedProvider: (selectedProvider) => set({ selectedProvider }),

  setPage: (page) => set({ page }),
  setPagination: (data) => set({
    page: data.page,
    limit: data.limit,
    total: data.total,
    totalPages: data.totalPages,
  }),
}));

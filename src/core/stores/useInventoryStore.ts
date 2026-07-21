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
  activeTab: 'inventory' | 'providers';
  searchValue: string;
  categoryFilter: string;
  activeModal: 'addProduct' | 'addProvider' | 'addProductBatch' | 'stockAdjustment' | 'addMovement' | null;
  selectedProduct: Product | null;
  selectedProvider: Provider | null;

  setBrands: (brands: Brand[]) => void;
  setCategories: (categories: Category[]) => void;
  setProviders: (providers: Provider[]) => void;
  setProducts: (products: Product[]) => void;
  setMovements: (movements: StockMovement[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: 'inventory' | 'providers') => void;
  setSearchValue: (val: string) => void;
  setCategoryFilter: (val: string) => void;
  setActiveModal: (modal: 'addProduct' | 'addProvider' | 'addProductBatch' | 'stockAdjustment' | 'addMovement' | null) => void;
  setSelectedProduct: (product: Product | null) => void;
  setSelectedProvider: (provider: Provider | null) => void;
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

  setBrands: (brands) => set({ brands }),
  setCategories: (categories) => set({ categories }),
  setProviders: (providers) => set({ providers }),
  setProducts: (products) => set({ products }),
  setMovements: (movements) => set({ movements }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setSearchValue: (searchValue) => set({ searchValue }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setActiveModal: (activeModal) => set({ activeModal }),
  setSelectedProduct: (selectedProduct) => set({ selectedProduct }),
  setSelectedProvider: (selectedProvider) => set({ selectedProvider }),
}));

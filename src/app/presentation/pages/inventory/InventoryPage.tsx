import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Icon,
  PageLayout,
  PrimaryButton,
  SecondaryButton,
  TertiaryButton,
  TextInput,
  Select,
  Checkbox,
  SearchableSelect,
  Modal,
  MerchandiseReceptionDrawer,
  KbdBadge,
  Box,
  Flex,
  Grid,
  Stack,
  Heading,
  Text,
  Badge,
} from '@/app/presentation/components';
import { useAuthStore } from '@/app/presentation/stores';
import { useInventoryStore } from '@/app/presentation/stores';
import {
  inventoryRepository as inventoryRepo,
  branchUseCases,
  clientPortalRepository as clientPortalRepo,
  servicesRepository as servicesRepo,
} from '@/core/di/container';
import type { CreateProductDto, CreateProviderDto, Product, Provider, StockMovement } from '@/app/domain';
import type { Branch } from '@/app/domain';
import type { PredefinedService, CreateServiceDto } from '@/app/domain';
import { cn } from '@/core/utils/cn';

import { useShallow } from 'zustand/react/shallow';

export const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const activeBranchId = useAuthStore((s) => s.activeBranchId);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await branchUseCases.getBranches();
        if (data && data.length > 0) {
          setBranches(data);
          return;
        }
      } catch {
        // Fallback to public branches
      }

      try {
        const publicData = await clientPortalRepo.getPublicBranches();
        if (publicData && publicData.length > 0) {
          setBranches(publicData.map((b: { id?: string; _id?: string; name: string }) => ({ ...b, id: b.id || b._id || '' } as Branch)));
        }
      } catch {
        // Ignore error
      }
    };

    fetchBranches();
  }, [accessToken]);

  const activeBranch = useMemo(() => {
    return branches.find(b => b.id === activeBranchId || (b as { _id?: string })._id === activeBranchId);
  }, [branches, activeBranchId]);
  const activeBranchName = useMemo(() => {
    return activeBranch ? activeBranch.name : (branches.length > 0 ? branches[0].name : 'Sucursal Principal');
  }, [activeBranch, branches]);

  const {
    activeTab,
    setActiveTab,
    products,
    providers,
    brands,
    categories,
    movements,
    loading,
    searchValue,
    setSearchValue,
    setProducts,
    setProviders,
    setBrands,
    setCategories,
    setMovements,
    setLoading,
    activeModal,
    setActiveModal,
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
    setPagination,
    selectedProduct,
    setSelectedProduct,
  } = useInventoryStore(
    useShallow((s) => ({
      activeTab: s.activeTab,
      setActiveTab: s.setActiveTab,
      products: s.products,
      providers: s.providers,
      brands: s.brands,
      categories: s.categories,
      movements: s.movements,
      loading: s.loading,
      searchValue: s.searchValue,
      setSearchValue: s.setSearchValue,
      setProducts: s.setProducts,
      setProviders: s.setProviders,
      setBrands: s.setBrands,
      setCategories: s.setCategories,
      setMovements: s.setMovements,
      setLoading: s.setLoading,
      activeModal: s.activeModal,
      setActiveModal: s.setActiveModal,
      page: s.page,
      limit: s.limit,
      total: s.total,
      totalPages: s.totalPages,
      setPage: s.setPage,
      setLimit: s.setLimit,
      setPagination: s.setPagination,
      selectedProduct: s.selectedProduct,
      setSelectedProduct: s.setSelectedProduct,
    }))
  );

  const [productForm, setProductForm] = useState<CreateProductDto>({
    name: '',
    description: '',
    sku: '',
    brandId: '',
    categoryId: '',
    costPrice: 0,
    sellingPrice: 0,
    stock: 0,
    minStock: 5,
    unit: 'piece',
    compatibility: [],
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [providerForm, setProviderForm] = useState<CreateProviderDto>({
    name: '',
    providerCode: '',
  });
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);

  const [movementTypeFilter, setMovementTypeFilter] = useState<'all' | 'in' | 'out'>('all');
  const [productMovements, setProductMovements] = useState<StockMovement[]>([]);
  const [productMovementsLoading, setProductMovementsLoading] = useState(false);

  // ── Services Tab State ──────────────────────────────────────────────────
  const [services, setServices] = useState<PredefinedService[]>([]);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceForm, setServiceForm] = useState<CreateServiceDto>({
    name: '',
    description: '',
    basePrice: 0,
    isActive: true,
    supplies: [],
  });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceFormErrors, setServiceFormErrors] = useState<{ [key: string]: string }>({});
  const [serviceToDelete, setServiceToDelete] = useState<PredefinedService | null>(null);

  const productsById = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  const availableSupplyProducts = useMemo(() => {
    const used = new Set(serviceForm.supplies.map(s => s.productId));
    return products.filter(p => !used.has(p.id));
  }, [products, serviceForm.supplies]);

  const [itemToDelete, setItemToDelete] = useState<{ type: 'category' | 'brand'; id: string; name: string } | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  const handleUnauthorized = () => {
    clearAuth();
    navigate('/login');
  };

  const handleExportMovementsCSV = () => {
    if (movements.length === 0) return;
    const headers = ['ID', 'Fecha', 'Producto', 'SKU', 'Tipo', 'Cantidad', 'Motivo', 'Proveedor'];
    const rows = movements.map(m => [
      m.id,
      m.date || (m as { createdAt?: string }).createdAt || '',
      `"${typeof m.product === 'object' ? m.product?.name : m.product || ''}"`,
      typeof m.product === 'object' ? m.product?.sku : '',
      m.type,
      m.quantity,
      `"${m.reason || ''}"`,
      `"${m.provider?.name || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `movimientos_stock_${activeBranchName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const computeKardexMovements = (movs: StockMovement[], currentStock?: number) => {
    const sorted = [...movs].sort((a, b) => {
      const dateA = new Date(a.date || (a as { createdAt?: string }).createdAt || 0).getTime();
      const dateB = new Date(b.date || (b as { createdAt?: string }).createdAt || 0).getTime();
      return dateA - dateB;
    });

    let runningBalance = currentStock !== undefined
      ? sorted.reduce((acc, m) => acc + (m.type === 'in' ? -m.quantity : m.quantity), currentStock)
      : 0;

    const computed = sorted.map(m => {
      if (m.type === 'in') {
        runningBalance += m.quantity;
      } else {
        runningBalance -= m.quantity;
      }
      return { ...m, calculatedBalance: runningBalance };
    });

    return computed.reverse();
  };

  const handleOpenProductHistory = async (product: Product) => {
    setSelectedProduct(product);
    setActiveModal('productHistory');
    setProductMovementsLoading(true);
    try {
      if (!accessToken) return;
      const res = await inventoryRepo.getMovementsPaginated(accessToken, {
        productId: product.id,
        limit: 100,
      });
      setProductMovements(res.items);
    } catch (err) {
      console.error('Error fetching product history:', err);
    } finally {
      setProductMovementsLoading(false);
    }
  };

  const fetchInventoryData = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      if (activeTab === 'inventory') {
        const res = await inventoryRepo.getProductsPaginated(accessToken, {
          search: searchValue,
          page,
          limit,
        });
        setProducts(res.items);
        setPagination({
          page: res.page,
          limit: res.limit,
          total: res.total,
          totalPages: res.totalPages,
        });
      } else if (activeTab === 'categories') {
        const res = await inventoryRepo.getCategories(accessToken);
        setCategories(res);
      } else if (activeTab === 'brands') {
        const res = await inventoryRepo.getBrands(accessToken);
        setBrands(res);
      } else if (activeTab === 'providers') {
        const res = await inventoryRepo.getProviders(accessToken, searchValue || undefined);
        setProviders(res);
      } else if (activeTab === 'services') {
        fetchServices();
      } else if (activeTab === 'movements') {
        const res = await inventoryRepo.getMovementsPaginated(accessToken, {
          page,
          limit,
          type: movementTypeFilter === 'all' ? undefined : movementTypeFilter,
        });
        setMovements(res.items);
        setPagination({
          page: res.page,
          limit: res.limit,
          total: res.total,
          totalPages: res.totalPages,
        });
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') handleUnauthorized();
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    if (!accessToken) return;
    setServiceLoading(true);
    try {
      const data = await servicesRepo.getServices(accessToken);
      setServices(data);
    } catch (err) {
      if (err instanceof Error && err.message === 'UNAUTHORIZED') handleUnauthorized();
    } finally {
      setServiceLoading(false);
    }
  };

  // Prefetch common master data (categories, brands, providers) on mount/auth so modals always have options
  useEffect(() => {
    if (!accessToken) return;
    const prefetchMasterData = async () => {
      try {
        const [cats, brs, provs] = await Promise.all([
          inventoryRepo.getCategories(accessToken),
          inventoryRepo.getBrands(accessToken),
          inventoryRepo.getProviders(accessToken),
        ]);
        setCategories(cats);
        setBrands(brs);
        setProviders(provs);
      } catch (err) {
        console.error('Error prefetching inventory master data:', err);
      }
    };
    prefetchMasterData();
  }, [accessToken, setCategories, setBrands, setProviders]);

  useEffect(() => {
    fetchInventoryData();
    // eslint-disable-next-line
  }, [activeTab, page, limit, searchValue, movementTypeFilter, activeBranchId]);

  const handleOpenAddProduct = useCallback(async () => {
    setEditingProductId(null);
    setProductForm({
      name: '',
      description: '',
      sku: '',
      brandId: brands[0]?.id || '',
      categoryId: categories[0]?.id || '',
      costPrice: 0,
      sellingPrice: 0,
      stock: 0,
      minStock: 5,
      unit: 'piece',
      compatibility: [],
    });
    setFormErrors({});
    setActiveModal('addProduct');

    if (accessToken && (categories.length === 0 || brands.length === 0)) {
      try {
        const [cats, brs] = await Promise.all([
          categories.length === 0 ? inventoryRepo.getCategories(accessToken) : Promise.resolve(categories),
          brands.length === 0 ? inventoryRepo.getBrands(accessToken) : Promise.resolve(brands),
        ]);
        if (categories.length === 0) {
          setCategories(cats);
          if (cats.length > 0) setProductForm((prev) => ({ ...prev, categoryId: prev.categoryId || cats[0].id }));
        }
        if (brands.length === 0) {
          setBrands(brs);
          if (brs.length > 0) setProductForm((prev) => ({ ...prev, brandId: prev.brandId || brs[0].id }));
        }
      } catch (err) {
        console.error('Error loading categories/brands for product modal:', err);
      }
    }
  }, [accessToken, categories, brands, setCategories, setBrands, setActiveModal]);

  const handleCreateProduct = async () => {
    const errors: { [key: string]: string } = {};
    if (!productForm.name) errors.name = 'El nombre es obligatorio';
    if (!productForm.sku) errors.sku = 'El SKU es obligatorio';
    if (!productForm.brandId) errors.brandId = 'La marca es obligatoria';
    if (!productForm.categoryId) errors.categoryId = 'La categoría es obligatoria';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      if (editingProductId) {
        await inventoryRepo.updateProduct(accessToken!, editingProductId, productForm);
      } else {
        await inventoryRepo.createProduct(accessToken!, productForm);
      }
      setActiveModal(null);
      setEditingProductId(null);
      setFormErrors({});
      setProductForm({
        name: '',
        description: '',
        sku: '',
        brandId: brands[0]?.id || '',
        categoryId: categories[0]?.id || '',
        costPrice: 0,
        sellingPrice: 0,
        stock: 0,
        minStock: 5,
        unit: 'piece',
        compatibility: [],
      });
      fetchInventoryData();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Error al guardar el producto';
      setFormErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description || '',
      sku: product.sku,
      brandId: product.brand?.id || '',
      categoryId: product.category?.id || '',
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      stock: product.stock,
      minStock: product.minStock,
      unit: product.unit,
      compatibility: product.compatibility ?? [],
    });
    setFormErrors({});
    setActiveModal('addProduct');
  };

  const handleCreateProvider = async () => {
    const errors: { [key: string]: string } = {};
    if (!providerForm.name) errors.name = 'El nombre es obligatorio';
    if (!providerForm.providerCode) errors.providerCode = 'El código es obligatorio';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      if (editingProviderId) {
        await inventoryRepo.updateProvider(accessToken!, editingProviderId, providerForm);
      } else {
        await inventoryRepo.createProvider(accessToken!, providerForm);
      }
      setActiveModal(null);
      setEditingProviderId(null);
      setFormErrors({});
      setProviderForm({ name: '', providerCode: '' });
      inventoryRepo.getProviders(accessToken!).then(setProviders).catch(() => {});
      fetchInventoryData();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Error al guardar el proveedor';
      setFormErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddProvider = useCallback(() => {
    setEditingProviderId(null);
    setProviderForm({ name: '', providerCode: '' });
    setFormErrors({});
    setActiveModal('addProvider');
  }, [setActiveModal]);

  const handleOpenEditProvider = (provider: Provider) => {
    setEditingProviderId(provider.id);
    setProviderForm({
      name: provider.name,
      providerCode: provider.providerCode || '',
    });
    setFormErrors({});
    setActiveModal('addProvider');
  };

  const handleCreateCategory = async (name: string): Promise<string> => {
    if (!accessToken) return '';
    try {
      const res = await inventoryRepo.createCategory(accessToken, name);
      setCategories([...categories, res]);
      return res.id;
    } catch (err) {
      console.error(err);
      return '';
    }
  };

  const handleCreateBrand = async (name: string): Promise<string> => {
    if (!accessToken) return '';
    try {
      const res = await inventoryRepo.createBrand(accessToken, name);
      setBrands([...brands, res]);
      return res.id;
    } catch (err) {
      console.error(err);
      return '';
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !accessToken) return;
    setDeletingItem(true);
    try {
      if (itemToDelete.type === 'category') {
        await inventoryRepo.deleteCategory(accessToken, itemToDelete.id);
        setCategories(categories.filter(c => c.id !== itemToDelete.id));
      } else {
        await inventoryRepo.deleteBrand(accessToken, itemToDelete.id);
        setBrands(brands.filter(b => b.id !== itemToDelete.id));
      }
      setItemToDelete(null);
    } catch (err) {
      console.error('Error deleting item:', err);
    } finally {
      setDeletingItem(false);
    }
  };

  const handleSaveService = async () => {
    const errors: { [key: string]: string } = {};
    if (!serviceForm.name.trim()) errors.name = 'El nombre es obligatorio';
    if (serviceForm.basePrice < 0) errors.basePrice = 'El precio debe ser mayor o igual a 0';

    if (Object.keys(errors).length > 0) {
      setServiceFormErrors(errors);
      return;
    }

    try {
      setServiceLoading(true);
      if (editingServiceId) {
        await servicesRepo.updateService(accessToken!, editingServiceId, serviceForm);
      } else {
        await servicesRepo.createService(accessToken!, serviceForm);
      }
      setActiveModal(null);
      setEditingServiceId(null);
      setServiceForm({ name: '', description: '', basePrice: 0, isActive: true, supplies: [] });
      fetchServices();
    } catch (err) {
      console.error(err);
    } finally {
      setServiceLoading(false);
    }
  };

  const handleOpenEditService = (service: PredefinedService) => {
    setEditingServiceId(service.id);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      basePrice: service.basePrice,
      isActive: service.isActive,
      supplies: service.supplies.map(s => ({
        productId: s.product._id,
        quantity: s.quantity,
      })),
    });
    setServiceFormErrors({});
    setActiveModal('addService');
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete || !accessToken) return;
    try {
      setServiceLoading(true);
      await servicesRepo.deleteService(accessToken, serviceToDelete.id);
      setServiceToDelete(null);
      fetchServices();
    } catch (err) {
      console.error(err);
    } finally {
      setServiceLoading(false);
    }
  };

  const handleToggleServiceActive = async (service: PredefinedService) => {
    if (!accessToken) return;
    try {
      await servicesRepo.updateService(accessToken, service.id, {
        isActive: !service.isActive,
      });
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, isActive: !s.isActive } : s));
    } catch (err) {
      console.error(err);
    }
  };

  const addSupply = (productId: string) => {
    if (serviceForm.supplies.some(s => s.productId === productId)) return;
    setServiceForm(prev => ({
      ...prev,
      supplies: [...prev.supplies, { productId, quantity: 1 }],
    }));
  };

  const removeSupply = (productId: string) => {
    setServiceForm(prev => ({
      ...prev,
      supplies: prev.supplies.filter(s => s.productId !== productId),
    }));
  };

  const updateSupplyQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeSupply(productId);
      return;
    }
    setServiceForm(prev => ({
      ...prev,
      supplies: prev.supplies.map(s => s.productId === productId ? { ...s, quantity: qty } : s),
    }));
  };

  useEffect(() => {
    if ((activeModal === 'addMovement' || activeModal === 'addProduct') && providers.length === 0) {
      inventoryRepo.getProviders(accessToken!).then(setProviders).catch(() => { });
    }
  }, [activeModal, accessToken, providers.length, setProviders]);

  // ── Keyboard Shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key === '1') || e.key === 'F1') {
        e.preventDefault();
        setActiveTab('inventory');
      } else if ((e.altKey && e.key === '2') || e.key === 'F2') {
        e.preventDefault();
        setActiveTab('categories');
      } else if ((e.altKey && e.key === '3') || e.key === 'F3') {
        e.preventDefault();
        setActiveTab('brands');
      } else if ((e.altKey && e.key === '4') || e.key === 'F4') {
        e.preventDefault();
        setActiveTab('providers');
      } else if ((e.altKey && e.key === '5') || e.key === 'F5') {
        e.preventDefault();
        setActiveTab('services');
      } else if ((e.altKey && e.key === '6') || e.key === 'F7') {
        e.preventDefault();
        setActiveTab('movements');
      } else if ((e.altKey && (e.key === 'f' || e.key === 'F')) || e.key === 'F6') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('#inventory-search-input')?.focus();
      } else if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        if (activeTab === 'inventory') handleOpenAddProduct();
        else if (activeTab === 'providers') handleOpenAddProvider();
        else if (activeTab === 'services') {
          setEditingServiceId(null);
          setServiceForm({ name: '', description: '', basePrice: 0, isActive: true, supplies: [] });
          setActiveModal('addService');
        }
      } else if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        setActiveModal('addMovement');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, setActiveTab, setActiveModal, handleOpenAddProduct, handleOpenAddProvider]);

  const renderPaginationFooter = () => {
    const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
    const endItem = Math.min(page * limit, total);

    const pageNumbers: (number | string)[] = [];
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      pageNumbers.push(1);
      if (page > 3) pageNumbers.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pageNumbers.push(i);
      if (page < totalPages - 2) pageNumbers.push('...');
      pageNumbers.push(totalPages);
    }

    return (
      <Flex justify="between" align="center" wrap="wrap" gap="sm" className="p-3.5 px-5 border-t border-base-300 bg-base-200/50">
        <Flex align="center" gap="md">
          <Text size="sm" color="muted">
            Mostrando <Text as="strong" weight="bold" className="text-base-content">{startItem}</Text> - <Text as="strong" weight="bold" className="text-base-content">{endItem}</Text> de <Text as="strong" weight="bold" className="text-base-content">{total}</Text> registros
          </Text>
          <Flex align="center" gap="xs">
            <Text size="xs" color="muted">Mostrar:</Text>
            <Select
              size="xs"
              fullWidth={false}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              options={[
                { value: 10, label: '10 por pág.' },
                { value: 25, label: '25 por pág.' },
                { value: 50, label: '50 por pág.' },
                { value: 100, label: '100 por pág.' },
              ]}
            />
          </Flex>
        </Flex>

        <Flex align="center" gap="xs">
          <SecondaryButton
            size="xs"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            iconStart={<Icon name="ChevronLeft" size="sm" />}
          >
            Anterior
          </SecondaryButton>

          <Flex gap="xs">
            {pageNumbers.map((p, idx) => typeof p === 'number' ? (
              p === page ? (
                <PrimaryButton key={idx} size="xs" color="neutral" className="min-w-[32px]">
                  {p}
                </PrimaryButton>
              ) : (
                <SecondaryButton key={idx} size="xs" onClick={() => setPage(p)} className="min-w-[32px]">
                  {p}
                </SecondaryButton>
              )
            ) : (
              <Text key={idx} size="sm" color="muted" className="px-1.5 self-center">...</Text>
            ))}
          </Flex>

          <SecondaryButton
            size="xs"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || totalPages === 0}
            iconEnd={<Icon name="ChevronRight" size="sm" />}
          >
            Siguiente
          </SecondaryButton>
        </Flex>
      </Flex>
    );
  };

  return (
    <PageLayout userName={user?.name || 'Admin'}>

        {/* Top Header */}
        <Box as="header" className="bg-base-100 px-7 py-4 border-b border-base-300">
          <Flex justify="between" align="center">
            <Heading level={4} className="font-bold">Inventario, Categorías y Marcas</Heading>
            <Flex gap="sm">
              {activeTab === 'inventory' ? (
                <>
                  <PrimaryButton
                    size="sm"
                    color="success"
                    onClick={() => setActiveModal('addMovement')}
                    iconStart={<Icon name="PackagePlus" size="sm" />}
                  >
                    Ingreso de Mercancía
                    <KbdBadge keys="Alt+M" className="ml-1.5" />
                  </PrimaryButton>
                  <SecondaryButton
                    size="sm"
                    onClick={() => setActiveModal('addProductBatch')}
                    iconStart={<Icon name="UploadCloud" size="sm" />}
                  >
                    Registro por Lotes
                  </SecondaryButton>
                  <PrimaryButton
                    size="sm"
                    onClick={handleOpenAddProduct}
                    iconStart={<Icon name="Plus" size="sm" />}
                  >
                    Nuevo Producto
                    <KbdBadge keys="Alt+N" className="ml-1.5" />
                  </PrimaryButton>
                </>
              ) : activeTab === 'movements' ? (
                <Flex gap="sm">
                  <SecondaryButton
                    size="sm"
                    onClick={handleExportMovementsCSV}
                    iconStart={<Icon name="Download" size="sm" />}
                  >
                    Exportar CSV
                  </SecondaryButton>
                  <PrimaryButton
                    size="sm"
                    color="success"
                    onClick={() => setActiveModal('addMovement')}
                    iconStart={<Icon name="Plus" size="sm" />}
                  >
                    Nuevo Ingreso
                    <KbdBadge keys="Alt+M" className="ml-1.5" />
                  </PrimaryButton>
                </Flex>
              ) : activeTab === 'providers' ? (
                <PrimaryButton
                  size="sm"
                  onClick={handleOpenAddProvider}
                  iconStart={<Icon name="Plus" size="sm" />}
                >
                  Nuevo Proveedor
                  <KbdBadge keys="Alt+N" className="ml-1.5" />
                </PrimaryButton>
              ) : activeTab === 'services' ? (
                <PrimaryButton
                  size="sm"
                  color="warning"
                  onClick={() => {
                    setEditingServiceId(null);
                    setServiceForm({ name: '', description: '', basePrice: 0, isActive: true, supplies: [] });
                    setActiveModal('addService');
                  }}
                  iconStart={<Icon name="Plus" size="sm" />}
                >
                  Nuevo Servicio
                  <KbdBadge keys="Alt+N" className="ml-1.5" />
                </PrimaryButton>
              ) : null}
            </Flex>
          </Flex>
        </Box>

        <Box as="main" className="flex-1 p-7 max-w-7xl w-full mx-auto">

          {/* Tabs & Search */}
          <Flex justify="between" align="center" wrap="wrap" gap="md" className="mb-6">
            <Flex align="center" gap="xs" className="bg-base-100 p-1 rounded-DEFAULT border border-base-300 shadow-sm overflow-x-auto max-w-full">
              {([
                { id: 'inventory' as const, label: 'Inventario', key: 'Alt+1' },
                { id: 'categories' as const, label: 'Categorías', key: 'Alt+2' },
                { id: 'brands' as const, label: 'Marcas', key: 'Alt+3' },
                { id: 'providers' as const, label: 'Proveedores', key: 'Alt+4' },
                { id: 'services' as const, label: 'Servicios', key: 'Alt+5' },
                { id: 'movements' as const, label: 'Movimientos', key: 'Alt+6' },
              ]).map(t => (
                activeTab === t.id ? (
                  <PrimaryButton
                    key={t.id}
                    size="sm"
                    color={t.id === 'services' ? 'warning' : 'neutral'}
                    className="whitespace-nowrap shrink-0"
                  >
                    <span>{t.label}</span>
                    <KbdBadge keys={t.key} />
                  </PrimaryButton>
                ) : (
                  <TertiaryButton
                    key={t.id}
                    size="sm"
                    color="neutral"
                    onClick={() => setActiveTab(t.id)}
                    className="whitespace-nowrap shrink-0"
                  >
                    <span>{t.label}</span>
                    <KbdBadge keys={t.key} />
                  </TertiaryButton>
                )
              ))}
            </Flex>

            <Flex gap="sm" align="center" className="ml-auto shrink-0">
              {activeTab === 'movements' && (
                <Select
                  size="sm"
                  fullWidth={false}
                  value={movementTypeFilter}
                  onChange={(e) => setMovementTypeFilter(e.target.value as 'all' | 'in' | 'out')}
                  options={[
                    { value: 'all', label: 'Todos los tipos' },
                    { value: 'in', label: 'Entradas (Ingresos)' },
                    { value: 'out', label: 'Salidas (Bajas)' },
                  ]}
                />
              )}

              <Box className="w-72 relative">
                <TextInput
                  id="inventory-search-input"
                  size="sm"
                  placeholder={`Buscar ${activeTab === 'inventory' ? 'productos'
                      : activeTab === 'categories' ? 'categorías'
                        : activeTab === 'brands' ? 'marcas'
                          : activeTab === 'services' ? 'servicios'
                            : activeTab === 'movements' ? 'movimientos'
                              : 'proveedores'
                    }...`}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
                <Box className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <KbdBadge keys="Alt+F" />
                </Box>
              </Box>
            </Flex>
          </Flex>

          {/* Movements Summary Cards (only in movements tab) */}
          {activeTab === 'movements' && (
            <Grid cols={3} gap="md" className="mb-5">
              <Box className="bg-base-100 p-4 px-5 rounded-DEFAULT border border-base-300 flex items-center gap-3.5">
                <Flex align="center" justify="center" className="p-2.5 rounded-DEFAULT bg-primary/10 text-primary">
                  <Icon name="ArrowUpDown" size="md" />
                </Flex>
                <Box>
                  <Text size="xs" color="muted" weight="medium">Total Movimientos</Text>
                  <Text weight="bold" className="text-xl">{total}</Text>
                </Box>
              </Box>
              <Box className="bg-base-100 p-4 px-5 rounded-DEFAULT border border-base-300 flex items-center gap-3.5">
                <Flex align="center" justify="center" className="p-2.5 rounded-DEFAULT bg-success/10 text-success">
                  <Icon name="TrendingUp" size="md" />
                </Flex>
                <Box>
                  <Text size="xs" color="muted" weight="medium">Stock Ingresado (Pág)</Text>
                  <Text weight="bold" className="text-xl text-success font-mono">
                    +{movements.filter(m => m.type === 'in').reduce((acc, m) => acc + m.quantity, 0)} un.
                  </Text>
                </Box>
              </Box>
              <Box className="bg-base-100 p-4 px-5 rounded-DEFAULT border border-base-300 flex items-center gap-3.5">
                <Flex align="center" justify="center" className="p-2.5 rounded-DEFAULT bg-error/10 text-error">
                  <Icon name="TrendingDown" size="md" />
                </Flex>
                <Box>
                  <Text size="xs" color="muted" weight="medium">Stock Retirado (Pág)</Text>
                  <Text weight="bold" className="text-xl text-error font-mono">
                    -{movements.filter(m => m.type === 'out').reduce((acc, m) => acc + m.quantity, 0)} un.
                  </Text>
                </Box>
              </Box>
            </Grid>
          )}

          {/* Table Area */}
          <Box className="bg-base-100 rounded-DEFAULT border border-base-300 overflow-hidden">
            {loading ? (
              <Box className="py-10 text-center">
                <Text color="muted">Cargando datos...</Text>
              </Box>
            ) : activeTab === 'inventory' ? (
              <Box className="overflow-x-auto">
                <Box as="table" className="table w-full border-collapse">
                  <Box as="thead" className="bg-base-200/50 border-b border-base-300">
                    <Box as="tr">
                      <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">SKU</Box>
                      <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Producto</Box>
                      <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Categoría</Box>
                      <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Precio Venta</Box>
                      <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Stock</Box>
                      <Box as="th" className="py-3 px-4 text-center text-xs font-semibold text-base-content/60 uppercase">Acciones</Box>
                    </Box>
                  </Box>
                  <Box as="tbody">
                    {products.length > 0 ? products.map(product => (
                      <Box as="tr" key={product.id} className="border-b border-base-200 hover:bg-base-200/40 transition-colors">
                        <Box as="td" className="py-4 px-4 font-mono text-sm text-warning font-semibold">
                          {product.sku}
                        </Box>
                        <Box as="td" className="py-4 px-4">
                          <TertiaryButton
                            size="xs"
                            color="primary"
                            onClick={() => handleOpenProductHistory(product)}
                            className="p-0 h-auto min-h-0 font-semibold underline text-left"
                            title="Ver historial de movimientos de este producto"
                          >
                            {product.name}
                          </TertiaryButton>
                          <Text size="xs" color="muted" className="block mt-0.5">{product.brand?.name}</Text>
                        </Box>
                        <Box as="td" className="py-4 px-4 text-sm text-base-content/70">
                          {product.category?.name}
                        </Box>
                        <Box as="td" className="py-4 px-4 font-mono text-sm font-bold">
                          ${product.sellingPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </Box>
                        <Box as="td" className="py-4 px-4">
                          <Badge
                            variant={product.stock <= product.minStock ? 'error' : 'success'}
                            size="sm"
                          >
                            {product.stock} {product.unit}
                          </Badge>
                        </Box>
                        <Box as="td" className="py-4 px-4 text-center">
                          <Flex gap="xs" justify="center">
                            <TertiaryButton
                              size="xs"
                              color="primary"
                              onClick={() => handleOpenProductHistory(product)}
                              title="Ver Historial de Movimientos"
                            >
                              <Icon name="History" size="sm" />
                            </TertiaryButton>
                            <TertiaryButton
                              size="xs"
                              color="warning"
                              onClick={() => handleOpenEditProduct(product)}
                              title="Editar Producto"
                            >
                              <Icon name="Edit2" size="sm" />
                            </TertiaryButton>
                          </Flex>
                        </Box>
                      </Box>
                    )) : (
                      <Box as="tr">
                        <Box as="td" colSpan={6} className="py-10 text-center">
                          <Text color="muted">No hay productos en el inventario.</Text>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            ) : activeTab === 'categories' ? (
              <Box className="overflow-x-auto">
                <Box as="table" className="table w-full border-collapse">
                  <Box as="thead" className="bg-base-200/50 border-b border-base-300">
                    <Box as="tr">
                      <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Nombre de Categoría</Box>
                      <Box as="th" className="py-3 px-4 text-center text-xs font-semibold text-base-content/60 uppercase">Acciones</Box>
                    </Box>
                  </Box>
                  <Box as="tbody">
                    {categories.length > 0 ? (
                      categories.map(category => (
                        <Box as="tr" key={category.id} className="border-b border-base-200 hover:bg-base-200/40">
                          <Box as="td" className="py-4 px-4 text-sm font-semibold">
                            {category.name}
                          </Box>
                          <Box as="td" className="py-4 px-4 text-center">
                            <TertiaryButton
                              size="xs"
                              color="error"
                              onClick={() => setItemToDelete({ type: 'category', id: category.id, name: category.name })}
                              title="Eliminar categoría"
                            >
                              <Icon name="Trash2" size="sm" />
                            </TertiaryButton>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Box as="tr">
                        <Box as="td" colSpan={2} className="py-10 text-center">
                          <Text color="muted">No hay categorías registradas.</Text>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            ) : activeTab === 'brands' ? (
              <Box className="overflow-x-auto">
                <Box as="table" className="table w-full border-collapse">
                  <Box as="thead" className="bg-base-200/50 border-b border-base-300">
                    <Box as="tr">
                      <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Nombre de Marca</Box>
                      <Box as="th" className="py-3 px-4 text-center text-xs font-semibold text-base-content/60 uppercase">Acciones</Box>
                    </Box>
                  </Box>
                  <Box as="tbody">
                    {brands.length > 0 ? (
                      brands.map(brand => (
                        <Box as="tr" key={brand.id} className="border-b border-base-200 hover:bg-base-200/40">
                          <Box as="td" className="py-4 px-4 text-sm font-semibold">
                            {brand.name}
                          </Box>
                          <Box as="td" className="py-4 px-4 text-center">
                            <TertiaryButton
                              size="xs"
                              color="error"
                              onClick={() => setItemToDelete({ type: 'brand', id: brand.id, name: brand.name })}
                              title="Eliminar marca"
                            >
                              <Icon name="Trash2" size="sm" />
                            </TertiaryButton>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Box as="tr">
                        <Box as="td" colSpan={2} className="py-10 text-center">
                          <Text color="muted">No hay marcas registradas.</Text>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            ) : activeTab === 'providers' ? (
              <Box className="overflow-x-auto">
                <Box as="table" className="table w-full border-collapse">
                  <Box as="thead" className="bg-base-200/50 border-b border-base-300">
                    <Box as="tr">
                      <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Nombre</Box>
                      <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Código</Box>
                      <Box as="th" className="py-3 px-4 text-center text-xs font-semibold text-base-content/60 uppercase">Acciones</Box>
                    </Box>
                  </Box>
                  <Box as="tbody">
                    {providers.length > 0 ? providers.map(provider => (
                      <Box as="tr" key={provider.id} className="border-b border-base-200 hover:bg-base-200/40">
                        <Box as="td" className="py-4 px-4 text-sm font-semibold">
                          {provider.name}
                        </Box>
                        <Box as="td" className="py-4 px-4 text-sm font-mono text-base-content/70">
                          {provider.providerCode || 'N/A'}
                        </Box>
                        <Box as="td" className="py-4 px-4 text-center">
                          <TertiaryButton
                            size="xs"
                            color="neutral"
                            onClick={() => handleOpenEditProvider(provider)}
                            title="Editar Proveedor"
                          >
                            <Icon name="Edit2" size="sm" />
                          </TertiaryButton>
                        </Box>
                      </Box>
                    )) : (
                      <Box as="tr">
                        <Box as="td" colSpan={3} className="py-10 text-center">
                          <Text color="muted">
                            {searchValue ? `No se encontraron proveedores que coincidan con "${searchValue}".` : 'No hay proveedores registrados.'}
                          </Text>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            ) : activeTab === 'movements' ? (
              <Box className="overflow-x-auto">
                <Box as="table" className="table w-full border-collapse">
                  <Box as="thead" className="bg-base-200/50 border-b border-base-300">
                    <Box as="tr">
                      <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Fecha</Box>
                      <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Producto / SKU</Box>
                      <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Concepto / Motivo</Box>
                      <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Proveedor</Box>
                      <Box as="th" className="py-3 px-4 text-right text-xs font-semibold text-success uppercase">Entrada (+)</Box>
                      <Box as="th" className="py-3 px-4 text-right text-xs font-semibold text-error uppercase">Salida (-)</Box>
                      <Box as="th" className="py-3 px-4 text-right text-xs font-semibold text-base-content/60 uppercase">Saldo (Kardex)</Box>
                    </Box>
                  </Box>
                  <Box as="tbody">
                    {movements.length > 0 ? computeKardexMovements(movements).map(m => (
                      <Box as="tr" key={m.id} className="border-b border-base-200 hover:bg-base-200/40">
                        <Box as="td" className="py-4 px-4 text-xs font-mono whitespace-nowrap text-base-content/70">
                          {(m.date || (m as { createdAt?: string }).createdAt)
                            ? new Date(m.date || (m as { createdAt?: string }).createdAt!).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
                            : '-'}
                        </Box>
                        <Box as="td" className="py-4 px-4">
                          <Text weight="semibold" className="text-sm block">
                            {typeof m.product === 'object' ? m.product?.name : m.product || 'Producto'}
                          </Text>
                          <Text size="xs" color="muted" className="font-mono">
                            SKU: {typeof m.product === 'object' ? m.product?.sku : 'N/A'}
                          </Text>
                        </Box>
                        <Box as="td" className="py-4 px-4 text-sm text-base-content/80">
                          {m.reason || 'Sin especificar'}
                        </Box>
                        <Box as="td" className="py-4 px-4 text-sm text-base-content/70">
                          {m.provider?.name || 'N/A'}
                        </Box>
                        <Box as="td" className="py-4 px-4 text-right font-mono text-sm font-bold text-success">
                          {m.type === 'in' ? `+${m.quantity}` : <Text color="muted">-</Text>}
                        </Box>
                        <Box as="td" className="py-4 px-4 text-right font-mono text-sm font-bold text-error">
                          {m.type === 'out' ? `-${m.quantity}` : <Text color="muted">-</Text>}
                        </Box>
                        <Box as="td" className="py-4 px-4 text-right">
                          <Badge variant="neutral" size="sm" className="font-mono font-bold">
                            {m.calculatedBalance} un.
                          </Badge>
                        </Box>
                      </Box>
                    )) : (
                      <Box as="tr">
                        <Box as="td" colSpan={7} className="py-10 text-center">
                          <Text color="muted">No hay movimientos de stock registrados.</Text>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            ) : (
              /* ── Services tab ────────────────────────────────────────────── */
              serviceLoading ? (
                <Box className="py-10 text-center">
                  <Text color="muted">Cargando servicios...</Text>
                </Box>
              ) : (
                <Box className="overflow-x-auto">
                  <Box as="table" className="table w-full border-collapse">
                    <Box as="thead" className="bg-warning/10 border-b border-warning/20">
                      <Box as="tr">
                        <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-warning uppercase">Servicio</Box>
                        <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-warning uppercase">Insumos</Box>
                        <Box as="th" className="py-3 px-4 text-right text-xs font-semibold text-warning uppercase">Precio Base</Box>
                        <Box as="th" className="py-3 px-4 text-center text-xs font-semibold text-warning uppercase">Estado</Box>
                        <Box as="th" className="py-3 px-4 text-center text-xs font-semibold text-warning uppercase">Acciones</Box>
                      </Box>
                    </Box>
                    <Box as="tbody">
                      {services.filter(s => s.name.toLowerCase().includes(searchValue.toLowerCase())).length > 0 ? (
                        services.filter(s => s.name.toLowerCase().includes(searchValue.toLowerCase())).map(service => (
                          <Box as="tr" key={service.id} className={cn('border-b border-base-200 hover:bg-base-200/40', !service.isActive && 'opacity-60')}>
                            <Box as="td" className="py-4 px-4">
                              <Text weight="bold" className="text-sm block">{service.name}</Text>
                              {service.description && <Text size="xs" color="muted" className="mt-0.5">{service.description}</Text>}
                            </Box>
                            <Box as="td" className="py-4 px-4">
                              {service.supplies.length === 0 ? (
                                <Text size="xs" color="muted">Sin insumos</Text>
                              ) : (
                                <Stack spacing="xs">
                                  {service.supplies.map((s, i) => (
                                    <Text key={i} size="xs" color="muted">• {s.product.name} ×{s.quantity}</Text>
                                  ))}
                                </Stack>
                              )}
                            </Box>
                            <Box as="td" className="py-4 px-4 text-right font-mono text-sm font-bold text-warning">
                              ${service.basePrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </Box>
                            <Box as="td" className="py-4 px-4 text-center">
                              <Badge
                                variant={service.isActive ? 'success' : 'neutral'}
                                size="sm"
                                className="cursor-pointer select-none"
                                onClick={() => handleToggleServiceActive(service)}
                              >
                                {service.isActive ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </Box>
                            <Box as="td" className="py-4 px-4 text-center">
                              <Flex gap="xs" justify="center">
                                <TertiaryButton size="xs" color="warning" onClick={() => handleOpenEditService(service)} title="Editar">
                                  <Icon name="Edit2" size="sm" />
                                </TertiaryButton>
                                <TertiaryButton size="xs" color="error" onClick={() => setServiceToDelete(service)} title="Eliminar">
                                  <Icon name="Trash2" size="sm" />
                                </TertiaryButton>
                              </Flex>
                            </Box>
                          </Box>
                        ))
                      ) : (
                        <Box as="tr">
                          <Box as="td" colSpan={5} className="py-10 text-center">
                            <Text color="muted">
                              No hay servicios configurados. Crea el primer servicio con el botón de arriba.
                            </Text>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              )
            )}

            {/* Pagination Controls Footer */}
            {renderPaginationFooter()}
          </Box>
        </Box>

      {/* Modal for Add Product */}
      <Modal
        isOpen={activeModal === 'addProduct'}
        onClose={() => setActiveModal(null)}
        onConfirm={handleCreateProduct}
        title={editingProductId ? 'Editar Producto' : 'Agregar Producto'}
        maxWidth="600px"
        footer={
          <>
            <SecondaryButton onClick={() => setActiveModal(null)} disabled={loading}>
              Cancelar <KbdBadge keys="Esc" className="ml-1.5" />
            </SecondaryButton>
            <PrimaryButton onClick={handleCreateProduct} loading={loading} disabled={loading}>
              Guardar Producto <KbdBadge keys="Enter ↵" className="ml-1.5" />
            </PrimaryButton>
          </>
        }
      >
        <Box className="bg-info/10 text-info p-3 rounded-DEFAULT text-xs font-medium mb-5 flex items-center gap-2">
          <Icon name="Info" size="sm" />
          Registrando en sucursal: {activeBranchName}
        </Box>

        {formErrors.general && (
          <Box className="bg-error/10 text-error p-3 rounded-DEFAULT text-xs font-medium mb-4 flex items-center gap-2">
            <Icon name="AlertCircle" size="sm" />
            {formErrors.general}
          </Box>
        )}

        <Stack spacing="md">
          <Grid cols={3} gap="md">
            <Box className="col-span-1">
              <Text as="label" size="xs" weight="semibold" className="block mb-2">SKU / Código</Text>
              <TextInput
                size="sm"
                placeholder="Ej. BAL-001"
                value={productForm.sku}
                onChange={e => {
                  setProductForm({ ...productForm, sku: e.target.value });
                  if (formErrors.sku) setFormErrors(prev => ({ ...prev, sku: '' }));
                }}
                errorMessage={formErrors.sku}
              />
            </Box>
            <Box className="col-span-2">
              <Text as="label" size="xs" weight="semibold" className="block mb-2">Nombre del producto</Text>
              <TextInput
                size="sm"
                placeholder="Ej. Balatas Delanteras de Cerámica"
                value={productForm.name}
                onChange={e => {
                  setProductForm({ ...productForm, name: e.target.value });
                  if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                }}
                errorMessage={formErrors.name}
              />
            </Box>
          </Grid>

          <Box>
            <Text as="label" size="xs" weight="semibold" className="block mb-2">Descripción</Text>
            <TextInput
              size="sm"
              placeholder="Descripción detallada"
              value={productForm.description}
              onChange={e => setProductForm({ ...productForm, description: e.target.value })}
            />
          </Box>

          <Grid cols={2} gap="md">
            <Box>
              <Text as="label" size="xs" weight="semibold" className="block mb-2">Marca</Text>
              <SearchableSelect
                options={brands}
                value={productForm.brandId}
                onChange={id => setProductForm({ ...productForm, brandId: id })}
                onCreateNew={handleCreateBrand}
                placeholder="Buscar o crear marca..."
                error={!!formErrors.brandId}
              />
              {formErrors.brandId && <Text size="xs" color="error" className="mt-1 block">{formErrors.brandId}</Text>}
            </Box>
            <Box>
              <Text as="label" size="xs" weight="semibold" className="block mb-2">Categoría</Text>
              <SearchableSelect
                options={categories}
                value={productForm.categoryId}
                onChange={id => setProductForm({ ...productForm, categoryId: id })}
                onCreateNew={handleCreateCategory}
                placeholder="Buscar o crear categoría..."
                error={!!formErrors.categoryId}
              />
              {formErrors.categoryId && <Text size="xs" color="error" className="mt-1 block">{formErrors.categoryId}</Text>}
            </Box>
          </Grid>

          <Grid cols={2} gap="md">
            <Box>
              <Text as="label" size="xs" weight="semibold" className="block mb-2">Costo</Text>
              <TextInput
                size="sm"
                placeholder="0.00"
                type="number"
                value={productForm.costPrice.toString()}
                onChange={e => setProductForm({ ...productForm, costPrice: parseFloat(e.target.value) || 0 })}
              />
            </Box>
            <Box>
              <Text as="label" size="xs" weight="semibold" className="block mb-2">Precio Venta</Text>
              <TextInput
                size="sm"
                placeholder="0.00"
                type="number"
                value={productForm.sellingPrice.toString()}
                onChange={e => setProductForm({ ...productForm, sellingPrice: parseFloat(e.target.value) || 0 })}
              />
            </Box>
          </Grid>

          <Grid cols={3} gap="md">
            <Box>
              <Text as="label" size="xs" weight="semibold" className="block mb-2">Stock</Text>
              <TextInput
                size="sm"
                placeholder="0"
                type="number"
                value={productForm.stock.toString()}
                onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
              />
            </Box>
            <Box>
              <Text as="label" size="xs" weight="semibold" className="block mb-2">Stock Mínimo</Text>
              <TextInput
                size="sm"
                placeholder="0"
                type="number"
                value={productForm.minStock.toString()}
                onChange={e => setProductForm({ ...productForm, minStock: parseInt(e.target.value) || 0 })}
              />
            </Box>
            <Box>
              <Text as="label" size="xs" weight="semibold" className="block mb-2">Unidad</Text>
              <Select
                size="sm"
                value={productForm.unit}
                onChange={e => setProductForm({ ...productForm, unit: e.target.value })}
                options={[
                  { value: 'piece', label: 'Pieza' },
                  { value: 'kit', label: 'Kit' },
                  { value: 'box', label: 'Caja' },
                ]}
              />
            </Box>
          </Grid>
        </Stack>
      </Modal>

      {/* Modal for Add Provider */}
      <Modal
        isOpen={activeModal === 'addProvider'}
        onClose={() => setActiveModal(null)}
        onConfirm={handleCreateProvider}
        title={editingProviderId ? 'Editar Proveedor' : 'Agregar Proveedor'}
        maxWidth="500px"
        footer={
          <>
            <SecondaryButton onClick={() => setActiveModal(null)} disabled={loading}>
              Cancelar <KbdBadge keys="Esc" className="ml-1.5" />
            </SecondaryButton>
            <PrimaryButton onClick={handleCreateProvider} loading={loading} disabled={loading}>
              Guardar Proveedor <KbdBadge keys="Enter ↵" className="ml-1.5" />
            </PrimaryButton>
          </>
        }
      >
        <Box className="bg-info/10 text-info p-3 rounded-DEFAULT text-xs font-medium mb-5 flex items-center gap-2">
          <Icon name="Info" size="sm" />
          Registrando en sucursal: {activeBranchName}
        </Box>

        {formErrors.general && (
          <Box className="bg-error/10 text-error p-3 rounded-DEFAULT text-xs font-medium mb-4 flex items-center gap-2">
            <Icon name="AlertCircle" size="sm" />
            {formErrors.general}
          </Box>
        )}

        <Stack spacing="md">
          <Box>
            <Text as="label" size="xs" weight="semibold" className="block mb-2">Nombre</Text>
            <TextInput
              size="sm"
              placeholder="Autopartes S.A."
              value={providerForm.name}
              onChange={e => {
                setProviderForm({ ...providerForm, name: e.target.value });
                if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
              }}
              errorMessage={formErrors.name}
            />
          </Box>
          <Box>
            <Text as="label" size="xs" weight="semibold" className="block mb-2">Código de Proveedor</Text>
            <TextInput
              size="sm"
              placeholder="Ej. PROV-001"
              value={providerForm.providerCode}
              onChange={e => {
                setProviderForm({ ...providerForm, providerCode: e.target.value });
                if (formErrors.providerCode) setFormErrors(prev => ({ ...prev, providerCode: '' }));
              }}
              errorMessage={formErrors.providerCode}
            />
          </Box>
        </Stack>
      </Modal>

      {/* Drawer for Split Merchandise Reception & Live Entry Management */}
      <MerchandiseReceptionDrawer
        isOpen={activeModal === 'addMovement'}
        onClose={() => setActiveModal(null)}
        products={products}
        providers={providers}
        categories={categories}
        brands={brands}
        activeBranchName={activeBranchName}
        activeBranchId={activeBranchId}
        initialProductId={selectedProduct?.id}
        onStockUpdated={fetchInventoryData}
      />

      {/* Modal for Batch Upload */}
      <Modal
        isOpen={activeModal === 'addProductBatch'}
        onClose={() => setActiveModal(null)}
        onConfirm={() => setActiveModal(null)}
        title="Registro por Lotes"
        maxWidth="600px"
        footer={
          <>
            <SecondaryButton onClick={() => setActiveModal(null)}>
              Cancelar <KbdBadge keys="Esc" className="ml-1.5" />
            </SecondaryButton>
            <PrimaryButton onClick={() => setActiveModal(null)}>
              Subir Archivo <KbdBadge keys="Enter ↵" className="ml-1.5" />
            </PrimaryButton>
          </>
        }
      >
        <Text size="sm" color="muted" className="mb-6 block">
          Sube un archivo CSV con tus productos. Asegúrate de que las columnas coincidan con el formato requerido.
        </Text>
        <Box className="border-2 border-dashed border-base-300 p-12 text-center rounded-DEFAULT bg-base-200/40 mb-6">
          <Icon name="UploadCloud" size="lg" className="text-base-content/40 mx-auto mb-4" />
          <Text size="sm" weight="semibold" color="muted">
            Haz clic para seleccionar o arrastra el archivo CSV aquí
          </Text>
        </Box>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Eliminar ${itemToDelete?.type === 'category' ? 'Categoría' : 'Marca'}`}
      >
        <Stack spacing="md">
          <Text size="sm">
            ¿Estás seguro de que deseas eliminar la {itemToDelete?.type === 'category' ? 'categoría' : 'marca'}{' '}
            <Text as="strong" weight="bold">"{itemToDelete?.name}"</Text>? Esta acción eliminará el elemento de forma permanente.
          </Text>
          <Flex justify="end" gap="sm" className="mt-4">
            <SecondaryButton onClick={() => setItemToDelete(null)} disabled={deletingItem}>
              Cancelar <KbdBadge keys="Esc" className="ml-1.5" />
            </SecondaryButton>
            <PrimaryButton
              color="error"
              onClick={handleConfirmDelete}
              loading={deletingItem}
              disabled={deletingItem}
            >
              Eliminar <KbdBadge keys="Enter ↵" className="ml-1.5" />
            </PrimaryButton>
          </Flex>
        </Stack>
      </Modal>

      {/* Add / Edit Service Modal */}
      <Modal
        isOpen={activeModal === 'addService'}
        onClose={() => setActiveModal(null)}
        onConfirm={handleSaveService}
        title={editingServiceId ? 'Editar Servicio' : 'Nuevo Servicio del Taller'}
        maxWidth="620px"
        footer={
          <>
            <SecondaryButton onClick={() => setActiveModal(null)}>
              Cancelar <KbdBadge keys="Esc" className="ml-1.5" />
            </SecondaryButton>
            <PrimaryButton
              color="warning"
              onClick={handleSaveService}
              loading={serviceLoading}
              disabled={serviceLoading}
            >
              {editingServiceId ? 'Guardar Cambios' : 'Crear Servicio'} <KbdBadge keys="Enter ↵" className="ml-1.5" />
            </PrimaryButton>
          </>
        }
      >
        <Stack spacing="md">
          {/* Name */}
          <Box>
            <Text as="label" size="xs" weight="semibold" className="block mb-2">Nombre del servicio *</Text>
            <TextInput
              size="sm"
              placeholder="Ej. 1er Mantenimiento"
              value={serviceForm.name}
              onChange={e => { setServiceForm(p => ({ ...p, name: e.target.value })); if (serviceFormErrors.name) setServiceFormErrors(p => ({ ...p, name: '' })); }}
              errorMessage={serviceFormErrors.name}
            />
          </Box>

          {/* Description */}
          <Box>
            <Text as="label" size="xs" weight="semibold" className="block mb-2">Descripción</Text>
            <TextInput
              size="sm"
              placeholder="Mantenimiento preventivo básico..."
              value={serviceForm.description}
              onChange={e => setServiceForm(p => ({ ...p, description: e.target.value }))}
            />
          </Box>

          {/* Base Price */}
          <Box className="max-w-[200px]">
            <Text as="label" size="xs" weight="semibold" className="block mb-2">Precio base de mano de obra ($) *</Text>
            <TextInput
              size="sm"
              type="number"
              min="0"
              step="0.01"
              placeholder="450.00"
              value={serviceForm.basePrice.toString()}
              onChange={e => setServiceForm(p => ({ ...p, basePrice: parseFloat(e.target.value) || 0 }))}
              errorMessage={serviceFormErrors.basePrice}
            />
            <Text size="xs" color="muted" className="mt-1 block">
              Este precio puede editarse manualmente en el POS al momento de la venta.
            </Text>
          </Box>

          {/* Supplies */}
          <Box>
            <Text as="label" size="xs" weight="semibold" className="block mb-2">Insumos del inventario</Text>
            <Text size="xs" color="muted" className="mb-2.5 block">
              Selecciona los productos que se descuentan del stock al vender este servicio.
            </Text>

            {/* Existing supplies list */}
            {serviceForm.supplies.length > 0 && (
              <Box className="border border-warning/30 rounded-DEFAULT mb-3 overflow-hidden">
                {serviceForm.supplies.map((supply, idx) => {
                  const prod = productsById.get(supply.productId);
                  return (
                    <Flex key={idx} align="center" gap="sm" className={cn('p-2.5 px-3.5 bg-warning/10', idx < serviceForm.supplies.length - 1 && 'border-b border-warning/20')}>
                      <Text size="sm" weight="semibold" className="flex-1">{prod?.name ?? supply.productId}</Text>
                      <Text size="xs" color="muted" className="font-mono">SKU: {prod?.sku ?? '-'}</Text>
                      <Flex align="center" gap="xs">
                        <TertiaryButton size="xs" onClick={() => updateSupplyQty(supply.productId, supply.quantity - 1)} className="w-6 h-6 min-h-0 p-0 font-bold">−</TertiaryButton>
                        <Text size="xs" weight="bold" className="min-w-[20px] text-center">{supply.quantity}</Text>
                        <TertiaryButton size="xs" onClick={() => updateSupplyQty(supply.productId, supply.quantity + 1)} className="w-6 h-6 min-h-0 p-0 font-bold">+</TertiaryButton>
                      </Flex>
                      <TertiaryButton size="xs" color="error" onClick={() => removeSupply(supply.productId)} className="p-0 h-auto min-h-0">
                        <Icon name="X" size="sm" />
                      </TertiaryButton>
                    </Flex>
                  );
                })}
              </Box>
            )}

            {/* Add supply picker */}
            <SearchableSelect
              options={availableSupplyProducts}
              value=""
              onChange={(id) => { if (id) addSupply(id); }}
              placeholder="Agregar insumo del inventario..."
            />
          </Box>

          {/* Active toggle */}
          <Flex align="center" gap="sm" className="cursor-pointer select-none">
            <Checkbox
              checked={serviceForm.isActive}
              onChange={e => setServiceForm(p => ({ ...p, isActive: e.target.checked }))}
            />
            <Text size="sm" weight="semibold">Disponible en el POS</Text>
          </Flex>
        </Stack>
      </Modal>

      {/* Delete Service Confirmation */}
      <Modal
        isOpen={Boolean(serviceToDelete)}
        onClose={() => setServiceToDelete(null)}
        title="Eliminar Servicio"
      >
        <Stack spacing="md">
          <Text size="sm">
            ¿Estás seguro de que deseas eliminar el servicio <Text as="strong" weight="bold">"{serviceToDelete?.name}"</Text>? Esta acción es permanente.
          </Text>
          <Flex justify="end" gap="sm" className="mt-4">
            <SecondaryButton onClick={() => setServiceToDelete(null)} disabled={serviceLoading}>Cancelar</SecondaryButton>
            <PrimaryButton
              color="error"
              onClick={handleDeleteService}
              loading={serviceLoading}
            >
              Eliminar
            </PrimaryButton>
          </Flex>
        </Stack>
      </Modal>

      {/* Product Stock Movements History Modal (Kardex) */}
      <Modal
        isOpen={activeModal === 'productHistory'}
        onClose={() => setActiveModal(null)}
        title={`Kardex de Producto: ${selectedProduct?.name || ''}`}
        maxWidth="780px"
        footer={
          <Flex justify="between" align="center" className="w-full">
            <PrimaryButton
              size="sm"
              color="success"
              onClick={() => {
                setActiveModal('addMovement');
              }}
              iconStart={<Icon name="PackagePlus" size="sm" />}
            >
              Ingreso de Mercancía
            </PrimaryButton>
            <SecondaryButton onClick={() => setActiveModal(null)}>
              Cerrar <KbdBadge keys="Esc" className="ml-1.5" />
            </SecondaryButton>
          </Flex>
        }
      >
        <Stack spacing="md">
          {/* Summary Banner */}
          <Box className="bg-base-200/60 p-3.5 px-4 rounded-DEFAULT border border-base-300">
            <Flex justify="between" align="center" wrap="wrap" gap="sm">
              <Box>
                <Text size="xs" color="muted">SKU: <Text as="strong" weight="bold">{selectedProduct?.sku}</Text></Text>
                <Text weight="bold" className="text-base block">{selectedProduct?.name}</Text>
                <Text size="xs" color="muted" className="mt-0.5">
                  Categoría: {selectedProduct?.category?.name || 'N/A'} | Marca: {selectedProduct?.brand?.name || 'N/A'}
                </Text>
              </Box>
              <Flex gap="lg" align="center">
                <Box className="text-right">
                  <Text size="xs" color="success" weight="semibold">Ingresos Totales</Text>
                  <Text weight="bold" className="text-sm text-success font-mono">
                    +{productMovements.filter(m => m.type === 'in').reduce((acc, m) => acc + m.quantity, 0)} {selectedProduct?.unit}
                  </Text>
                </Box>
                <Box className="text-right">
                  <Text size="xs" color="error" weight="semibold">Egresos Totales</Text>
                  <Text weight="bold" className="text-sm text-error font-mono">
                    -{productMovements.filter(m => m.type === 'out').reduce((acc, m) => acc + m.quantity, 0)} {selectedProduct?.unit}
                  </Text>
                </Box>
                <Box className="text-right border-l border-base-300 pl-4">
                  <Text size="xs" color="muted" weight="semibold">Saldo / Stock Actual</Text>
                  <Text weight="bold" className={cn('text-lg font-mono', (selectedProduct?.stock || 0) <= (selectedProduct?.minStock || 0) ? 'text-error' : 'text-success')}>
                    {selectedProduct?.stock} {selectedProduct?.unit}
                  </Text>
                </Box>
              </Flex>
            </Flex>
          </Box>

          {/* Kardex Movements table */}
          <Box className="max-h-[380px] overflow-y-auto border border-base-300 rounded-DEFAULT">
            <Box as="table" className="table w-full border-collapse">
              <Box as="thead" className="bg-base-200 sticky top-0 z-10 border-b border-base-300">
                <Box as="tr">
                  <Box as="th" className="py-2.5 px-3 text-left text-xs font-semibold text-base-content/70">Fecha / Hora</Box>
                  <Box as="th" className="py-2.5 px-3 text-left text-xs font-semibold text-base-content/70">Concepto / Motivo</Box>
                  <Box as="th" className="py-2.5 px-3 text-left text-xs font-semibold text-base-content/70">Proveedor</Box>
                  <Box as="th" className="py-2.5 px-3 text-right text-xs font-semibold text-success">Entrada (+)</Box>
                  <Box as="th" className="py-2.5 px-3 text-right text-xs font-semibold text-error">Salida (-)</Box>
                  <Box as="th" className="py-2.5 px-3 text-right text-xs font-semibold text-base-content/70">Saldo Resultante</Box>
                </Box>
              </Box>
              <Box as="tbody">
                {productMovementsLoading ? (
                  <Box as="tr">
                    <Box as="td" colSpan={6} className="py-6 text-center">
                      <Text color="muted">Cargando Kardex...</Text>
                    </Box>
                  </Box>
                ) : productMovements.length > 0 ? (
                  computeKardexMovements(productMovements, selectedProduct?.stock).map(m => (
                    <Box as="tr" key={m.id} className="border-b border-base-200">
                      <Box as="td" className="py-2.5 px-3 text-xs font-mono text-base-content/70 whitespace-nowrap">
                        {(m.date || (m as { createdAt?: string }).createdAt)
                          ? new Date(m.date || (m as { createdAt?: string }).createdAt!).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
                          : '-'}
                      </Box>
                      <Box as="td" className="py-2.5 px-3 text-xs text-base-content/80">
                        {m.reason || 'Sin motivo'}
                      </Box>
                      <Box as="td" className="py-2.5 px-3 text-xs text-base-content/70">
                        {m.provider?.name || 'N/A'}
                      </Box>
                      <Box as="td" className="py-2.5 px-3 text-right text-sm font-bold font-mono text-success">
                        {m.type === 'in' ? `+${m.quantity}` : <Text color="muted">-</Text>}
                      </Box>
                      <Box as="td" className="py-2.5 px-3 text-right text-sm font-bold font-mono text-error">
                        {m.type === 'out' ? `-${m.quantity}` : <Text color="muted">-</Text>}
                      </Box>
                      <Box as="td" className="py-2.5 px-3 text-right">
                        <Badge variant="neutral" size="xs" className="font-mono font-bold">
                          {m.calculatedBalance} un.
                        </Badge>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Box as="tr">
                    <Box as="td" colSpan={6} className="py-6 text-center">
                      <Text color="muted">No hay movimientos registrados en el Kardex para este producto.</Text>
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Stack>
      </Modal>

    </PageLayout>
  );
};

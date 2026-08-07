import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Sidebar, PrimaryButton, SecondaryButton, TextInput, SearchableSelect, Modal, KbdBadge } from '../components';
import { useAuthStore } from '../../../core/stores/useAuthStore';
import { useInventoryStore } from '../../../core/stores/useInventoryStore';
import { useBarcodeScanner } from '../../../core/hooks/useBarcodeScanner';
import { APIAdminRepository } from '../../data/repositories/APIAdminRepository';
import { APIClientPortalRepository } from '../../data/repositories/APIClientPortalRepository';
import type { CreateProductDto, CreateProviderDto, Product, Provider, StockMovement } from '../../domain/entities/InventoryEntities';
import type { Branch } from '../../domain/entities/AdminEntities';
import { APIInventoryRepository } from '@/app/data/repositories/APIInventoryRepository';
import { APIServicesRepository } from '../../data/repositories/APIServicesRepository';
import type { PredefinedService, CreateServiceDto } from '../../domain/entities/SalesEntities';

const inventoryRepo = new APIInventoryRepository();
const adminRepo = new APIAdminRepository();
const clientPortalRepo = new APIClientPortalRepository();
const servicesRepo = new APIServicesRepository();

export const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, accessToken, activeBranchId, clearAuth } = useAuthStore();
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await adminRepo.getBranches();
        if (data && data.length > 0) {
          setBranches(data);
          return;
        }
      } catch (err) { }

      try {
        const publicData = await clientPortalRepo.getPublicBranches();
        if (publicData && publicData.length > 0) {
          setBranches(publicData.map((b: any) => ({ ...b, id: b.id || b._id })));
        }
      } catch (err) { }
    };

    fetchBranches();
  }, [accessToken]);

  const activeBranch = branches.find(b => b.id === activeBranchId || (b as any)._id === activeBranchId);
  const activeBranchName = activeBranch ? activeBranch.name : (branches.length > 0 ? branches[0].name : 'Sucursal Principal');
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
  } = useInventoryStore();

  const [productForm, setProductForm] = useState<CreateProductDto>({
    sku: '',
    name: '',
    description: '',
    brandId: '',
    categoryId: '',
    costPrice: 0,
    sellingPrice: 0,
    stock: 0,
    minStock: 0,
    unit: 'piece',
    photos: [],
    compatibility: []
  });

  const [providerForm, setProviderForm] = useState<CreateProviderDto>({
    name: '',
    providerCode: ''
  });

  const [movementForm, setMovementForm] = useState({
    productId: '',
    providerId: '',
    quantity: 0
  });

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [itemToDelete, setItemToDelete] = useState<{ type: 'category' | 'brand'; id: string; name: string } | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  // ── Stock Movements & History State ──────────────────────────────────────
  const [productMovements, setProductMovements] = useState<StockMovement[]>([]);
  const [productMovementsLoading, setProductMovementsLoading] = useState(false);
  const [movementTypeFilter, setMovementTypeFilter] = useState<'all' | 'in' | 'out'>('all');

  // ── Services state ────────────────────────────────────────────────────────
  const [services, setServices] = useState<PredefinedService[]>([]);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState<CreateServiceDto>({
    name: '', description: '', basePrice: 0, isActive: true, supplies: []
  });
  const [serviceFormErrors, setServiceFormErrors] = useState<Record<string, string>>({});
  const [serviceToDelete, setServiceToDelete] = useState<PredefinedService | null>(null);

  const handleUnauthorized = () => {
    clearAuth();
    navigate('/login');
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
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') handleUnauthorized();
      else alert(err.message || 'Error al eliminar');
    } finally {
      setDeletingItem(false);
    }
  };

  const handleCreateProvider = async () => {
    const errors: Record<string, string> = {};
    if (!providerForm.name) errors.name = 'El nombre es obligatorio';
    if (!providerForm.providerCode) errors.providerCode = 'El código es obligatorio';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setLoading(true);
    let success = false;
    try {
      if (editingProviderId) {
        await inventoryRepo.updateProvider(accessToken!, editingProviderId, providerForm);
      } else {
        await inventoryRepo.createProvider(accessToken!, providerForm);
      }
      const res = await inventoryRepo.getProvidersPaginated(accessToken!, { search: searchValue, page, limit: 50 });
      setProviders(res.items);
      setPagination({ page: res.page, limit: res.limit, total: res.total, totalPages: res.totalPages });
      success = true;
    } catch (error: any) {
      console.error(error);
      if (error.message === 'UNAUTHORIZED') handleUnauthorized();
      else alert(error.message || 'Error al guardar proveedor');
    } finally {
      setLoading(false);
      if (success) {
        setActiveModal(null);
        setEditingProviderId(null);
        setProviderForm({ name: '', providerCode: '' });
      }
    }
  };

  const handleCreateProduct = async () => {
    const errors: Record<string, string> = {};
    if (!productForm.sku) errors.sku = 'Requerido';
    if (!productForm.name) errors.name = 'Requerido';
    if (!productForm.brandId) errors.brandId = 'Requerido';
    if (!productForm.categoryId) errors.categoryId = 'Requerido';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setLoading(true);
    let success = false;
    try {
      if (editingProductId) {
        await inventoryRepo.updateProduct(accessToken!, editingProductId, productForm);
      } else {
        await inventoryRepo.createProduct(accessToken!, productForm);
      }
      const res = await inventoryRepo.getProductsPaginated(accessToken!, { search: searchValue, page, limit: 50 });
      setProducts(res.items);
      setPagination({ page: res.page, limit: res.limit, total: res.total, totalPages: res.totalPages });
      success = true;
    } catch (error: any) {
      console.error(error);
      if (error.message === 'UNAUTHORIZED') handleUnauthorized();
      else alert(error.message || 'Error al guardar producto');
    } finally {
      setLoading(false);
      if (success) {
        setActiveModal(null);
        setEditingProductId(null);
        setFormErrors({});
        setProductForm({
          sku: '', name: '', description: '', brandId: '', categoryId: '', costPrice: 0, sellingPrice: 0, stock: 0, minStock: 0, unit: 'piece', photos: [], compatibility: []
        });
      }
    }
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setProductForm({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      brandId: typeof product.brand === 'object' ? product.brand.id || (product.brand as any)._id : product.brand || '',
      categoryId: typeof product.category === 'object' ? product.category.id || (product.category as any)._id : product.category || '',
      costPrice: product.costPrice || 0,
      sellingPrice: product.sellingPrice || 0,
      stock: product.stock || 0,
      minStock: product.minStock || 0,
      unit: product.unit || 'piece',
      photos: product.photos || [],
      compatibility: product.compatibility || []
    });
    setFormErrors({});
    setActiveModal('addProduct');
  };

  const handleOpenProductHistory = async (product: Product) => {
    setSelectedProduct(product);
    setActiveModal('productHistory');
    setProductMovementsLoading(true);
    try {
      const movs = await inventoryRepo.getMovements(accessToken!, product.id);
      setProductMovements(movs);
    } catch (err) {
      console.error(err);
    } finally {
      setProductMovementsLoading(false);
    }
  };

  const computeKardexMovements = (movs: StockMovement[], currentStock?: number) => {
    if (!movs || movs.length === 0) return [];

    const byProduct: { [key: string]: StockMovement[] } = {};
    movs.forEach(m => {
      const key = typeof m.product === 'object' ? (m.product?.id || m.product?.sku || 'single') : String(m.product || 'single');
      if (!byProduct[key]) byProduct[key] = [];
      byProduct[key].push(m);
    });

    const balanceMap: { [id: string]: number } = {};

    Object.values(byProduct).forEach(group => {
      const sorted = [...group].sort((a, b) => {
        const da = new Date(a.date || (a as any).createdAt || 0).getTime();
        const db = new Date(b.date || (b as any).createdAt || 0).getTime();
        return da - db;
      });

      let running = 0;
      if (currentStock !== undefined && group.length > 0) {
        let netChange = 0;
        sorted.forEach(m => {
          netChange += (m.type === 'in' ? m.quantity : -m.quantity);
        });
        running = currentStock - netChange;
      } else {
        const pObj = typeof group[0]?.product === 'object' ? group[0].product : null;
        if (pObj && typeof pObj.stock === 'number') {
          let netChange = 0;
          sorted.forEach(m => {
            netChange += (m.type === 'in' ? m.quantity : -m.quantity);
          });
          running = pObj.stock - netChange;
        }
      }

      sorted.forEach(m => {
        running += (m.type === 'in' ? m.quantity : -m.quantity);
        balanceMap[m.id] = m.balanceAfter ?? running;
      });
    });

    return movs.map(m => ({
      ...m,
      calculatedBalance: balanceMap[m.id] ?? (m.balanceAfter ?? 0)
    }));
  };

  const handleExportMovementsCSV = () => {
    if (!movements || movements.length === 0) {
      alert('No hay movimientos para exportar.');
      return;
    }
    const kardexMovs = computeKardexMovements(movements);
    const headers = ['ID', 'Fecha / Hora', 'SKU', 'Producto', 'Concepto / Motivo', 'Proveedor', 'Entrada (+)', 'Salida (-)', 'Saldo Resultante'];
    const rows = kardexMovs.map(m => [
      m.id,
      new Date(m.date || (m as any).createdAt || Date.now()).toLocaleString('es-MX'),
      `"${(typeof m.product === 'object' ? m.product?.sku : '').replace(/"/g, '""')}"`,
      `"${(typeof m.product === 'object' ? m.product?.name : m.product || '').replace(/"/g, '""')}"`,
      `"${(m.reason || '').replace(/"/g, '""')}"`,
      `"${(m.provider?.name || '').replace(/"/g, '""')}"`,
      m.type === 'in' ? m.quantity : 0,
      m.type === 'out' ? m.quantity : 0,
      m.calculatedBalance
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kardex_inventario_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenEditProvider = (provider: Provider) => {
    setEditingProviderId(provider.id);
    setProviderForm({
      name: provider.name,
      providerCode: provider.providerCode || ''
    });
    setFormErrors({});
    setActiveModal('addProvider');
  };

  const handleCreateBrand = async (name: string) => {
    try {
      const newBrand = await inventoryRepo.createBrand(accessToken!, name);
      setBrands([...brands, newBrand]);
      setProductForm(prev => ({ ...prev, brandId: newBrand.id }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateCategory = async (name: string) => {
    try {
      const newCategory = await inventoryRepo.createCategory(accessToken!, name);
      setCategories([...categories, newCategory]);
      setProductForm(prev => ({ ...prev, categoryId: newCategory.id }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateMovement = async () => {
    const errors: Record<string, string> = {};
    if (!movementForm.productId) errors.productId = 'Requerido';
    if (movementForm.quantity <= 0) errors.quantity = 'Debe ser mayor a 0';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setLoading(true);
    let success = false;
    try {
      await inventoryRepo.createMovement(accessToken!, {
        productId: movementForm.productId,
        providerId: movementForm.providerId || undefined,
        type: 'in',
        quantity: movementForm.quantity,
        reason: 'Ingreso de mercancía'
      });
      if (activeTab === 'inventory') {
        const res = await inventoryRepo.getProductsPaginated(accessToken!, { search: searchValue, page, limit: 50 });
        setProducts(res.items);
        setPagination({ page: res.page, limit: res.limit, total: res.total, totalPages: res.totalPages });
      } else {
        const prods = await inventoryRepo.getProducts(accessToken!);
        setProducts(prods);
      }
      success = true;
    } catch (error: any) {
      console.error(error);
      if (error.message === 'UNAUTHORIZED') handleUnauthorized();
      else alert(error.message || 'Error al registrar ingreso de mercancía');
    } finally {
      setLoading(false);
      if (success) {
        setActiveModal(null);
        setMovementForm({ productId: '', providerId: '', quantity: 0 });
      }
    }
  };

  // ── Services CRUD ──────────────────────────────────────────────────────────
  const loadServices = async () => {
    if (!accessToken) return;
    setServiceLoading(true);
    try {
      const data = await servicesRepo.getServices(accessToken);
      setServices(data);
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') handleUnauthorized();
    } finally {
      setServiceLoading(false);
    }
  };

  const handleSaveService = async () => {
    const errors: Record<string, string> = {};
    if (!serviceForm.name.trim()) errors.name = 'El nombre es obligatorio';
    if (serviceForm.basePrice < 0) errors.basePrice = 'El precio debe ser mayor a 0';
    if (Object.keys(errors).length > 0) { setServiceFormErrors(errors); return; }
    setServiceFormErrors({});
    setServiceLoading(true);
    try {
      if (editingServiceId) {
        await servicesRepo.updateService(accessToken!, editingServiceId, serviceForm);
      } else {
        await servicesRepo.createService(accessToken!, serviceForm);
      }
      await loadServices();
      setActiveModal(null);
      setEditingServiceId(null);
      setServiceForm({ name: '', description: '', basePrice: 0, isActive: true, supplies: [] });
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') handleUnauthorized();
      else alert(err.message || 'Error al guardar servicio');
    } finally {
      setServiceLoading(false);
    }
  };

  const handleToggleServiceActive = async (service: PredefinedService) => {
    try {
      await servicesRepo.updateService(accessToken!, service.id, { isActive: !service.isActive });
      setServices(prev => prev.map(s => s.id === service.id ? { ...s, isActive: !s.isActive } : s));
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') handleUnauthorized();
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete || !accessToken) return;
    setServiceLoading(true);
    try {
      await servicesRepo.deleteService(accessToken, serviceToDelete.id);
      setServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
      setServiceToDelete(null);
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') handleUnauthorized();
      else alert(err.message || 'Error al eliminar servicio');
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
      supplies: service.supplies.map(s => ({ productId: s.product._id, quantity: s.quantity })),
    });
    setServiceFormErrors({});
    setActiveModal('addService');
  };

  // Service supply helpers
  const addSupply = (productId: string) => {
    if (!productId) return;
    const existing = serviceForm.supplies.find(s => s.productId === productId);
    if (existing) return;
    setServiceForm(prev => ({ ...prev, supplies: [...prev.supplies, { productId, quantity: 1 }] }));
  };
  const removeSupply = (productId: string) => {
    setServiceForm(prev => ({ ...prev, supplies: prev.supplies.filter(s => s.productId !== productId) }));
  };
  const updateSupplyQty = (productId: string, qty: number) => {
    setServiceForm(prev => ({ ...prev, supplies: prev.supplies.map(s => s.productId === productId ? { ...s, quantity: Math.max(1, qty) } : s) }));
  };

  // ── Fetch paginated data from server per active tab ───────────────────────
  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      setLoading(true);
      try {
        if (activeTab === 'inventory') {
          const res = await inventoryRepo.getProductsPaginated(accessToken, { search: searchValue, page, limit });
          setProducts(res.items);
          setPagination({ page: res.page, limit: res.limit, total: res.total, totalPages: res.totalPages });

          // Also load ancillary options for dropdown forms if empty
          if (brands.length === 0 || categories.length === 0 || providers.length === 0) {
            const [b, c, p] = await Promise.all([
              brands.length === 0 ? inventoryRepo.getBrands(accessToken) : Promise.resolve(brands),
              categories.length === 0 ? inventoryRepo.getCategories(accessToken) : Promise.resolve(categories),
              providers.length === 0 ? inventoryRepo.getProviders(accessToken) : Promise.resolve(providers),
            ]);
            setBrands(b);
            setCategories(c);
            setProviders(p);
          }
        } else if (activeTab === 'brands') {
          const res = await inventoryRepo.getBrandsPaginated(accessToken, { search: searchValue, page, limit });
          setBrands(res.items);
          setPagination({ page: res.page, limit: res.limit, total: res.total, totalPages: res.totalPages });
        } else if (activeTab === 'categories') {
          const res = await inventoryRepo.getCategoriesPaginated(accessToken, { search: searchValue, page, limit });
          setCategories(res.items);
          setPagination({ page: res.page, limit: res.limit, total: res.total, totalPages: res.totalPages });
        } else if (activeTab === 'providers') {
          const res = await inventoryRepo.getProvidersPaginated(accessToken, { search: searchValue, page, limit });
          setProviders(res.items);
          setPagination({ page: res.page, limit: res.limit, total: res.total, totalPages: res.totalPages });
        } else if (activeTab === 'services') {
          const res = await servicesRepo.getServicesPaginated(accessToken, { search: searchValue, page, limit });
          setServices(res.items);
          setPagination({ page: res.page, limit: res.limit, total: res.total, totalPages: res.totalPages });

          // Load products for supply selector if empty
          if (products.length === 0) {
            const prods = await inventoryRepo.getProducts(accessToken, {});
            setProducts(prods);
          }
        } else if (activeTab === 'movements') {
          const res = await inventoryRepo.getMovementsPaginated(accessToken, {
            search: searchValue,
            type: movementTypeFilter,
            page,
            limit,
          });
          setMovements(res.items);
          setPagination({ page: res.page, limit: res.limit, total: res.total, totalPages: res.totalPages });
        }
      } catch (err: any) {
        if (err.message === 'UNAUTHORIZED') handleUnauthorized();
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, [activeTab, searchValue, movementTypeFilter, page, limit, accessToken]);

  // Load providers on demand if modal is opened and providers list is empty
  useEffect(() => {
    if (!accessToken) return;
    if ((activeModal === 'addMovement' || activeModal === 'addProduct') && providers.length === 0) {
      inventoryRepo.getProviders(accessToken).then(setProviders).catch(console.error);
    }
  }, [activeModal, accessToken]);

  // ── Barcode Scanner for Stock Adjustment / Ingreso de Mercancía ─────────────
  useBarcodeScanner({
    onScan: async (barcode) => {
      if (!accessToken || activeModal !== 'addMovement') return;
      try {
        const prod = await inventoryRepo.getProductBySku(accessToken, barcode);
        if (prod) {
          setMovementForm(prev => ({ ...prev, productId: prod.id }));
        } else {
          alert(`No se encontró producto con SKU: ${barcode}`);
        }
      } catch (e) { }
    },
    enabled: activeModal === 'addMovement',
  });

  // ── Keyboard Shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+1 / F1 -> Inventario
      if ((e.altKey && e.key === '1') || e.key === 'F1') {
        e.preventDefault();
        setActiveTab('inventory');
      }
      // Alt+2 / F2 -> Categorías
      else if ((e.altKey && e.key === '2') || e.key === 'F2') {
        e.preventDefault();
        setActiveTab('categories');
      }
      // Alt+3 / F3 -> Marcas
      else if ((e.altKey && e.key === '3') || e.key === 'F3') {
        e.preventDefault();
        setActiveTab('brands');
      }
      // Alt+4 / F4 -> Proveedores
      else if ((e.altKey && e.key === '4') || e.key === 'F4') {
        e.preventDefault();
        setActiveTab('providers');
      }
      // Alt+5 / F5 -> Servicios
      else if ((e.altKey && e.key === '5') || e.key === 'F5') {
        e.preventDefault();
        setActiveTab('services');
      }
      // Alt+6 / F7 -> Movimientos
      else if ((e.altKey && e.key === '6') || e.key === 'F7') {
        e.preventDefault();
        setActiveTab('movements');
      }
      // Alt+F or F6 -> Focus Search Input
      else if ((e.altKey && (e.key === 'f' || e.key === 'F')) || e.key === 'F6') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('#inventory-search-input')?.focus();
      }
      // Alt+N -> New Item modal
      else if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        if (activeTab === 'inventory') setActiveModal('addProduct');
        else if (activeTab === 'providers') setActiveModal('addProvider');
        else if (activeTab === 'services') {
          setEditingServiceId(null);
          setServiceForm({ name: '', description: '', basePrice: 0, isActive: true, supplies: [] });
          setActiveModal('addService');
        }
      }
      // Alt+M -> Ingreso de Mercancía modal
      else if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        setActiveModal('addMovement');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, setActiveTab, setActiveModal]);

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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 20px',
        borderTop: '1px solid #e2e8f0',
        background: '#f8fafc',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>
            Mostrando <strong style={{ color: '#0f172a' }}>{startItem}</strong> - <strong style={{ color: '#0f172a' }}>{endItem}</strong> de <strong style={{ color: '#0f172a' }}>{total}</strong> registros
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Mostrar:</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                background: 'white',
                cursor: 'pointer',
                color: '#0f172a',
                fontWeight: '500'
              }}
            >
              <option value={10}>10 por pág.</option>
              <option value={25}>25 por pág.</option>
              <option value={50}>50 por pág.</option>
              <option value={100}>100 por pág.</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: page <= 1 ? '#f1f5f9' : 'white',
              color: page <= 1 ? '#94a3b8' : '#334155',
              fontSize: '13px',
              fontWeight: '500',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <Icon name="ChevronLeft" size="sm" />
            Anterior
          </button>

          <div style={{ display: 'flex', gap: '4px' }}>
            {pageNumbers.map((p, idx) => typeof p === 'number' ? (
              <button
                key={idx}
                onClick={() => setPage(p)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: p === page ? '1px solid #091426' : '1px solid #cbd5e1',
                  background: p === page ? '#091426' : 'white',
                  color: p === page ? 'white' : '#334155',
                  fontSize: '13px',
                  fontWeight: p === page ? '700' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {p}
              </button>
            ) : (
              <span key={idx} style={{ padding: '4px 6px', color: '#94a3b8', fontSize: '13px' }}>...</span>
            ))}
          </div>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages || totalPages === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: (page >= totalPages || totalPages === 0) ? '#f1f5f9' : 'white',
              color: (page >= totalPages || totalPages === 0) ? '#94a3b8' : '#334155',
              fontSize: '13px',
              fontWeight: '500',
              cursor: (page >= totalPages || totalPages === 0) ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Siguiente
            <Icon name="ChevronRight" size="sm" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: '#f8f9ff', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <Sidebar onLogout={handleUnauthorized} userName={user?.name || 'Admin'} />

      <div style={{ marginLeft: '240px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Top Header */}
        <header style={{ background: 'white', padding: '16px 28px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#091426' }}>Inventario, Categorías y Marcas</h1>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {activeTab === 'inventory' ? (
              <>
                <PrimaryButton onClick={() => setActiveModal('addMovement')} style={{ background: '#16a34a', borderColor: '#16a34a' }}>
                  <Icon name="Plus" size="sm" className="mr-2" />
                  Ingreso de Mercancía
                  <KbdBadge keys="Alt+M" style={{ marginLeft: '6px' }} />
                </PrimaryButton>
                <SecondaryButton onClick={() => setActiveModal('addProductBatch')}>
                  <Icon name="UploadCloud" size="sm" className="mr-2" />
                  Registro por Lotes
                </SecondaryButton>
                <PrimaryButton onClick={() => setActiveModal('addProduct')}>
                  <Icon name="Plus" size="sm" className="mr-2" />
                  Nuevo Producto
                  <KbdBadge keys="Alt+N" style={{ marginLeft: '6px' }} />
                </PrimaryButton>
              </>
            ) : activeTab === 'movements' ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <SecondaryButton onClick={handleExportMovementsCSV}>
                  <Icon name="Download" size="sm" className="mr-2" />
                  Exportar CSV
                </SecondaryButton>
                <PrimaryButton onClick={() => setActiveModal('addMovement')} style={{ background: '#16a34a', borderColor: '#16a34a' }}>
                  <Icon name="Plus" size="sm" className="mr-2" />
                  Nuevo Ingreso
                  <KbdBadge keys="Alt+M" style={{ marginLeft: '6px' }} />
                </PrimaryButton>
              </div>
            ) : activeTab === 'providers' ? (
              <PrimaryButton onClick={() => setActiveModal('addProvider')}>
                <Icon name="Plus" size="sm" className="mr-2" />
                Nuevo Proveedor
                <KbdBadge keys="Alt+N" style={{ marginLeft: '6px' }} />
              </PrimaryButton>
            ) : activeTab === 'services' ? (
              <PrimaryButton
                onClick={() => { setEditingServiceId(null); setServiceForm({ name: '', description: '', basePrice: 0, isActive: true, supplies: [] }); setActiveModal('addService'); }}
                style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
              >
                <Icon name="Plus" size="sm" className="mr-2" />
                Nuevo Servicio
                <KbdBadge keys="Alt+N" style={{ marginLeft: '6px' }} />
              </PrimaryButton>
            ) : null}
          </div>
        </header>

        <main style={{ flex: 1, padding: '28px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>

          {/* Tabs & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'white',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              overflowX: 'auto',
              maxWidth: '100%',
              scrollbarWidth: 'none'
            }}>
              {[
                { id: 'inventory', label: 'Inventario', key: 'Alt+1' },
                { id: 'categories', label: 'Categorías', key: 'Alt+2' },
                { id: 'brands', label: 'Marcas', key: 'Alt+3' },
                { id: 'providers', label: 'Proveedores', key: 'Alt+4' },
                { id: 'services', label: 'Servicios', key: 'Alt+5' },
                { id: 'movements', label: 'Movimientos', key: 'Alt+6' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  style={{
                    padding: '7px 11px',
                    borderRadius: '7px',
                    fontWeight: '600',
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    background: activeTab === t.id ? (t.id === 'services' ? '#f59e0b' : '#091426') : 'transparent',
                    color: activeTab === t.id ? 'white' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{t.label}</span>
                  <KbdBadge keys={t.key} />
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto', flexShrink: 0 }}>
              {activeTab === 'movements' && (
                <select
                  value={movementTypeFilter}
                  onChange={(e) => setMovementTypeFilter(e.target.value as any)}
                  style={{
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    background: 'white',
                    color: '#0f172a',
                    fontWeight: '500',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="all">Todos los tipos</option>
                  <option value="in">Entradas (Ingresos)</option>
                  <option value="out">Salidas (Bajas)</option>
                </select>
              )}

              <div style={{ width: '300px', position: 'relative' }}>
                <TextInput
                  id="inventory-search-input"
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
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <KbdBadge keys="Alt+F" />
                </div>
              </div>
            </div>
          </div>

          {/* Movements Summary Cards (only in movements tab) */}
          {activeTab === 'movements' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: 'white', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb' }}>
                  <Icon name="ArrowUpDown" size="md" />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Total Movimientos</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{total}</div>
                </div>
              </div>
              <div style={{ background: 'white', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a' }}>
                  <Icon name="TrendingUp" size="md" />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Stock Ingresado (Pág)</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#16a34a' }}>
                    +{movements.filter(m => m.type === 'in').reduce((acc, m) => acc + m.quantity, 0)} un.
                  </div>
                </div>
              </div>
              <div style={{ background: 'white', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ padding: '10px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626' }}>
                  <Icon name="TrendingDown" size="md" />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Stock Retirado (Pág)</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#dc2626' }}>
                    -{movements.filter(m => m.type === 'out').reduce((acc, m) => acc + m.quantity, 0)} un.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Table Area */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando datos...</div>
            ) : activeTab === 'inventory' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>SKU</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Producto</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Categoría</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Precio Venta</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Stock</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length > 0 ? products.map(product => (
                    <tr key={product.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#0f172a', fontWeight: '500' }}>{product.sku}</td>
                      <td style={{ padding: '16px' }}>
                        <button
                          onClick={() => handleOpenProductHistory(product)}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                          title="Ver historial de movimientos de este producto"
                        >
                          <div style={{ fontSize: '14px', color: '#2563eb', fontWeight: '600', textDecoration: 'underline' }}>
                            {product.name}
                          </div>
                        </button>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{product.brand?.name}</div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#475569' }}>{product.category?.name}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>
                        ${product.sellingPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
                          background: product.stock <= product.minStock ? '#fef2f2' : '#f0fdf4',
                          color: product.stock <= product.minStock ? '#dc2626' : '#16a34a'
                        }}>
                          {product.stock} {product.unit}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => handleOpenProductHistory(product)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }} title="Ver Historial de Movimientos">
                            <Icon name="History" size="sm" />
                          </button>
                          <button onClick={() => handleOpenEditProduct(product)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} title="Editar Producto">
                            <Icon name="Edit2" size="sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No hay productos en el inventario.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : activeTab === 'categories' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Nombre de Categoría</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length > 0 ? (
                    categories.map(category => (
                      <tr key={category.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{category.name}</td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <button
                            onClick={() => setItemToDelete({ type: 'category', id: category.id, name: category.name })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                            title="Eliminar categoría"
                          >
                            <Icon name="Trash2" size="sm" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No hay categorías registradas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : activeTab === 'brands' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Nombre de Marca</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.length > 0 ? (
                    brands.map(brand => (
                      <tr key={brand.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{brand.name}</td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <button
                            onClick={() => setItemToDelete({ type: 'brand', id: brand.id, name: brand.name })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                            title="Eliminar marca"
                          >
                            <Icon name="Trash2" size="sm" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No hay marcas registradas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : activeTab === 'providers' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Nombre</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Código</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.length > 0 ? providers.map(provider => (
                    <tr key={provider.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{provider.name}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#475569' }}>{provider.providerCode || 'N/A'}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button onClick={() => handleOpenEditProvider(provider)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                          <Icon name="Edit2" size="sm" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        {searchValue ? `No se encontraron proveedores que coincidan con "${searchValue}".` : 'No hay proveedores registrados.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : activeTab === 'movements' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Fecha</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Producto / SKU</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Concepto / Motivo</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Proveedor</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#15803d', textTransform: 'uppercase' }}>Entrada (+)</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#b91c1c', textTransform: 'uppercase' }}>Salida (-)</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#0f172a', textTransform: 'uppercase' }}>Saldo (Kardex)</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length > 0 ? computeKardexMovements(movements).map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#334155', whiteSpace: 'nowrap' }}>
                        {new Date(m.date || (m as any).createdAt || Date.now()).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>
                          {typeof m.product === 'object' ? m.product?.name : m.product || 'Producto'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          SKU: {typeof m.product === 'object' ? m.product?.sku : 'N/A'}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#334155' }}>
                        {m.reason || 'Sin especificar'}
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#475569' }}>
                        {m.provider?.name || 'N/A'}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '700', color: '#15803d' }}>
                        {m.type === 'in' ? `+${m.quantity}` : <span style={{ color: '#cbd5e1', fontWeight: '400' }}>-</span>}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '700', color: '#b91c1c' }}>
                        {m.type === 'out' ? `-${m.quantity}` : <span style={{ color: '#cbd5e1', fontWeight: '400' }}>-</span>}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '800',
                          background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', display: 'inline-block'
                        }}>
                          {m.calculatedBalance} un.
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        No hay movimientos de stock registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              /* ── Services tab ────────────────────────────────────────────── */
              serviceLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando servicios...</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#92400e', textTransform: 'uppercase' }}>Servicio</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#92400e', textTransform: 'uppercase' }}>Insumos</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#92400e', textTransform: 'uppercase' }}>Precio Base</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#92400e', textTransform: 'uppercase' }}>Estado</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#92400e', textTransform: 'uppercase' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.filter(s => s.name.toLowerCase().includes(searchValue.toLowerCase())).length > 0 ? (
                      services.filter(s => s.name.toLowerCase().includes(searchValue.toLowerCase())).map(service => (
                        <tr key={service.id} style={{ borderBottom: '1px solid #fde68a', opacity: service.isActive ? 1 : 0.6 }}>
                          <td style={{ padding: '16px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{service.name}</div>
                            {service.description && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{service.description}</div>}
                          </td>
                          <td style={{ padding: '16px' }}>
                            {service.supplies.length === 0 ? (
                              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Sin insumos</span>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {service.supplies.map((s, i) => (
                                  <span key={i} style={{ fontSize: '12px', color: '#475569' }}>• {s.product.name} ×{s.quantity}</span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right', fontSize: '15px', fontWeight: '700', color: '#d97706' }}>
                            ${service.basePrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleToggleServiceActive(service)}
                              style={{
                                padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: 'none', cursor: 'pointer',
                                background: service.isActive ? '#dcfce7' : '#f1f5f9',
                                color: service.isActive ? '#16a34a' : '#94a3b8',
                              }}
                            >
                              {service.isActive ? 'Activo' : 'Inactivo'}
                            </button>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button onClick={() => handleOpenEditService(service)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }} title="Editar">
                                <Icon name="Edit2" size="sm" />
                              </button>
                              <button onClick={() => setServiceToDelete(service)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Eliminar">
                                <Icon name="Trash2" size="sm" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                          No hay servicios configurados. Crea el primer servicio con el botón de arriba.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )
            )}

            {/* Pagination Controls Footer */}
            {renderPaginationFooter()}
          </div>
        </main>
      </div>

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
              Cancelar <KbdBadge keys="Esc" style={{ marginLeft: '6px' }} />
            </SecondaryButton>
            <PrimaryButton onClick={handleCreateProduct} loading={loading} disabled={loading}>
              Guardar Producto <KbdBadge keys="Enter ↵" style={{ marginLeft: '6px' }} />
            </PrimaryButton>
          </>
        }
      >
        <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="Info" size="sm" />
          Registrando en sucursal: {activeBranchName}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>SKU / Código</label>
              <TextInput
                placeholder="Ej. BAL-001"
                value={productForm.sku}
                onChange={e => {
                  setProductForm({ ...productForm, sku: e.target.value });
                  if (formErrors.sku) setFormErrors(prev => ({ ...prev, sku: '' }));
                }}
                errorMessage={formErrors.sku}
              />
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Nombre del producto</label>
              <TextInput
                placeholder="Ej. Balatas Delanteras de Cerámica"
                value={productForm.name}
                onChange={e => {
                  setProductForm({ ...productForm, name: e.target.value });
                  if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                }}
                errorMessage={formErrors.name}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Descripción</label>
            <TextInput
              placeholder="Descripción detallada"
              value={productForm.description}
              onChange={e => setProductForm({ ...productForm, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Marca</label>
              <SearchableSelect
                options={brands}
                value={productForm.brandId}
                onChange={id => setProductForm({ ...productForm, brandId: id })}
                onCreateNew={handleCreateBrand}
                placeholder="Buscar o crear marca..."
                error={!!formErrors.brandId}
              />
              {formErrors.brandId && <span style={{ color: '#ba1a1a', fontSize: '11px', marginTop: '4px', display: 'block' }}>{formErrors.brandId}</span>}
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Categoría</label>
              <SearchableSelect
                options={categories}
                value={productForm.categoryId}
                onChange={id => setProductForm({ ...productForm, categoryId: id })}
                onCreateNew={handleCreateCategory}
                placeholder="Buscar o crear categoría..."
                error={!!formErrors.categoryId}
              />
              {formErrors.categoryId && <span style={{ color: '#ba1a1a', fontSize: '11px', marginTop: '4px', display: 'block' }}>{formErrors.categoryId}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Costo</label>
              <TextInput
                placeholder="0.00" type="number"
                value={productForm.costPrice.toString()}
                onChange={e => setProductForm({ ...productForm, costPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Precio Venta</label>
              <TextInput
                placeholder="0.00" type="number"
                value={productForm.sellingPrice.toString()}
                onChange={e => setProductForm({ ...productForm, sellingPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Stock</label>
              <TextInput
                placeholder="0" type="number"
                value={productForm.stock.toString()}
                onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Stock Mínimo</label>
              <TextInput
                placeholder="0" type="number"
                value={productForm.minStock.toString()}
                onChange={e => setProductForm({ ...productForm, minStock: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Unidad</label>
              <select
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', color: '#0f172a', background: 'white' }}
                value={productForm.unit}
                onChange={e => setProductForm({ ...productForm, unit: e.target.value })}
              >
                <option value="piece">Pieza</option>
                <option value="kit">Kit</option>
                <option value="box">Caja</option>
              </select>
            </div>
          </div>
        </div>
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
              Cancelar <KbdBadge keys="Esc" style={{ marginLeft: '6px' }} />
            </SecondaryButton>
            <PrimaryButton onClick={handleCreateProvider} loading={loading} disabled={loading}>
              Guardar Proveedor <KbdBadge keys="Enter ↵" style={{ marginLeft: '6px' }} />
            </PrimaryButton>
          </>
        }
      >
        <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="Info" size="sm" />
          Registrando en sucursal: {activeBranchName}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Nombre</label>
            <TextInput
              placeholder="Autopartes S.A."
              value={providerForm.name}
              onChange={e => {
                setProviderForm({ ...providerForm, name: e.target.value });
                if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
              }}
              errorMessage={formErrors.name}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Código de Proveedor</label>
            <TextInput
              placeholder="Ej. PROV-001"
              value={providerForm.providerCode}
              onChange={e => {
                setProviderForm({ ...providerForm, providerCode: e.target.value });
                if (formErrors.providerCode) setFormErrors(prev => ({ ...prev, providerCode: '' }));
              }}
              errorMessage={formErrors.providerCode}
            />
          </div>
        </div>
      </Modal>

      {/* Modal for Movement */}
      <Modal
        isOpen={activeModal === 'addMovement'}
        onClose={() => setActiveModal(null)}
        onConfirm={handleCreateMovement}
        title="Ingreso de Mercancía"
        maxWidth="500px"
        footer={
          <>
            <SecondaryButton onClick={() => setActiveModal(null)} disabled={loading}>
              Cancelar <KbdBadge keys="Esc" style={{ marginLeft: '6px' }} />
            </SecondaryButton>
            <PrimaryButton onClick={handleCreateMovement} loading={loading} disabled={loading}>
              Registrar Ingreso <KbdBadge keys="Enter ↵" style={{ marginLeft: '6px' }} />
            </PrimaryButton>
          </>
        }
      >
        <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="Info" size="sm" />
          El stock se añadirá a la sucursal: {activeBranchName}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Proveedor (Opcional)</label>
            <SearchableSelect
              options={providers}
              value={movementForm.providerId}
              onChange={id => setMovementForm({ ...movementForm, providerId: id })}
              placeholder="Buscar proveedor..."
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Producto</label>
            <SearchableSelect
              options={products}
              value={movementForm.productId}
              onChange={id => setMovementForm({ ...movementForm, productId: id })}
              placeholder="Buscar producto por SKU o nombre..."
              error={!!formErrors.productId}
            />
            {formErrors.productId && <span style={{ color: '#ba1a1a', fontSize: '11px', marginTop: '4px', display: 'block' }}>{formErrors.productId}</span>}
            {movementForm.productId && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', background: '#f8fafc', padding: '8px', borderRadius: '4px' }}>
                Stock actual: <span style={{ fontWeight: '700', color: '#0f172a' }}>{products.find(p => p.id === movementForm.productId)?.stock || 0}</span> {products.find(p => p.id === movementForm.productId)?.unit}
              </div>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Cantidad a ingresar</label>
            <TextInput
              placeholder="0" type="number"
              value={movementForm.quantity.toString()}
              onChange={e => setMovementForm({ ...movementForm, quantity: parseInt(e.target.value) || 0 })}
              error={!!formErrors.quantity}
            />
            {formErrors.quantity && <span style={{ color: '#ba1a1a', fontSize: '11px', marginTop: '4px', display: 'block' }}>{formErrors.quantity}</span>}
          </div>
        </div>
      </Modal>

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
              Cancelar <KbdBadge keys="Esc" style={{ marginLeft: '6px' }} />
            </SecondaryButton>
            <PrimaryButton onClick={() => setActiveModal(null)}>
              Subir Archivo <KbdBadge keys="Enter ↵" style={{ marginLeft: '6px' }} />
            </PrimaryButton>
          </>
        }
      >
        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
          Sube un archivo CSV con tus productos. Asegúrate de que las columnas coincidan con el formato requerido.
        </p>
        <div style={{ border: '2px dashed #cbd5e1', padding: '48px', textAlign: 'center', borderRadius: '12px', background: '#f8fafc', marginBottom: '24px' }}>
          <Icon name="UploadCloud" size="lg" className="text-[#94a3b8] mx-auto mb-4" />
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Haz clic para seleccionar o arrastra el archivo CSV aquí</p>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Eliminar ${itemToDelete?.type === 'category' ? 'Categoría' : 'Marca'}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '15px', color: '#334155' }}>
            ¿Estás seguro de que deseas eliminar la {itemToDelete?.type === 'category' ? 'categoría' : 'marca'}{' '}
            <strong>"{itemToDelete?.name}"</strong>? Esta acción eliminará el elemento de forma permanente.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <SecondaryButton onClick={() => setItemToDelete(null)} disabled={deletingItem}>
              Cancelar <KbdBadge keys="Esc" style={{ marginLeft: '6px' }} />
            </SecondaryButton>
            <PrimaryButton
              onClick={handleConfirmDelete}
              loading={deletingItem}
              disabled={deletingItem}
              style={{ background: '#ef4444', borderColor: '#ef4444' }}
            >
              Eliminar <KbdBadge keys="Enter ↵" style={{ marginLeft: '6px' }} />
            </PrimaryButton>
          </div>
        </div>
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
              Cancelar <KbdBadge keys="Esc" style={{ marginLeft: '6px' }} />
            </SecondaryButton>
            <PrimaryButton
              onClick={handleSaveService}
              loading={serviceLoading}
              disabled={serviceLoading}
              style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
            >
              {editingServiceId ? 'Guardar Cambios' : 'Crear Servicio'} <KbdBadge keys="Enter ↵" style={{ marginLeft: '6px' }} />
            </PrimaryButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Nombre del servicio *</label>
            <TextInput
              placeholder="Ej. 1er Mantenimiento"
              value={serviceForm.name}
              onChange={e => { setServiceForm(p => ({ ...p, name: e.target.value })); if (serviceFormErrors.name) setServiceFormErrors(p => ({ ...p, name: '' })); }}
              errorMessage={serviceFormErrors.name}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Descripción</label>
            <TextInput
              placeholder="Mantenimiento preventivo básico..."
              value={serviceForm.description}
              onChange={e => setServiceForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>

          {/* Base Price */}
          <div style={{ maxWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Precio base de mano de obra ($) *</label>
            <TextInput
              type="number" min="0" step="0.01"
              placeholder="450.00"
              value={serviceForm.basePrice.toString()}
              onChange={e => setServiceForm(p => ({ ...p, basePrice: parseFloat(e.target.value) || 0 }))}
              errorMessage={serviceFormErrors.basePrice}
            />
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Este precio puede editarse manualmente en el POS al momento de la venta.</p>
          </div>

          {/* Supplies */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#0f172a', marginBottom: '8px' }}>Insumos del inventario</label>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>Selecciona los productos que se descuentan del stock al vender este servicio.</p>

            {/* Existing supplies list */}
            {serviceForm.supplies.length > 0 && (
              <div style={{ border: '1px solid #fde68a', borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>
                {serviceForm.supplies.map((supply, idx) => {
                  const prod = products.find(p => p.id === supply.productId);
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderBottom: idx < serviceForm.supplies.length - 1 ? '1px solid #fde68a' : 'none', background: '#fffbeb' }}>
                      <span style={{ flex: 1, fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{prod?.name ?? supply.productId}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>SKU: {prod?.sku ?? '-'}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button onClick={() => updateSupplyQty(supply.productId, supply.quantity - 1)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #fde68a', background: 'white', cursor: 'pointer', fontWeight: '700' }}>−</button>
                        <span style={{ fontWeight: '700', fontSize: '13px', minWidth: '20px', textAlign: 'center' }}>{supply.quantity}</span>
                        <button onClick={() => updateSupplyQty(supply.productId, supply.quantity + 1)} style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #fde68a', background: 'white', cursor: 'pointer', fontWeight: '700' }}>+</button>
                      </div>
                      <button onClick={() => removeSupply(supply.productId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                        <Icon name="X" size="sm" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add supply picker */}
            <SearchableSelect
              options={products.filter(p => !serviceForm.supplies.find(s => s.productId === p.id))}
              value=""
              onChange={(id) => { if (id) addSupply(id); }}
              placeholder="Agregar insumo del inventario..."
            />
          </div>

          {/* Active toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={serviceForm.isActive}
              onChange={e => setServiceForm(p => ({ ...p, isActive: e.target.checked }))}
              style={{ width: '16px', height: '16px', accentColor: '#f59e0b' }}
            />
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>Disponible en el POS</span>
          </label>
        </div>
      </Modal>

      {/* Delete Service Confirmation */}
      <Modal
        isOpen={Boolean(serviceToDelete)}
        onClose={() => setServiceToDelete(null)}
        title="Eliminar Servicio"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '15px', color: '#334155' }}>
            ¿Estás seguro de que deseas eliminar el servicio <strong>"{serviceToDelete?.name}"</strong>?
            Esta acción es permanente.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <SecondaryButton onClick={() => setServiceToDelete(null)} disabled={serviceLoading}>Cancelar</SecondaryButton>
            <PrimaryButton
              onClick={handleDeleteService}
              loading={serviceLoading}
              style={{ background: '#ef4444', borderColor: '#ef4444' }}
            >
              Eliminar
            </PrimaryButton>
          </div>
        </div>
      </Modal>

      {/* Product Stock Movements History Modal (Kardex) */}
      <Modal
        isOpen={activeModal === 'productHistory'}
        onClose={() => setActiveModal(null)}
        title={`Kardex de Producto: ${selectedProduct?.name || ''}`}
        maxWidth="780px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <PrimaryButton
              size="sm"
              onClick={() => {
                setMovementForm({ productId: selectedProduct?.id || '', providerId: '', quantity: 1 });
                setActiveModal('addMovement');
              }}
              style={{ background: '#16a34a', borderColor: '#16a34a' }}
            >
              <Icon name="Plus" size="sm" className="mr-1" />
              Registrar Movimiento de Stock
            </PrimaryButton>
            <SecondaryButton onClick={() => setActiveModal(null)}>
              Cerrar <KbdBadge keys="Esc" style={{ marginLeft: '6px' }} />
            </SecondaryButton>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Summary Banner */}
          <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>SKU: <strong>{selectedProduct?.sku}</strong></div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{selectedProduct?.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Categoría: {selectedProduct?.category?.name || 'N/A'} | Marca: {selectedProduct?.brand?.name || 'N/A'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>Ingresos Totales</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#15803d' }}>
                  +{productMovements.filter(m => m.type === 'in').reduce((acc, m) => acc + m.quantity, 0)} {selectedProduct?.unit}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>Egresos Totales</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#b91c1c' }}>
                  -{productMovements.filter(m => m.type === 'out').reduce((acc, m) => acc + m.quantity, 0)} {selectedProduct?.unit}
                </div>
              </div>
              <div style={{ textAlign: 'right', borderLeft: '1px solid #cbd5e1', paddingLeft: '16px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Saldo / Stock Actual</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: (selectedProduct?.stock || 0) <= (selectedProduct?.minStock || 0) ? '#dc2626' : '#16a34a' }}>
                  {selectedProduct?.stock} {selectedProduct?.unit}
                </div>
              </div>
            </div>
          </div>

          {/* Kardex Movements table */}
          <div style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f1f5f9', position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: '#475569', fontWeight: '600' }}>Fecha / Hora</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: '#475569', fontWeight: '600' }}>Concepto / Motivo</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: '#475569', fontWeight: '600' }}>Proveedor</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', color: '#15803d', fontWeight: '600' }}>Entrada (+)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', color: '#b91c1c', fontWeight: '600' }}>Salida (-)</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', color: '#0f172a', fontWeight: '600' }}>Saldo Resultante</th>
                </tr>
              </thead>
              <tbody>
                {productMovementsLoading ? (
                  <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Cargando Kardex...</td></tr>
                ) : productMovements.length > 0 ? (
                  computeKardexMovements(productMovements, selectedProduct?.stock).map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px', fontSize: '13px', color: '#334155', whiteSpace: 'nowrap' }}>
                        {new Date(m.date || (m as any).createdAt || Date.now()).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', color: '#334155' }}>
                        {m.reason || 'Sin motivo'}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '13px', color: '#475569' }}>
                        {m.provider?.name || 'N/A'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '14px', fontWeight: '700', color: '#15803d' }}>
                        {m.type === 'in' ? `+${m.quantity}` : <span style={{ color: '#cbd5e1', fontWeight: '400' }}>-</span>}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '14px', fontWeight: '700', color: '#b91c1c' }}>
                        {m.type === 'out' ? `-${m.quantity}` : <span style={{ color: '#cbd5e1', fontWeight: '400' }}>-</span>}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '800',
                          background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', display: 'inline-block'
                        }}>
                          {m.calculatedBalance} un.
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No hay movimientos registrados en el Kardex para este producto.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

    </div>
  );
};

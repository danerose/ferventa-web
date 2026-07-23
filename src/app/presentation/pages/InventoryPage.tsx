import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Sidebar, PrimaryButton, SecondaryButton, TextInput, SearchableSelect, Modal } from '../components';
import { useAuthStore } from '../../../core/stores/useAuthStore';
import { useInventoryStore } from '../../../core/stores/useInventoryStore';
import { APIAdminRepository } from '../../data/repositories/APIAdminRepository';
import { APIClientPortalRepository } from '../../data/repositories/APIClientPortalRepository';
import type { CreateProductDto, CreateProviderDto, Product, Provider } from '../../domain/entities/InventoryEntities';
import type { Branch } from '../../domain/entities/AdminEntities';
import { APIInventoryRepository } from '@/app/data/repositories/APIInventoryRepository';

const inventoryRepo = new APIInventoryRepository();
const adminRepo = new APIAdminRepository();
const clientPortalRepo = new APIClientPortalRepository();

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
      } catch (err) {}
      
      try {
        const publicData = await clientPortalRepo.getPublicBranches();
        if (publicData && publicData.length > 0) {
          setBranches(publicData.map((b: any) => ({ ...b, id: b.id || b._id })));
        }
      } catch (err) {}
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
    loading,
    searchValue,
    setSearchValue,
    setProducts,
    setProviders,
    setBrands,
    setCategories,
    setLoading,
    activeModal,
    setActiveModal
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
    try {
      if (editingProviderId) {
        await inventoryRepo.updateProvider(accessToken!, editingProviderId, providerForm);
      } else {
        await inventoryRepo.createProvider(accessToken!, providerForm);
      }
      const data = await inventoryRepo.getProviders(accessToken!);
      setProviders(data);
      setActiveModal(null);
      setEditingProviderId(null);
      setProviderForm({ name: '', providerCode: '' });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
    try {
      if (editingProductId) {
        await inventoryRepo.updateProduct(accessToken!, editingProductId, productForm);
      } else {
        await inventoryRepo.createProduct(accessToken!, productForm);
      }
      const data = await inventoryRepo.getProducts(accessToken!, { search: searchValue });
      setProducts(data);
      setActiveModal(null);
      setEditingProductId(null);
      setProductForm({
        sku: '', name: '', description: '', brandId: '', categoryId: '', costPrice: 0, sellingPrice: 0, stock: 0, minStock: 0, unit: 'piece', photos: [], compatibility: []
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
    try {
      await inventoryRepo.createMovement(accessToken!, {
        productId: movementForm.productId,
        providerId: movementForm.providerId || undefined,
        type: 'in',
        quantity: movementForm.quantity,
        reason: 'Ingreso de mercancía'
      });
      const data = await inventoryRepo.getProducts(accessToken!, { search: searchValue });
      setProducts(data);
      setActiveModal(null);
      setMovementForm({ productId: '', providerId: '', quantity: 0 });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken) return;
      setLoading(true);
      try {
        if (activeTab === 'inventory' || activeTab === 'categories' || activeTab === 'brands') {
          const [productsData, brandsData, categoriesData, providersData] = await Promise.all([
            inventoryRepo.getProducts(accessToken, { search: searchValue }),
            inventoryRepo.getBrands(accessToken),
            inventoryRepo.getCategories(accessToken),
            inventoryRepo.getProviders(accessToken)
          ]);
          setProducts(productsData);
          setBrands(brandsData);
          setCategories(categoriesData);
          setProviders(providersData);
        } else {
          const data = await inventoryRepo.getProviders(accessToken, searchValue);
          setProviders(data);
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
  }, [activeTab, searchValue, accessToken]);

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
                </PrimaryButton>
                <SecondaryButton onClick={() => setActiveModal('addProductBatch')}>
                  <Icon name="UploadCloud" size="sm" className="mr-2" />
                  Registro por Lotes
                </SecondaryButton>
                <PrimaryButton onClick={() => setActiveModal('addProduct')}>
                  <Icon name="Plus" size="sm" className="mr-2" />
                  Nuevo Producto
                </PrimaryButton>
              </>
            ) : activeTab === 'providers' ? (
              <PrimaryButton onClick={() => setActiveModal('addProvider')}>
                <Icon name="Plus" size="sm" className="mr-2" />
                Nuevo Proveedor
              </PrimaryButton>
            ) : null}
          </div>
        </header>

        <main style={{ flex: 1, padding: '28px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>

          {/* Tabs & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '8px', background: 'white', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setActiveTab('inventory')}
                style={{
                  padding: '8px 16px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeTab === 'inventory' ? '#091426' : 'transparent',
                  color: activeTab === 'inventory' ? 'white' : '#64748b'
                }}
              >
                Inventario
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                style={{
                  padding: '8px 16px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeTab === 'categories' ? '#091426' : 'transparent',
                  color: activeTab === 'categories' ? 'white' : '#64748b'
                }}
              >
                Categorías
              </button>
              <button
                onClick={() => setActiveTab('brands')}
                style={{
                  padding: '8px 16px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeTab === 'brands' ? '#091426' : 'transparent',
                  color: activeTab === 'brands' ? 'white' : '#64748b'
                }}
              >
                Marcas
              </button>
              <button
                onClick={() => setActiveTab('providers')}
                style={{
                  padding: '8px 16px', borderRadius: '6px', fontWeight: '600', fontSize: '14px', border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: activeTab === 'providers' ? '#091426' : 'transparent',
                  color: activeTab === 'providers' ? 'white' : '#64748b'
                }}
              >
                Proveedores
              </button>
            </div>

            <div style={{ width: '300px' }}>
              <TextInput
                placeholder={`Buscar ${
                  activeTab === 'inventory'
                    ? 'productos'
                    : activeTab === 'categories'
                    ? 'categorías'
                    : activeTab === 'brands'
                    ? 'marcas'
                    : 'proveedores'
                }...`}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </div>
          </div>

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
                        <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{product.name}</div>
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
                        <button onClick={() => handleOpenEditProduct(product)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                          <Icon name="Edit2" size="sm" />
                        </button>
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
                  {categories.filter(c => c.name.toLowerCase().includes(searchValue.toLowerCase())).length > 0 ? (
                    categories.filter(c => c.name.toLowerCase().includes(searchValue.toLowerCase())).map(category => (
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
                  {brands.filter(b => b.name.toLowerCase().includes(searchValue.toLowerCase())).length > 0 ? (
                    brands.filter(b => b.name.toLowerCase().includes(searchValue.toLowerCase())).map(brand => (
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
            ) : (
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
                      <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No hay proveedores registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* Basic Modal for Add Product */}
      {activeModal === 'addProduct' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '600px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
              {editingProductId ? 'Editar Producto' : 'Agregar Producto'}
            </h2>

            <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="Info" size="sm" />
              Registrando en sucursal: {activeBranchName}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>SKU / Código</label>
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Nombre del producto</label>
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Descripción</label>
                <TextInput
                  placeholder="Descripción detallada"
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Marca</label>
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Categoría</label>
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Costo</label>
                  <TextInput
                    placeholder="0.00" type="number"
                    value={productForm.costPrice.toString()}
                    onChange={e => setProductForm({ ...productForm, costPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Precio Venta</label>
                  <TextInput
                    placeholder="0.00" type="number"
                    value={productForm.sellingPrice.toString()}
                    onChange={e => setProductForm({ ...productForm, sellingPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Stock</label>
                  <TextInput
                    placeholder="0" type="number"
                    value={productForm.stock.toString()}
                    onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Stock Mínimo</label>
                  <TextInput
                    placeholder="0" type="number"
                    value={productForm.minStock.toString()}
                    onChange={e => setProductForm({ ...productForm, minStock: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Unidad</label>
                  <select
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <SecondaryButton onClick={() => setActiveModal(null)}>Cancelar</SecondaryButton>
              <PrimaryButton onClick={handleCreateProduct}>Guardar Producto</PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Basic Modal for Add Provider */}
      {activeModal === 'addProvider' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '500px', maxWidth: '90vw' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
              {editingProviderId ? 'Editar Proveedor' : 'Agregar Proveedor'}
            </h2>

            <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="Info" size="sm" />
              Registrando en sucursal: {activeBranchName}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Nombre</label>
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Código de Proveedor</label>
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <SecondaryButton onClick={() => setActiveModal(null)}>Cancelar</SecondaryButton>
              <PrimaryButton onClick={handleCreateProvider}>Guardar Proveedor</PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Basic Modal for Movement */}
      {activeModal === 'addMovement' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '500px', maxWidth: '90vw' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>Ingreso de Mercancía</h2>

            <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="Info" size="sm" />
              El stock se añadirá a la sucursal: {activeBranchName}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Proveedor (Opcional)</label>
                <SearchableSelect
                  options={providers}
                  value={movementForm.providerId}
                  onChange={id => setMovementForm({ ...movementForm, providerId: id })}
                  placeholder="Buscar proveedor..."
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Producto</label>
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Cantidad a ingresar</label>
                <TextInput
                  placeholder="0" type="number"
                  value={movementForm.quantity.toString()}
                  onChange={e => setMovementForm({ ...movementForm, quantity: parseInt(e.target.value) || 0 })}
                  error={!!formErrors.quantity}
                />
                {formErrors.quantity && <span style={{ color: '#ba1a1a', fontSize: '11px', marginTop: '4px', display: 'block' }}>{formErrors.quantity}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
              <SecondaryButton onClick={() => setActiveModal(null)}>Cancelar</SecondaryButton>
              <PrimaryButton onClick={handleCreateMovement}>Registrar Ingreso</PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Basic Modal for Batch Upload */}
      {activeModal === 'addProductBatch' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', width: '600px', maxWidth: '90vw' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Registro por Lotes</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
              Sube un archivo CSV con tus productos. Asegúrate de que las columnas coincidan con el formato requerido.
            </p>
            <div style={{ border: '2px dashed #cbd5e1', padding: '48px', textAlign: 'center', borderRadius: '12px', background: '#f8fafc', marginBottom: '24px' }}>
              <Icon name="UploadCloud" size="lg" className="text-[#94a3b8] mx-auto mb-4" />
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Haz clic para seleccionar o arrastra el archivo CSV aquí</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <SecondaryButton onClick={() => setActiveModal(null)}>Cancelar</SecondaryButton>
              <PrimaryButton onClick={() => setActiveModal(null)}>Subir Archivo</PrimaryButton>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        title={`Eliminar ${itemToDelete?.type === 'category' ? 'Categoría' : 'Marca'}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '15px', color: '#334155' }}>
            ¿Estás seguro de que deseas eliminar la {itemToDelete?.type === 'category' ? 'categoría' : 'marca'}{' '}
            <strong>"{itemToDelete?.name}"</strong>? Esta acción eliminará el elemento de forma permanente.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <SecondaryButton onClick={() => setItemToDelete(null)} disabled={deletingItem}>
              Cancelar
            </SecondaryButton>
            <PrimaryButton
              onClick={handleConfirmDelete}
              loading={deletingItem}
              style={{ background: '#ef4444', borderColor: '#ef4444' }}
            >
              Eliminar
            </PrimaryButton>
          </div>
        </div>
      </Modal>

    </div>
  );
};

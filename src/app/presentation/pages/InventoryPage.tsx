import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Sidebar, PrimaryButton, SecondaryButton, TextInput, SearchableSelect } from '../components';
import { useAuthStore } from '../../../core/stores/useAuthStore';
import { useInventoryStore } from '../../../core/stores/useInventoryStore';
import { APIInventoryRepository } from '../../data/repositories/APIInventoryRepository';
import type { CreateProductDto, CreateProviderDto } from '../../domain/entities/InventoryEntities';

const inventoryRepo = new APIInventoryRepository();

export const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, accessToken, clearAuth } = useAuthStore();
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

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleUnauthorized = () => {
    clearAuth();
    navigate('/login');
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
      await inventoryRepo.createProvider(accessToken!, providerForm);
      const data = await inventoryRepo.getProviders(accessToken!);
      setProviders(data);
      setActiveModal(null);
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
      await inventoryRepo.createProduct(accessToken!, productForm);
      const data = await inventoryRepo.getProducts(accessToken!, { search: searchValue });
      setProducts(data);
      setActiveModal(null);
      setProductForm({ sku: '', name: '', description: '', brandId: '', categoryId: '', costPrice: 0, sellingPrice: 0, stock: 0, minStock: 0, unit: 'piece', photos: [], compatibility: [] });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
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
        if (activeTab === 'inventory') {
          const [productsData, brandsData, categoriesData, providersData] = await Promise.all([
            inventoryRepo.getProducts(accessToken, { search: searchValue }),
            inventoryRepo.getBrands(accessToken),
            inventoryRepo.getCategories(accessToken),
            inventoryRepo.getProviders(accessToken)
          ]);
          setProducts(productsData);
          setBrands(brandsData);
          setCategories(categoriesData);
          setProviders(providersData); // We need providers for the add product dropdown
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
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#091426' }}>Inventario y Proveedores</h1>
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
            ) : (
              <PrimaryButton onClick={() => setActiveModal('addProvider')}>
                <Icon name="Plus" size="sm" className="mr-2" />
                Nuevo Proveedor
              </PrimaryButton>
            )}
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
                placeholder={`Buscar ${activeTab === 'inventory' ? 'productos' : 'proveedores'}...`}
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
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
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
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
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
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>Agregar Producto</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>SKU / Código</label>
                  <TextInput 
                    placeholder="Ej. BAL-001" 
                    value={productForm.sku}
                    onChange={e => setProductForm({...productForm, sku: e.target.value})}
                    error={!!formErrors.sku}
                  />
                  {formErrors.sku && <span style={{ color: '#ba1a1a', fontSize: '11px', marginTop: '4px', display: 'block' }}>{formErrors.sku}</span>}
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Nombre del producto</label>
                  <TextInput 
                    placeholder="Ej. Balatas Delanteras de Cerámica" 
                    value={productForm.name}
                    onChange={e => setProductForm({...productForm, name: e.target.value})}
                    error={!!formErrors.name}
                  />
                  {formErrors.name && <span style={{ color: '#ba1a1a', fontSize: '11px', marginTop: '4px', display: 'block' }}>{formErrors.name}</span>}
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Descripción</label>
                <TextInput 
                  placeholder="Descripción detallada" 
                  value={productForm.description}
                  onChange={e => setProductForm({...productForm, description: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Marca</label>
                  <SearchableSelect 
                    options={brands} 
                    value={productForm.brandId} 
                    onChange={id => setProductForm({...productForm, brandId: id})}
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
                    onChange={id => setProductForm({...productForm, categoryId: id})}
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
                    onChange={e => setProductForm({...productForm, costPrice: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Precio Venta</label>
                  <TextInput 
                    placeholder="0.00" type="number" 
                    value={productForm.sellingPrice.toString()}
                    onChange={e => setProductForm({...productForm, sellingPrice: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Stock</label>
                  <TextInput 
                    placeholder="0" type="number" 
                    value={productForm.stock.toString()}
                    onChange={e => setProductForm({...productForm, stock: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Stock Mínimo</label>
                  <TextInput 
                    placeholder="0" type="number" 
                    value={productForm.minStock.toString()}
                    onChange={e => setProductForm({...productForm, minStock: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Unidad</label>
                  <select 
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
                    value={productForm.unit}
                    onChange={e => setProductForm({...productForm, unit: e.target.value})}
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
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>Agregar Proveedor</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Nombre</label>
                <TextInput 
                  placeholder="Autopartes S.A." 
                  value={providerForm.name}
                  onChange={e => setProviderForm({...providerForm, name: e.target.value})}
                  error={!!formErrors.name}
                />
                {formErrors.name && <span style={{ color: '#ba1a1a', fontSize: '11px', marginTop: '4px', display: 'block' }}>{formErrors.name}</span>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Código de Proveedor</label>
                <TextInput 
                  placeholder="Ej. PROV-001" 
                  value={providerForm.providerCode}
                  onChange={e => setProviderForm({...providerForm, providerCode: e.target.value})}
                  error={!!formErrors.providerCode}
                />
                {formErrors.providerCode && <span style={{ color: '#ba1a1a', fontSize: '11px', marginTop: '4px', display: 'block' }}>{formErrors.providerCode}</span>}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Proveedor (Opcional)</label>
                <SearchableSelect 
                  options={providers} 
                  value={movementForm.providerId} 
                  onChange={id => setMovementForm({...movementForm, providerId: id})}
                  placeholder="Buscar proveedor..."
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>Producto</label>
                <SearchableSelect 
                  options={products} 
                  value={movementForm.productId} 
                  onChange={id => setMovementForm({...movementForm, productId: id})}
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
                  onChange={e => setMovementForm({...movementForm, quantity: parseInt(e.target.value) || 0})}
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

    </div>
  );
};

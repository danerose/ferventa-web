import type { Brand, Category, Provider, Product, StockMovement, CreateProviderDto, CreateProductDto, CreateStockMovementDto } from '../../domain/entities/InventoryEntities';

export class APIInventoryRepository {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers || {});
    
    try {
      const authRaw = localStorage.getItem('ferventa_auth');
      if (authRaw) {
        const { accessToken } = JSON.parse(authRaw);
        if (accessToken && !headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${accessToken}`);
        }
      }
    } catch (e) {}

    const activeBranchId = localStorage.getItem('ferventa_active_branch');
    if (!headers.has('x-branch-id')) {
      headers.set('x-branch-id', activeBranchId || '000000000000000000000000');
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }

  // Brands & Categories
  async getBrands(token: string): Promise<Brand[]> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/brands`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener marcas');
    return (json.data || []).map((b: any) => ({ ...b, id: b.id || b._id }));
  }

  async createBrand(token: string, name: string): Promise<Brand> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/brands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al crear marca');
    const b = json.data;
    return { ...b, id: b.id || b._id };
  }

  async deleteBrand(token: string, id: string): Promise<void> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/brands/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al eliminar marca');
  }

  async getCategories(token: string): Promise<Category[]> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener categorias');
    return (json.data || []).map((c: any) => ({ ...c, id: c.id || c._id }));
  }

  async createCategory(token: string, name: string): Promise<Category> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al crear categoria');
    const c = json.data;
    return { ...c, id: c.id || c._id };
  }

  async deleteCategory(token: string, id: string): Promise<void> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al eliminar categoría');
  }

  // Providers
  async getProviders(token: string, search?: string): Promise<Provider[]> {
    const url = search ? `${this.baseUrl}/inventory/providers?search=${search}` : `${this.baseUrl}/inventory/providers`;
    const res = await this.fetchWithAuth(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener proveedores');
    return (json.data || []).map((p: any) => ({ ...p, id: p.id || p._id }));
  }

  async createProvider(token: string, data: CreateProviderDto): Promise<Provider> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/providers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al crear proveedor');
    const p = json.data;
    return { ...p, id: p.id || p._id };
  }

  async updateProvider(token: string, id: string, data: Partial<CreateProviderDto>): Promise<Provider> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/providers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al actualizar proveedor');
    const p = json.data;
    return { ...p, id: p.id || p._id };
  }

  // Products
  async getProducts(token: string, filter: { search?: string; categoryId?: string; branchId?: string } = {}): Promise<Product[]> {
    const params = new URLSearchParams();
    if (filter.search) params.set('search', filter.search);
    if (filter.categoryId) params.set('category', filter.categoryId);
    
    // Explicit branchId filter if needed, though fetchWithAuth usually attaches x-branch-id
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/products?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener productos');
    return (json.data || []).map((p: any) => ({ ...p, id: p.id || p._id }));
  }

  async createProduct(token: string, data: CreateProductDto): Promise<Product> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al crear producto');
    const p = json.data;
    return { ...p, id: p.id || p._id };
  }

  async createProductsBatch(token: string, data: CreateProductDto[]): Promise<{ added: number }> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/products/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ products: data }),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al crear productos en lote');
    return json.data;
  }

  async updateProduct(token: string, id: string, data: Partial<CreateProductDto>): Promise<Product> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al actualizar producto');
    const p = json.data;
    return { ...p, id: p.id || p._id };
  }

  async deleteProduct(token: string, id: string): Promise<void> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al eliminar producto');
  }

  // Movements
  async getMovements(token: string, productId?: string): Promise<StockMovement[]> {
    const params = new URLSearchParams();
    if (productId) params.set('product', productId);
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/movements?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener movimientos');
    return (json.data || []).map((m: any) => ({ ...m, id: m.id || m._id }));
  }

  async createMovement(token: string, data: CreateStockMovementDto): Promise<StockMovement> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/movements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al crear movimiento');
    const m = json.data;
    return { ...m, id: m.id || m._id };
  }
}

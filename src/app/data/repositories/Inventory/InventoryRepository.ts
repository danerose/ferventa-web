import type {
  Brand,
  Category,
  Provider,
  Product,
  StockMovement,
  CreateProviderDto,
  CreateProductDto,
  CreateStockMovementDto,
  MerchandiseReception,
  CreateDraftReceptionDto,
  OpenBoxResult,
} from '@/app/domain';


export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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
    } catch {
      // ignore
    }

    const activeBranchId = localStorage.getItem('ferventa_active_branch');
    if (!headers.has('x-branch-id')) {
      headers.set('x-branch-id', activeBranchId || '000000000000000000000000');
    }

    return fetch(url, {
      ...options,
      headers,
    });
  }

  private normalizePaginatedResponse<T, R = Record<string, unknown>>(
    data: unknown,
    mapFn: (item: R) => T
  ): PaginatedResult<T> {
    if (Array.isArray(data)) {
      const items = (data as R[]).map(mapFn);
      return { items, total: items.length, page: 1, limit: items.length || 50, totalPages: 1 };
    }
    if (data && typeof data === 'object') {
      const rec = data as Record<string, unknown>;
      const rawList = rec.items || rec.products || rec.docs || rec.results || rec.data;
      if (Array.isArray(rawList)) {
        const items = (rawList as R[]).map(mapFn);
        return {
          items,
          total: Number(rec.total || rec.count || items.length),
          page: Number(rec.page || 1),
          limit: Number(rec.limit || items.length || 50),
          totalPages: Number(rec.totalPages || rec.pages || 1),
        };
      }
    }
    return { items: [], total: 0, page: 1, limit: 50, totalPages: 1 };
  }

  // Brands & Categories
  async getBrands(token: string): Promise<Brand[]> {
    const res = await this.getBrandsPaginated(token, { limit: 100 });
    return res.items;
  }

  async getBrandsPaginated(token: string, filter: { search?: string; page?: number; limit?: number } = {}): Promise<PaginatedResult<Brand>> {
    const params = new URLSearchParams();
    if (filter.search) {
      params.set('search', filter.search);
      params.set('q', filter.search);
    }
    if (filter.page) params.set('page', String(filter.page));
    if (filter.limit) params.set('limit', String(filter.limit));

    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/brands?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener marcas');
    return this.normalizePaginatedResponse<Brand>(json.data, (b) => ({ ...b, id: String(b.id || b._id) } as unknown as Brand));
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
    const res = await this.getCategoriesPaginated(token, { limit: 100 });
    return res.items;
  }

  async getCategoriesPaginated(token: string, filter: { search?: string; page?: number; limit?: number } = {}): Promise<PaginatedResult<Category>> {
    const params = new URLSearchParams();
    if (filter.search) {
      params.set('search', filter.search);
      params.set('q', filter.search);
    }
    if (filter.page) params.set('page', String(filter.page));
    if (filter.limit) params.set('limit', String(filter.limit));

    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/categories?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener categorías');
    return this.normalizePaginatedResponse<Category>(json.data, (c) => ({ ...c, id: String(c.id || c._id) } as unknown as Category));
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
    const res = await this.getProvidersPaginated(token, { search, limit: 100 });
    return res.items;
  }

  async getProvidersPaginated(token: string, filter: { search?: string; page?: number; limit?: number } = {}): Promise<PaginatedResult<Provider>> {
    const params = new URLSearchParams();
    if (filter.search) {
      params.set('search', filter.search);
      params.set('q', filter.search);
    }
    if (filter.page) params.set('page', String(filter.page));
    if (filter.limit) params.set('limit', String(filter.limit));

    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/providers?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener proveedores');
    return this.normalizePaginatedResponse<Provider>(json.data, (p) => ({ ...p, id: String(p.id || p._id) } as unknown as Provider));
  }

  async createProvider(token: string, data: CreateProviderDto): Promise<Provider> {
    const { branchId, ...payload } = data;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    if (branchId) {
      headers['x-branch-id'] = branchId;
    }

    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/providers`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al crear proveedor');
    const p = json.data;
    return { ...p, id: p.id || p._id };
  }

  async updateProvider(token: string, id: string, data: Partial<CreateProviderDto>): Promise<Provider> {
    const { branchId, ...payload } = data;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    if (branchId) {
      headers['x-branch-id'] = branchId;
    }

    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/providers/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al actualizar proveedor');
    const p = json.data;
    return { ...p, id: p.id || p._id };
  }

  // Products
  async getProducts(token: string, filter: { search?: string; categoryId?: string; branchId?: string; page?: number; limit?: number } = {}): Promise<Product[]> {
    const res = await this.getProductsPaginated(token, filter);
    return res.items;
  }

  async getProductsPaginated(token: string, filter: { search?: string; categoryId?: string; brandId?: string; page?: number; limit?: number } = {}): Promise<PaginatedResult<Product>> {
    const params = new URLSearchParams();
    if (filter.search) {
      params.set('q', filter.search);
      params.set('search', filter.search);
    }
    if (filter.categoryId) {
      params.set('categoryId', filter.categoryId);
      params.set('category', filter.categoryId);
    }
    if (filter.brandId) {
      params.set('brandId', filter.brandId);
      params.set('brand', filter.brandId);
    }
    if (filter.page) params.set('page', String(filter.page));
    if (filter.limit) params.set('limit', String(filter.limit));
    
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/products?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener productos');
    return this.normalizePaginatedResponse<Product>(json.data, (p) => ({ ...p, id: String(p.id || p._id) } as unknown as Product));
  }

  async getProductBySku(token: string, sku: string): Promise<Product | null> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/products/sku/${encodeURIComponent(sku)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      // Fallback search by sku string
      const searchResult = await this.getProductsPaginated(token, { search: sku, limit: 1 });
      return searchResult.items.length > 0 ? searchResult.items[0] : null;
    }

    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success || !json.data) return null;
    const p = json.data;
    return { ...p, id: p.id || p._id };
  }

  async createProduct(token: string, data: CreateProductDto): Promise<Product> {
    const { branchId, ...payload } = data;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    if (branchId) {
      headers['x-branch-id'] = branchId;
    }

    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al crear producto');
    const p = json.data;
    return { ...p, id: p.id || p._id };
  }

  async createProductsBatch(token: string, data: CreateProductDto[]): Promise<{ added: number }> {
    const sanitized = data.map(({ branchId: _b, ...rest }) => rest);
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/products/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ products: sanitized }),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al crear productos en lote');
    return json.data;
  }

  async updateProduct(token: string, id: string, data: Partial<CreateProductDto>): Promise<Product> {
    const { branchId, ...payload } = data;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    if (branchId) {
      headers['x-branch-id'] = branchId;
    }

    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/products/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(payload),
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
    const res = await this.getMovementsPaginated(token, { productId, limit: 100 });
    return res.items;
  }

  async getMovementsPaginated(
    token: string,
    filter: { search?: string; productId?: string; type?: string; page?: number; limit?: number } = {}
  ): Promise<PaginatedResult<StockMovement>> {
    const params = new URLSearchParams();
    if (filter.search) {
      params.set('search', filter.search);
      params.set('q', filter.search);
    }
    if (filter.productId) {
      params.set('product', filter.productId);
      params.set('productId', filter.productId);
    }
    if (filter.type && filter.type !== 'all') params.set('type', filter.type);
    if (filter.page) params.set('page', String(filter.page));
    if (filter.limit) params.set('limit', String(filter.limit));

    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/movements?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener movimientos');
    return this.normalizePaginatedResponse<StockMovement>(json.data, (m) => ({ ...m, id: String(m.id || m._id) } as unknown as StockMovement));
  }

  async createMovement(token: string, data: CreateStockMovementDto): Promise<StockMovement> {
    const payload: Record<string, unknown> = {
      productId: data.productId,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason,
    };
    if (data.providerId && data.providerId.trim()) {
      payload.providerId = data.providerId.trim();
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
    if (data.branchId) {
      headers['x-branch-id'] = data.branchId;
    }

    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/movements`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al crear movimiento');
    const m = json.data;
    return { ...m, id: m.id || m._id };
  }

  async deleteMovement(token: string, id: string): Promise<void> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/movements/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al eliminar movimiento');
  }

  // ── Receptions & QR Boxes ──────────────────────────────────────────────────

  async getReceptions(token: string, status?: string): Promise<MerchandiseReception[]> {
    const res = await this.getReceptionsPaginated(token, { status, limit: 100 });
    return res.items;
  }

  async getReceptionsPaginated(
    token: string,
    filter: { status?: string; search?: string; page?: number; limit?: number } = {}
  ): Promise<PaginatedResult<MerchandiseReception>> {
    const params = new URLSearchParams();
    if (filter.status && filter.status !== 'all') params.set('status', filter.status);
    if (filter.search) {
      params.set('search', filter.search);
      params.set('q', filter.search);
    }
    if (filter.page) params.set('page', String(filter.page));
    if (filter.limit) params.set('limit', String(filter.limit));

    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/receptions?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener recepciones');
    return this.normalizePaginatedResponse<MerchandiseReception>(json.data, (r) => ({
      ...r,
      id: String(r.id || r._id || ''),
    }) as unknown as MerchandiseReception);
  }

  async getReceptionById(token: string, id: string): Promise<MerchandiseReception> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/receptions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener recepción');
    const r = json.data;
    return { ...r, id: String(r?.id || r?._id || '') } as MerchandiseReception;
  }

  async createDraftReception(token: string, data: CreateDraftReceptionDto): Promise<MerchandiseReception> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/receptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al registrar recepción en borrador');
    const r = json.data;
    return { ...r, id: String(r?.id || r?._id || '') } as MerchandiseReception;
  }

  async approveReception(token: string, id: string): Promise<MerchandiseReception> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/receptions/${id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (res.status === 403) throw new Error('Permiso denegado: Solo el Administrador puede aprobar recepciones.');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al aprobar recepción');
    const r = json.data;
    return { ...r, id: String(r?.id || r?._id || '') } as MerchandiseReception;
  }

  async rejectReception(token: string, id: string, reason?: string): Promise<MerchandiseReception> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/receptions/${id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: reason || 'Rechazado por Administrador' }),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (res.status === 403) throw new Error('Permiso denegado: Solo el Administrador puede rechazar recepciones.');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al rechazar recepción');
    const r = json.data;
    return { ...r, id: String(r?.id || r?._id || '') } as MerchandiseReception;
  }

  async openBox(token: string, boxCode: string): Promise<OpenBoxResult> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/inventory/boxes/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ boxCode: boxCode.trim() }),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al abrir caja');
    return json.data as OpenBoxResult;
  }
}



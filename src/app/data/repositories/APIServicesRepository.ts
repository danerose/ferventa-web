import type {
  PredefinedService,
  CreateServiceDto,
  UpdateServiceDto,
} from '../../domain/entities/SalesEntities';

export class APIServicesRepository {
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

    return fetch(url, { ...options, headers });
  }

  /** Map raw API object (_id) to our domain entity (id) */
  private mapService(raw: any): PredefinedService {
    return {
      id: raw._id ?? raw.id,
      name: raw.name,
      description: raw.description,
      basePrice: raw.basePrice ?? 0,
      isActive: raw.isActive ?? true,
      supplies: (raw.supplies ?? []).map((s: any) => ({
        product: {
          _id: s.product?._id ?? s.product,
          name: s.product?.name ?? '',
          sku: s.product?.sku ?? '',
          sellingPrice: s.product?.sellingPrice ?? 0,
        },
        quantity: s.quantity,
      })),
    };
  }

  /** GET /services */
  async getServices(
    token: string,
    filter: { isActive?: boolean; search?: string } = {}
  ): Promise<PredefinedService[]> {
    const res = await this.getServicesPaginated(token, { ...filter, limit: 100 });
    return res.items;
  }

  /** GET /services paginated */
  async getServicesPaginated(
    token: string,
    filter: { isActive?: boolean; search?: string; page?: number; limit?: number } = {}
  ): Promise<{ items: PredefinedService[]; total: number; page: number; limit: number; totalPages: number }> {
    const params = new URLSearchParams();
    if (filter.isActive !== undefined) params.set('isActive', String(filter.isActive));
    if (filter.search) {
      params.set('search', filter.search);
      params.set('q', filter.search);
    }
    if (filter.page) params.set('page', String(filter.page));
    if (filter.limit) params.set('limit', String(filter.limit));

    const res = await this.fetchWithAuth(
      `${this.baseUrl}/services?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener servicios');
    
    const data = json.data;
    if (Array.isArray(data)) {
      const items = data.map((s) => this.mapService(s));
      return { items, total: items.length, page: 1, limit: items.length || 50, totalPages: 1 };
    }
    if (data && typeof data === 'object') {
      const rawList = data.items || data.services || data.docs || data.data;
      if (Array.isArray(rawList)) {
        const items = rawList.map((s: any) => this.mapService(s));
        return {
          items,
          total: data.total ?? data.totalItems ?? items.length,
          page: data.page ?? 1,
          limit: data.limit ?? 50,
          totalPages: data.totalPages ?? 1,
        };
      }
    }
    return { items: [], total: 0, page: 1, limit: 50, totalPages: 1 };
  }

  /** GET /services/:id */
  async getService(token: string, id: string): Promise<PredefinedService> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/services/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener servicio');
    return this.mapService(json.data);
  }

  /** POST /services */
  async createService(token: string, data: CreateServiceDto): Promise<PredefinedService> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al crear servicio');
    return this.mapService(json.data);
  }

  /** PATCH /services/:id */
  async updateService(token: string, id: string, data: UpdateServiceDto): Promise<PredefinedService> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/services/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al actualizar servicio');
    return this.mapService(json.data);
  }

  /** DELETE /services/:id */
  async deleteService(token: string, id: string): Promise<void> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/services/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al eliminar servicio');
  }
}

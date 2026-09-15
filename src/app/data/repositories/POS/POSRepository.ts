import type { Sale, CreateSalePayload, SalesStats } from '@/app/domain';

export class APISalesRepository {
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

    // Always attach active branch
    const activeBranchId = localStorage.getItem('ferventa_active_branch');
    if (!headers.has('x-branch-id')) {
      headers.set('x-branch-id', activeBranchId || '000000000000000000000000');
    }

    return fetch(url, { ...options, headers });
  }

  /** GET /sales — list all sales with optional filters */
  async getSales(
    token: string,
    filter: {
      startDate?: string;
      endDate?: string;
      customerId?: string;
      isCancelled?: boolean;
      saleType?: string;
    } = {}
  ): Promise<Sale[]> {
    const params = new URLSearchParams();
    if (filter.startDate) params.set('startDate', filter.startDate);
    if (filter.endDate) params.set('endDate', filter.endDate);
    if (filter.customerId) params.set('customerId', filter.customerId);
    if (filter.isCancelled !== undefined) params.set('isCancelled', String(filter.isCancelled));
    if (filter.saleType) params.set('saleType', filter.saleType);
    // Always send timezone offset so the backend can align day boundaries to local time
    params.set('utcOffsetMinutes', String(new Date().getTimezoneOffset()));

    const res = await this.fetchWithAuth(
      `${this.baseUrl}/sales?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener ventas');
    const rawSales = json.data ?? [];
    return rawSales.map((s: Record<string, unknown>) => ({
      ...s,
      id: String(s.id || s._id || ''),
    })) as Sale[];
  }

  /** GET /sales/stats — get aggregated sales statistics */
  async getSalesStats(
    token: string,
    filter: {
      startDate?: string;
      endDate?: string;
      isCancelled?: boolean | string;
      paymentMethod?: string;
      customerId?: string;
      branchId?: string;
    } = {}
  ): Promise<SalesStats> {
    const params = new URLSearchParams();
    if (filter.startDate) params.set('startDate', filter.startDate);
    if (filter.endDate) params.set('endDate', filter.endDate);
    if (filter.isCancelled !== undefined && filter.isCancelled !== 'all') {
      params.set('isCancelled', String(filter.isCancelled));
    }
    if (filter.paymentMethod && filter.paymentMethod !== 'all') {
      params.set('paymentMethod', filter.paymentMethod);
    }
    if (filter.customerId) params.set('customerId', filter.customerId);
    if (filter.branchId) params.set('branchId', filter.branchId);
    // Always send timezone offset so the backend can align day boundaries to local time
    params.set('utcOffsetMinutes', String(new Date().getTimezoneOffset()));

    const res = await this.fetchWithAuth(
      `${this.baseUrl}/sales/stats?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener estadísticas de ventas');
    return json.data;
  }

  /** POST /sales — create a new sale */
  async createSale(token: string, data: CreateSalePayload): Promise<Sale> {
    const payload: Record<string, unknown> = {
      items: data.items.map((item) => ({
        type: item.type,
        productId: item.productId,
        serviceId: item.serviceId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
      })),
      paymentMethod: data.paymentMethod,
      globalDiscount: data.globalDiscount || 0,
    };
    if (data.customerId) payload.customerId = data.customerId;
    if (data.quoteId) payload.quoteId = data.quoteId;
    if (data.paymentReference) payload.paymentReference = data.paymentReference;

    const res = await this.fetchWithAuth(`${this.baseUrl}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al crear venta');
    const created = json.data;
    return { ...created, id: String(created?.id || created?._id || '') };
  }

  /** GET /sales/:id — get sale detail */
  async getSale(token: string, id: string): Promise<Sale> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/sales/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener venta');
    const s = json.data;
    return { ...s, id: String(s?.id || s?._id || '') };
  }

  /** GET /sales/ticket/:query — get ticket blob */
  async getTicket(token: string, query: string): Promise<Blob> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/sales/ticket/${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok) throw new Error('Error al obtener el ticket');
    return res.blob();
  }

  /** POST /sales/:id/cancel — cancel a sale and restore stock (Admin only) */
  async cancelSale(token: string, id: string, reason: string): Promise<void> {
    const cleanId = String(id || '').trim();
    if (!cleanId || cleanId === 'undefined' || cleanId === 'null') {
      throw new Error('ID de venta inválido para cancelar');
    }
    const res = await this.fetchWithAuth(`${this.baseUrl}/sales/${cleanId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: reason.trim() }),
    });
    let json: { success?: boolean; message?: string } = {};
    try {
      json = await res.json();
    } catch {
      json = {};
    }
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (res.status === 403) throw new Error('Permisos insuficientes: Solo el Administrador puede cancelar ventas.');
    if (!res.ok || json.success === false) {
      throw new Error(json.message || `Error al cancelar venta (HTTP ${res.status})`);
    }
  }

  /** POST /quotes — create a quotation */
  async createQuote(token: string, data: CreateSalePayload): Promise<{ pdfUrl: string }> {
    const payload: Record<string, unknown> = {
      items: data.items
        .filter((item) => item.productId)
        .map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          discount: item.discount || 0,
        })),
    };
    if (data.customerId) payload.customerId = data.customerId;
    if (data.globalDiscount !== undefined) payload.globalDiscount = data.globalDiscount;

    const res = await this.fetchWithAuth(`${this.baseUrl}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al crear cotización');
    return json.data;
  }
}

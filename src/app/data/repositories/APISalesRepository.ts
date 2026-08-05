import type { Sale, CreateSalePayload } from '../../domain/entities/SalesEntities';

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
    } catch (e) {}

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
    return json.data ?? [];
  }

  /** POST /sales — register a sale (products, services or mixed) */
  async createSale(token: string, data: CreateSalePayload): Promise<Sale> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al crear venta');
    return json.data;
  }

  /** GET /sales/:id — get sale detail */
  async getSale(token: string, id: string): Promise<Sale> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/sales/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener venta');
    return json.data;
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

  /** POST /sales/:id/cancel — cancel a sale and restore stock */
  async cancelSale(token: string, id: string, reason: string): Promise<void> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/sales/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason }),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al cancelar venta');
  }

  /** POST /quotes — create a quotation */
  async createQuote(token: string, data: CreateSalePayload): Promise<{ pdfUrl: string }> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/quotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al crear cotización');
    return json.data;
  }
}

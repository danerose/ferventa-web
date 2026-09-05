import type {
  ISpecialOrdersRepository,
  SpecialOrder,
  SpecialOrderSummary,
  SpecialOrderFilters,
  CreateSpecialOrderPayload,
  AddSpecialOrderPaymentPayload,
  UpdateSpecialOrderStatusPayload,
  CancelSpecialOrderPayload,
} from '@/app/domain';

export class APISpecialOrdersRepository implements ISpecialOrdersRepository {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  private async fetchWithAuth(
    url: string,
    token: string,
    branchId: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Authorization') && token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('x-branch-id') && branchId) {
      headers.set('x-branch-id', branchId);
    }
    return fetch(url, {
      ...options,
      headers,
    });
  }

  private mapOrder(item: Record<string, unknown>): SpecialOrder {
    const cust = (item.customer && typeof item.customer === 'object' ? item.customer : {}) as Record<string, unknown>;
    return {
      id: String(item.id || item._id || ''),
      _id: String(item._id || item.id || ''),
      folio: String(item.folio || 'S/F'),
      itemDescription: String(item.itemDescription || ''),
      costPrice: Number(item.costPrice) || 0,
      sellingPrice: Number(item.sellingPrice) || 0,
      advancePayment: Number(item.advancePayment) || 0,
      minAdvanceRequired: Number(item.minAdvanceRequired) || (Number(item.sellingPrice) || 0) * 0.5,
      advancePercentage: Number(item.advancePercentage) || 0,
      remainingBalance: Number(item.remainingBalance) || 0,
      isFullyPaid: Boolean(item.isFullyPaid),
      status: (item.status as SpecialOrder['status']) || 'pending',
      customer: {
        id: String(cust.id || cust._id || ''),
        _id: String(cust._id || cust.id || ''),
        name: String(cust.name || 'Cliente sin nombre'),
        phone: String(cust.phone || ''),
        email: cust.email ? String(cust.email) : undefined,
      },
      payments: (Array.isArray(item.payments) ? item.payments : []).map((p: Record<string, unknown>) => {
        const recv = (p.receivedBy && typeof p.receivedBy === 'object' ? p.receivedBy : undefined) as Record<string, unknown> | undefined;
        return {
          id: String(p.id || p._id || ''),
          _id: String(p._id || p.id || ''),
          amount: Number(p.amount) || 0,
          paymentMethod: String(p.paymentMethod || 'cash'),
          paymentReference: p.paymentReference ? String(p.paymentReference) : undefined,
          date: String(p.date || p.createdAt || new Date().toISOString()),
          notes: p.notes ? String(p.notes) : undefined,
          receivedBy: recv
            ? {
                id: String(recv.id || recv._id || ''),
                name: recv.name ? String(recv.name) : undefined,
                username: recv.username ? String(recv.username) : undefined,
              }
            : undefined,
        };
      }),
      statusHistory: (Array.isArray(item.statusHistory) ? item.statusHistory : []).map((h: Record<string, unknown>) => {
        const chBy = (h.changedBy && typeof h.changedBy === 'object' ? h.changedBy : undefined) as Record<string, unknown> | undefined;
        return {
          status: String(h.status || ''),
          changedAt: String(h.changedAt || new Date().toISOString()),
          notes: h.notes ? String(h.notes) : undefined,
          changedBy: chBy
            ? {
                id: String(chBy.id || chBy._id || ''),
                name: chBy.name ? String(chBy.name) : undefined,
                username: chBy.username ? String(chBy.username) : undefined,
              }
            : undefined,
        };
      }),
      notes: item.notes ? String(item.notes) : undefined,
      estimatedArrivalDate: item.estimatedArrivalDate ? String(item.estimatedArrivalDate) : undefined,
      cancellationReason: item.cancellationReason ? String(item.cancellationReason) : undefined,
      branch: item.branch ? String(item.branch) : undefined,
      createdBy: (item.createdBy && typeof item.createdBy === 'object')
        ? {
            id: String((item.createdBy as { id?: unknown; _id?: unknown }).id || (item.createdBy as { id?: unknown; _id?: unknown })._id || ''),
            name: (item.createdBy as { name?: unknown }).name ? String((item.createdBy as { name?: unknown }).name) : undefined,
            username: (item.createdBy as { username?: unknown }).username ? String((item.createdBy as { username?: unknown }).username) : undefined,
          }
        : undefined,
      createdAt: String(item.createdAt || new Date().toISOString()),
      updatedAt: String(item.updatedAt || new Date().toISOString()),
    };
  }

  async getOrders(
    token: string,
    branchId: string,
    filters?: SpecialOrderFilters
  ): Promise<SpecialOrder[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.isFullyPaid !== undefined) params.append('isFullyPaid', String(filters.isFullyPaid));
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await this.fetchWithAuth(`${this.baseUrl}/orders${queryString}`, token, branchId);
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener pedidos');

    return (json.data || []).map((item: Record<string, unknown>) => this.mapOrder(item));
  }

  async getOrderById(token: string, branchId: string, id: string): Promise<SpecialOrder> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/orders/${id}`, token, branchId);
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Pedido no encontrado');

    return this.mapOrder(json.data);
  }

  async getSummary(token: string, branchId: string): Promise<SpecialOrderSummary> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/orders/summary`, token, branchId);
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) throw new Error(json.message || 'Error al obtener métricas');

    const data = json.data || {};
    return {
      totalOrders: Number(data.totalOrders) || 0,
      activeOrders: Number(data.activeOrders) || 0,
      deliveredOrders: Number(data.deliveredOrders) || 0,
      cancelledOrders: Number(data.cancelledOrders) || 0,
      totalPendingBalance: Number(data.totalPendingBalance) || 0,
      totalCollected: Number(data.totalCollected) || 0,
      totalSalesValue: Number(data.totalSalesValue) || 0,
      byStatus: data.byStatus || {},
    };
  }

  async createOrder(
    token: string,
    branchId: string,
    payload: CreateSpecialOrderPayload
  ): Promise<SpecialOrder> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/orders`, token, branchId, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al crear pedido especial');
    }

    return this.mapOrder(json.data);
  }

  async updateOrderStatus(
    token: string,
    branchId: string,
    id: string,
    payload: UpdateSpecialOrderStatusPayload
  ): Promise<SpecialOrder> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/orders/${id}/status`, token, branchId, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al actualizar estatus');
    }

    return this.mapOrder(json.data);
  }

  async addPayment(
    token: string,
    branchId: string,
    id: string,
    payload: AddSpecialOrderPaymentPayload
  ): Promise<SpecialOrder> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/orders/${id}/payments`, token, branchId, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al registrar abono');
    }

    return this.mapOrder(json.data);
  }

  async cancelOrder(
    token: string,
    branchId: string,
    id: string,
    payload: CancelSpecialOrderPayload
  ): Promise<SpecialOrder> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/orders/${id}/cancel`, token, branchId, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al cancelar pedido');
    }

    return this.mapOrder(json.data);
  }

  async updateOrder(
    token: string,
    branchId: string,
    id: string,
    payload: Partial<CreateSpecialOrderPayload>
  ): Promise<SpecialOrder> {
    const res = await this.fetchWithAuth(`${this.baseUrl}/orders/${id}`, token, branchId, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.status === 401) throw new Error('UNAUTHORIZED');
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Error al actualizar pedido');
    }

    return this.mapOrder(json.data);
  }
}

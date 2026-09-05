import { create } from 'zustand';
import { specialOrdersUseCases } from '@/core/di/container';
import type {
  SpecialOrder,
  SpecialOrderSummary,
  CreateSpecialOrderPayload,
  AddSpecialOrderPaymentPayload,
  UpdateSpecialOrderStatusPayload,
  CancelSpecialOrderPayload,
} from '@/app/domain';
import { SPECIAL_ORDER_STATUS_LABELS } from '@/core/enums';
import { formatCurrency } from '@/core/utils';

export interface ToastItem {
  id: number;
  type: 'success' | 'error';
  message: string;
}

interface SpecialOrdersState {
  orders: SpecialOrder[];
  summary: SpecialOrderSummary | null;
  isLoading: boolean;
  searchInput: string;
  debouncedSearch: string;
  statusFilter: string;
  paidFilter: 'all' | 'pending' | 'paid';
  selectedOrder: SpecialOrder | null;
  toasts: ToastItem[];

  // Setters & Filter actions
  setSearchInput: (query: string) => void;
  setStatusFilter: (status: string) => void;
  setPaidFilter: (paid: 'all' | 'pending' | 'paid') => void;
  setSelectedOrder: (order: SpecialOrder | null) => void;
  addToast: (type: 'success' | 'error', message: string) => void;
  removeToast: (id: number) => void;

  // Async actions (via use cases)
  loadData: (accessToken: string, branchId: string) => Promise<void>;
  createOrder: (accessToken: string, branchId: string, payload: CreateSpecialOrderPayload) => Promise<SpecialOrder>;
  addPayment: (accessToken: string, branchId: string, orderId: string, payload: AddSpecialOrderPaymentPayload) => Promise<SpecialOrder>;
  updateOrderStatus: (accessToken: string, branchId: string, orderId: string, payload: UpdateSpecialOrderStatusPayload) => Promise<SpecialOrder>;
  cancelOrder: (accessToken: string, branchId: string, orderId: string, payload: CancelSpecialOrderPayload) => Promise<SpecialOrder>;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useSpecialOrdersStore = create<SpecialOrdersState>((set, get) => ({
  orders: [],
  summary: null,
  isLoading: false,
  searchInput: '',
  debouncedSearch: '',
  statusFilter: 'all',
  paidFilter: 'all',
  selectedOrder: null,
  toasts: [],

  setSearchInput: (query: string) => {
    set({ searchInput: query });
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      set({ debouncedSearch: query });
    }, 300);
  },

  setStatusFilter: (status: string) => set({ statusFilter: status }),

  setPaidFilter: (paid: 'all' | 'pending' | 'paid') => set({ paidFilter: paid }),

  setSelectedOrder: (order: SpecialOrder | null) => set({ selectedOrder: order }),

  addToast: (type: 'success' | 'error', message: string) => {
    const id = Date.now() + Math.random();
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  removeToast: (id: number) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  loadData: async (accessToken: string, branchId: string) => {
    if (!accessToken || !branchId) {
      set({ isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const { debouncedSearch, statusFilter, paidFilter } = get();
      const [ordersData, summaryData] = await Promise.all([
        specialOrdersUseCases.getOrders(accessToken, branchId, {
          search: debouncedSearch || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          isFullyPaid:
            paidFilter === 'paid' ? true : paidFilter === 'pending' ? false : undefined,
        }),
        specialOrdersUseCases.getSummary(accessToken, branchId),
      ]);

      set({ orders: ordersData, summary: summaryData });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Error al cargar los pedidos especiales';
      get().addToast('error', errMsg);
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  createOrder: async (accessToken: string, branchId: string, payload: CreateSpecialOrderPayload) => {
    const created = await specialOrdersUseCases.createOrder(accessToken, branchId, payload);
    get().addToast('success', `Pedido ${created.folio} registrado exitosamente.`);
    await get().loadData(accessToken, branchId);
    return created;
  },

  addPayment: async (accessToken: string, branchId: string, orderId: string, payload: AddSpecialOrderPaymentPayload) => {
    const updated = await specialOrdersUseCases.addPayment(accessToken, branchId, orderId, payload);
    get().addToast('success', `Abono de ${formatCurrency(payload.amount)} registrado a ${updated.folio}.`);
    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
      selectedOrder: state.selectedOrder?.id === orderId ? updated : state.selectedOrder,
    }));
    await get().loadData(accessToken, branchId);
    return updated;
  },

  updateOrderStatus: async (accessToken: string, branchId: string, orderId: string, payload: UpdateSpecialOrderStatusPayload) => {
    const updated = await specialOrdersUseCases.updateOrderStatus(accessToken, branchId, orderId, payload);
    get().addToast('success', `Estatus del pedido ${updated.folio} actualizado a ${SPECIAL_ORDER_STATUS_LABELS[updated.status]}.`);
    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
      selectedOrder: state.selectedOrder?.id === orderId ? updated : state.selectedOrder,
    }));
    await get().loadData(accessToken, branchId);
    return updated;
  },

  cancelOrder: async (accessToken: string, branchId: string, orderId: string, payload: CancelSpecialOrderPayload) => {
    const updated = await specialOrdersUseCases.cancelOrder(accessToken, branchId, orderId, payload);
    get().addToast('success', `Pedido ${updated.folio} cancelado.`);
    set((state) => ({
      orders: state.orders.map((o) => (o.id === orderId ? updated : o)),
      selectedOrder: state.selectedOrder?.id === orderId ? updated : state.selectedOrder,
    }));
    await get().loadData(accessToken, branchId);
    return updated;
  },
}));

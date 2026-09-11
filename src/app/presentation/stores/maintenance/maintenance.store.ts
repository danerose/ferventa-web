import { create } from 'zustand';
import { maintenanceUseCases } from '@/core/di/container';
import type { AdminMaintenanceOrder } from '@/app/domain';
import type { MaintenanceStage } from '@/core/enums';

export type MaintenanceScope = 'active' | 'delivered_recent' | 'history';
type MaintenanceOrderStatus = AdminMaintenanceOrder['status'];


export interface MaintenanceFilterState {
  search: string;
  status: string;
  from: string;
  to: string;
  dateField: string;
}

interface MaintenanceState {
  maintenances: AdminMaintenanceOrder[];
  selectedOrder: AdminMaintenanceOrder | null;
  activeScope: MaintenanceScope;
  weekRefDate: Date;
  filters: MaintenanceFilterState;
  loading: boolean;
  updatingId: string | null;
  uploadingEvidence: boolean;
  addingNote: boolean;
  notifying: boolean;
  error: string | null;

  setActiveScope: (scope: MaintenanceScope) => void;
  setWeekRefDate: (date: Date | ((prev: Date) => Date)) => void;
  setSelectedOrder: (order: AdminMaintenanceOrder | null) => void;
  setFilter: (key: keyof MaintenanceFilterState, value: string) => void;
  resetFilters: () => void;
  fetchMaintenances: (accessToken: string, scope?: MaintenanceScope, customFilters?: Partial<MaintenanceFilterState>, refDateOverride?: Date) => Promise<void>;
  updateMaintenanceStatus: (accessToken: string, id: string, status: MaintenanceOrderStatus) => Promise<boolean>;
  assignMechanic: (accessToken: string, id: string, mechanicId: string) => Promise<boolean>;
  updateMaintenanceLaborCost: (accessToken: string, id: string, laborCost: number) => Promise<boolean>;
  addDiagnosticNote: (accessToken: string, id: string, note: string) => Promise<boolean>;
  notifyCustomer: (accessToken: string, id: string, notes?: string) => Promise<boolean>;
  linkMaintenanceSale: (accessToken: string, id: string, payload: { saleId?: string; folio?: string }) => Promise<boolean>;
  unlinkMaintenanceSale: (accessToken: string, id: string) => Promise<boolean>;
  uploadEvidence: (
    accessToken: string,
    orderId: string,
    stage: MaintenanceStage | string,
    files: File[]
  ) => Promise<boolean>;
  clearError: () => void;
}

const defaultFilters: MaintenanceFilterState = {
  search: '',
  status: 'all',
  from: '',
  to: '',
  dateField: 'receptionDate',
};

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  maintenances: [],
  selectedOrder: null,
  activeScope: 'active',
  weekRefDate: new Date(),
  filters: defaultFilters,
  loading: false,
  updatingId: null,
  uploadingEvidence: false,
  addingNote: false,
  notifying: false,
  error: null,

  setActiveScope: (scope: MaintenanceScope) => set({ activeScope: scope }),

  setWeekRefDate: (date) =>
    set((state) => ({
      weekRefDate: typeof date === 'function' ? date(state.weekRefDate) : date,
    })),

  setSelectedOrder: (order: AdminMaintenanceOrder | null) => set({ selectedOrder: order }),

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  resetFilters: () => set({ filters: defaultFilters }),

  fetchMaintenances: async (
    accessToken: string,
    scopeOverride?: MaintenanceScope,
    customFilters?: Partial<MaintenanceFilterState>,
    _refDateOverride?: Date
  ) => {
    if (!accessToken) return;
    if (get().loading) return;
    const scope = scopeOverride || get().activeScope;
    const currentFilters = { ...get().filters, ...(customFilters || {}) };

    set({ loading: true, error: null });
    try {
      // Only 'history' scope uses custom date ranges; 'active' and 'delivered_recent' use their predefined backend scope windows
      const fromParam = scope === 'history' ? currentFilters.from || undefined : undefined;
      const toParam = scope === 'history' ? currentFilters.to || undefined : undefined;
      const dateFieldParam = scope === 'history' ? currentFilters.dateField || undefined : undefined;

      const data = await maintenanceUseCases.getMaintenanceOrders({
        scope,
        status: scope === 'history' && currentFilters.status !== 'all' ? currentFilters.status : undefined,
        search: currentFilters.search.trim() || undefined,
        from: fromParam,
        to: toParam,
        dateField: dateFieldParam,
      });

      // Deduplicate by ID
      const seen = new Set<string>();
      const uniqueData = data.filter((item) => {
        const id = item.id;
        if (!id) return true;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      set({ maintenances: uniqueData, loading: false });

      // If a selected order is currently open, refresh its data
      const currentSelected = get().selectedOrder;
      if (currentSelected) {
        const refreshed = uniqueData.find((o) => o.id === currentSelected.id);
        if (refreshed) {
          set({ selectedOrder: refreshed });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar mantenimientos';
      set({ error: msg, loading: false });
    }
  },

  updateMaintenanceStatus: async (_accessToken: string, id: string, status: MaintenanceOrderStatus) => {
    set({ updatingId: id, error: null });
    try {
      const updatedOrder = await maintenanceUseCases.updateMaintenanceStatus(id, status);
      set((state) => {
        const updatedList = state.maintenances.map((item) =>
          item.id === id ? updatedOrder : item
        );
        const updatedSelected = state.selectedOrder?.id === id
          ? updatedOrder
          : state.selectedOrder;
        return {
          maintenances: updatedList,
          selectedOrder: updatedSelected,
          updatingId: null,
        };
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar estado de mantenimiento';
      set({ error: msg, updatingId: null });
      return false;
    }
  },

  assignMechanic: async (_accessToken: string, id: string, mechanicId: string) => {
    set({ updatingId: id, error: null });
    try {
      const mechanicValue = mechanicId || null;
      const updatedOrder = await maintenanceUseCases.updateMaintenanceOrder(id, {
        assignedMechanic: mechanicValue,
      });
      set((state) => {
        const fallbackMechanic = updatedOrder.assignedMechanic !== undefined ? updatedOrder.assignedMechanic : mechanicValue;
        const updatedList = state.maintenances.map((item) =>
          item.id === id ? { ...item, ...updatedOrder, assignedMechanic: fallbackMechanic } : item
        );
        const updatedSelected = state.selectedOrder?.id === id
          ? { ...state.selectedOrder, ...updatedOrder, assignedMechanic: fallbackMechanic }
          : state.selectedOrder;
        return {
          maintenances: updatedList,
          selectedOrder: updatedSelected,
          updatingId: null,
        };
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al asignar mecánico';
      set({ error: msg, updatingId: null });
      return false;
    }
  },

  updateMaintenanceLaborCost: async (_accessToken: string, id: string, laborCost: number) => {
    try {
      const updatedOrder = await maintenanceUseCases.updateMaintenanceOrder(id, {
        laborCost,
        laborPrice: laborCost,
      });
      set((state) => {
        const updatedList = state.maintenances.map((item) =>
          item.id === id ? updatedOrder : item
        );
        const updatedSelected = state.selectedOrder?.id === id
          ? updatedOrder
          : state.selectedOrder;
        return {
          maintenances: updatedList,
          selectedOrder: updatedSelected,
        };
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar costo de mano de obra';
      set({ error: msg });
      return false;
    }
  },

  addDiagnosticNote: async (_accessToken: string, id: string, note: string) => {
    if (!note.trim()) return false;
    set({ addingNote: true, error: null });
    try {
      const updatedOrder = await maintenanceUseCases.addDiagnosticNote(id, note.trim());
      set((state) => ({
        maintenances: state.maintenances.map((item) =>
          item.id === id ? updatedOrder : item
        ),
        selectedOrder: state.selectedOrder?.id === id ? updatedOrder : state.selectedOrder,
        addingNote: false,
      }));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar nota de diagnóstico';
      set({ error: msg, addingNote: false });
      return false;
    }
  },

  notifyCustomer: async (_accessToken: string, id: string, notes?: string) => {
    set({ notifying: true, error: null });
    try {
      const updatedOrder = await maintenanceUseCases.notifyMaintenance(id, notes);
      set((state) => ({
        maintenances: state.maintenances.map((item) =>
          item.id === id ? updatedOrder : item
        ),
        selectedOrder: state.selectedOrder?.id === id ? updatedOrder : state.selectedOrder,
        notifying: false,
      }));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar notificación al cliente';
      set({ error: msg, notifying: false });
      return false;
    }
  },

  linkMaintenanceSale: async (_accessToken: string, id: string, payload: { saleId?: string; folio?: string }) => {
    set({ updatingId: id, error: null });
    try {
      const updatedOrder = await maintenanceUseCases.linkMaintenanceSale(id, payload);
      set((state) => ({
        maintenances: state.maintenances.map((item) =>
          item.id === id ? updatedOrder : item
        ),
        selectedOrder: state.selectedOrder?.id === id ? updatedOrder : state.selectedOrder,
        updatingId: null,
      }));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al vincular ticket de venta';
      set({ error: msg, updatingId: null });
      return false;
    }
  },

  unlinkMaintenanceSale: async (_accessToken: string, id: string) => {
    set({ updatingId: id, error: null });
    try {
      const updatedOrder = await maintenanceUseCases.unlinkMaintenanceSale(id);
      set((state) => ({
        maintenances: state.maintenances.map((item) =>
          item.id === id ? updatedOrder : item
        ),
        selectedOrder: state.selectedOrder?.id === id ? updatedOrder : state.selectedOrder,
        updatingId: null,
      }));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al desvincular ticket de venta';
      set({ error: msg, updatingId: null });
      return false;
    }
  },

  uploadEvidence: async (
    accessToken: string,
    orderId: string,
    stage: MaintenanceStage | string,
    files: File[]
  ) => {
    if (files.length === 0) return false;
    set({ uploadingEvidence: true, error: null });
    try {
      await maintenanceUseCases.uploadEvidence(orderId, stage, files);
      await get().fetchMaintenances(accessToken);
      set({ uploadingEvidence: false });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al subir evidencia';
      set({ error: msg, uploadingEvidence: false });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));


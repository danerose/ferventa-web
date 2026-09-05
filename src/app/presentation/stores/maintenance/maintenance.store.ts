import { create } from 'zustand';
import { APIAdminRepository } from '@/app/data';
import type { AdminMaintenanceOrder } from '@/app/domain';
import type { MaintenanceStage } from '@/core/enums';

const adminRepo = new APIAdminRepository();

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
  filters: MaintenanceFilterState;
  loading: boolean;
  updatingId: string | null;
  uploadingEvidence: boolean;
  addingNote: boolean;
  notifying: boolean;
  error: string | null;

  setActiveScope: (scope: MaintenanceScope) => void;
  setSelectedOrder: (order: AdminMaintenanceOrder | null) => void;
  setFilter: (key: keyof MaintenanceFilterState, value: string) => void;
  resetFilters: () => void;
  fetchMaintenances: (accessToken: string, scope?: MaintenanceScope, customFilters?: Partial<MaintenanceFilterState>) => Promise<void>;
  updateMaintenanceStatus: (accessToken: string, id: string, status: MaintenanceOrderStatus) => Promise<boolean>;
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
  filters: defaultFilters,
  loading: false,
  updatingId: null,
  uploadingEvidence: false,
  addingNote: false,
  notifying: false,
  error: null,

  setActiveScope: (scope: MaintenanceScope) => set({ activeScope: scope }),

  setSelectedOrder: (order: AdminMaintenanceOrder | null) => set({ selectedOrder: order }),

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  resetFilters: () => set({ filters: defaultFilters }),

  fetchMaintenances: async (accessToken: string, scopeOverride?: MaintenanceScope, customFilters?: Partial<MaintenanceFilterState>) => {
    if (!accessToken) return;
    const scope = scopeOverride || get().activeScope;
    const currentFilters = { ...get().filters, ...(customFilters || {}) };

    set({ loading: true, error: null });
    try {
      const data = await adminRepo.getMaintenances(accessToken, {
        scope,
        status: scope === 'history' && currentFilters.status !== 'all' ? currentFilters.status : undefined,
        search: currentFilters.search.trim() || undefined,
        from: currentFilters.from || undefined,
        to: currentFilters.to || undefined,
        dateField: currentFilters.dateField || undefined,
      });

      set({ maintenances: data, loading: false });

      // If a selected order is currently open, refresh its data
      const currentSelected = get().selectedOrder;
      if (currentSelected) {
        const refreshed = data.find((o) => o.id === currentSelected.id);
        if (refreshed) {
          set({ selectedOrder: refreshed });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar mantenimientos';
      set({ error: msg, loading: false });
    }
  },

  updateMaintenanceStatus: async (accessToken: string, id: string, status: MaintenanceOrderStatus) => {
    if (!accessToken) return false;
    set({ updatingId: id, error: null });
    try {
      await adminRepo.updateMaintenance(accessToken, id, { status });
      set((state) => {
        const updatedList = state.maintenances.map((item) =>
          item.id === id ? { ...item, status } : item
        );
        const updatedSelected = state.selectedOrder?.id === id
          ? { ...state.selectedOrder, status }
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

  updateMaintenanceLaborCost: async (accessToken: string, id: string, laborCost: number) => {
    if (!accessToken) return false;
    try {
      await adminRepo.updateMaintenance(accessToken, id, { laborCost });
      set((state) => {
        const updatedList = state.maintenances.map((item) =>
          item.id === id ? { ...item, laborCost, laborPrice: laborCost } : item
        );
        const updatedSelected = state.selectedOrder?.id === id
          ? { ...state.selectedOrder, laborCost, laborPrice: laborCost }
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

  addDiagnosticNote: async (accessToken: string, id: string, note: string) => {
    if (!accessToken || !note.trim()) return false;
    set({ addingNote: true, error: null });
    try {
      const updatedOrder = await adminRepo.addDiagnosticNote(accessToken, id, note.trim());
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

  notifyCustomer: async (accessToken: string, id: string, notes?: string) => {
    if (!accessToken) return false;
    set({ notifying: true, error: null });
    try {
      const updatedOrder = await adminRepo.notifyMaintenance(accessToken, id, notes);
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

  linkMaintenanceSale: async (accessToken: string, id: string, payload: { saleId?: string; folio?: string }) => {
    if (!accessToken) return false;
    set({ updatingId: id, error: null });
    try {
      const updatedOrder = await adminRepo.linkMaintenanceSale(accessToken, id, payload);
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

  unlinkMaintenanceSale: async (accessToken: string, id: string) => {
    if (!accessToken) return false;
    set({ updatingId: id, error: null });
    try {
      const updatedOrder = await adminRepo.unlinkMaintenanceSale(accessToken, id);
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
    if (!accessToken || files.length === 0) return false;
    set({ uploadingEvidence: true, error: null });
    try {
      await adminRepo.uploadMaintenanceEvidence(accessToken, orderId, stage, files);
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


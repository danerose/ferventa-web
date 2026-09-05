import { create } from 'zustand';
import { APIAdminRepository } from '@/app/data';
import type { AdminMaintenanceOrder } from '@/app/domain';
import type { MaintenanceStage } from '@/core/enums';

const adminRepo = new APIAdminRepository();

type MaintenanceOrderStatus = AdminMaintenanceOrder['status'];

interface MaintenanceState {
  maintenances: AdminMaintenanceOrder[];
  loading: boolean;
  updatingId: string | null;
  uploadingEvidence: boolean;
  error: string | null;

  fetchMaintenances: (accessToken: string) => Promise<void>;
  updateMaintenanceStatus: (accessToken: string, id: string, status: MaintenanceOrderStatus) => Promise<boolean>;
  uploadEvidence: (
    accessToken: string,
    orderId: string,
    stage: MaintenanceStage | string,
    files: File[]
  ) => Promise<boolean>;
  clearError: () => void;
}

export const useMaintenanceStore = create<MaintenanceState>((set) => ({
  maintenances: [],
  loading: false,
  updatingId: null,
  uploadingEvidence: false,
  error: null,

  fetchMaintenances: async (accessToken: string) => {
    if (!accessToken) return;
    set({ loading: true, error: null });
    try {
      const data = await adminRepo.getMaintenances(accessToken);
      set({ maintenances: data, loading: false });
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
      set((state) => ({
        maintenances: state.maintenances.map((item) =>
          item.id === id ? { ...item, status } : item
        ),
        updatingId: null,
      }));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar estado de mantenimiento';
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
      const updatedData = await adminRepo.getMaintenances(accessToken);
      set({ maintenances: updatedData, uploadingEvidence: false });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al subir evidencia';
      set({ error: msg, uploadingEvidence: false });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));

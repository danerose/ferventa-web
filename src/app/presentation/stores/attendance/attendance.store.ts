import { create } from 'zustand';
import { attendanceRepository, userUseCases, branchUseCases } from '@/core/di/container';
import type {
  AttendanceRecord,
  AttendancePeriodSummary,
  TodayAttendanceStatus,
} from '@/app/domain';
import type { User } from '@/app/domain';
import type { Branch } from '@/app/domain';


interface AttendanceState {
  records: AttendanceRecord[];
  summary: AttendancePeriodSummary | null;
  todayStatus: TodayAttendanceStatus | null;
  collaborators: User[];
  branches: Branch[];
  loading: boolean;
  isActionLoading: boolean;
  error: string | null;

  fetchMyRecords: (startDate?: string, endDate?: string) => Promise<void>;
  fetchAdminRecords: (filters?: {
    branchId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) => Promise<void>;
  fetchAdminSummary: (filters?: {
    branchId?: string;
    period?: 'weekly' | 'biweekly' | 'monthly' | 'custom';
    startDate?: string;
    endDate?: string;
  }) => Promise<void>;
  fetchInitialData: (accessToken: string) => Promise<void>;
  clockIn: (note?: string, userId?: string) => Promise<{ success: boolean; message: string; record?: AttendanceRecord }>;
  clockOut: (note?: string, userId?: string) => Promise<{ success: boolean; message: string; record?: AttendanceRecord }>;
  updateRecord: (id: string, data: { clockIn?: string; clockOut?: string; adminNotes?: string }) => Promise<boolean>;
  clearError: () => void;
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
  records: [],
  summary: null,
  todayStatus: null,
  collaborators: [],
  branches: [],
  loading: false,
  isActionLoading: false,
  error: null,

  fetchMyRecords: async (startDate?: string, endDate?: string) => {
    set({ loading: true, error: null });
    try {
      const records = await attendanceRepository.getMyRecords(startDate, endDate);
      set({ records, loading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar registros';
      set({ error: msg, loading: false });
    }
  },

  fetchAdminRecords: async (filters) => {
    set({ loading: true, error: null });
    try {
      const records = await attendanceRepository.getAdminRecords(filters);
      set({ records, loading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar registros administrativos';
      set({ error: msg, loading: false });
    }
  },

  fetchAdminSummary: async (filters) => {
    set({ loading: true, error: null });
    try {
      const summary = await attendanceRepository.getAdminSummary(filters);
      set({ summary, loading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar resumen del periodo';
      set({ error: msg, loading: false });
    }
  },

  fetchInitialData: async (accessToken: string) => {
    if (!accessToken) return;
    set({ loading: true, error: null });
    try {
      const [users, branches] = await Promise.all([
        userUseCases.getUsers(accessToken),
        branchUseCases.getBranches(),
      ]);
      set({ collaborators: users, branches: branches || [], loading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar datos de colaboradores y sedes';
      set({ error: msg, loading: false });
    }
  },

  clockIn: async (note?: string, userId?: string) => {
    set({ isActionLoading: true, error: null });
    try {
      const result = await attendanceRepository.clockIn(note, userId);
      set({ isActionLoading: false });
      return { success: true, message: 'Entrada registrada exitosamente', record: result };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar entrada';
      set({ isActionLoading: false, error: msg });
      return { success: false, message: msg };
    }
  },

  clockOut: async (note?: string, userId?: string) => {
    set({ isActionLoading: true, error: null });
    try {
      const result = await attendanceRepository.clockOut(note, userId);
      set({ isActionLoading: false });
      return { success: true, message: 'Salida registrada exitosamente', record: result };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar salida';
      set({ isActionLoading: false, error: msg });
      return { success: false, message: msg };
    }
  },

  updateRecord: async (id: string, data: { clockIn?: string; clockOut?: string; adminNotes?: string }) => {
    set({ isActionLoading: true, error: null });
    try {
      const updated = await attendanceRepository.updateRecord(id, data);
      set((state) => ({
        records: state.records.map((r) => (r.id === id ? updated : r)),
        isActionLoading: false,
      }));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar registro de asistencia';
      set({ isActionLoading: false, error: msg });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));

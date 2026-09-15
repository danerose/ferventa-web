import { create } from 'zustand';
import type { AuditLog, AuditLogFilter } from '@/app/domain';
import { auditRepository } from '@/core/di/container';

interface AuditState {
  logs: AuditLog[];
  total: number;
  loading: boolean;
  error: string | null;
  filter: AuditLogFilter;
  setFilter: (f: Partial<AuditLogFilter>) => void;
  resetFilter: () => void;
  fetchLogs: (token?: string) => Promise<void>;
}

const initialFilter: AuditLogFilter = {
  module: '',
  action: '',
  userId: '',
  from: '',
  to: '',
  search: '',
  page: 1,
  limit: 50,
};

export const useAuditStore = create<AuditState>((set, get) => ({
  logs: [],
  total: 0,
  loading: false,
  error: null,
  filter: { ...initialFilter },

  setFilter: (f) => {
    set((state) => ({ filter: { ...state.filter, ...f } }));
  },

  resetFilter: () => {
    set({ filter: { ...initialFilter } });
  },

  fetchLogs: async (_token?: string) => {
    set({ loading: true, error: null });
    try {
      const res = await auditRepository.getAuditLogs(get().filter);
      set({ logs: res.logs, total: res.total ?? res.logs.length, loading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar auditoría';
      set({ error: msg, loading: false });
    }
  },
}));

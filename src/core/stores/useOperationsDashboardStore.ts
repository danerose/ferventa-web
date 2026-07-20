import { create } from 'zustand';

interface DashboardStats {
  salesTotal: number;
  salesGrowth: number;
  pendingAppointments: number;
  activeWorkorders: number;
  lowStockItems: number;
}

interface OperationsDashboardState {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;

  setStats: (stats: DashboardStats | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useOperationsDashboardStore = create<OperationsDashboardState>((set) => ({
  stats: null,
  loading: false,
  error: null,

  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

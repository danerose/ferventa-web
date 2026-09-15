import { create } from 'zustand';
import type { KioskEmployee, KioskClockAction, KioskClockResult } from '@/app/domain';
import { kioskRepository } from '@/core/di/container';

interface KioskState {
  employees: KioskEmployee[];
  loading: boolean;
  error: string | null;
  selectedEmployee: KioskEmployee | null;
  pin: string;
  clocking: boolean;
  actionSuccess: KioskClockResult | null;
  fetchEmployees: (branchId?: string) => Promise<void>;
  selectEmployee: (emp: KioskEmployee | null) => void;
  appendPinDigit: (digit: string) => void;
  deletePinDigit: () => void;
  clearPin: () => void;
  submitClock: (action: KioskClockAction, branchId: string, notes?: string) => Promise<boolean>;
  clearSuccess: () => void;
}

export const useKioskStore = create<KioskState>((set, get) => ({
  employees: [],
  loading: false,
  error: null,
  selectedEmployee: null,
  pin: '',
  clocking: false,
  actionSuccess: null,

  fetchEmployees: async (branchId?: string) => {
    set({ loading: true, error: null });
    try {
      const list = await kioskRepository.getKioskEmployees(branchId);
      set({ employees: list, loading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar empleados del kiosco';
      set({ error: msg, loading: false });
    }
  },

  selectEmployee: (emp) => {
    set({ selectedEmployee: emp, pin: '', error: null, actionSuccess: null });
  },

  appendPinDigit: (digit) => {
    const current = get().pin;
    if (current.length >= 4) return;
    set({ pin: current + digit, error: null });
  },

  deletePinDigit: () => {
    const current = get().pin;
    set({ pin: current.slice(0, -1), error: null });
  },

  clearPin: () => {
    set({ pin: '', error: null });
  },

  submitClock: async (action: KioskClockAction, branchId: string, notes?: string) => {
    const { selectedEmployee, pin } = get();
    if (!selectedEmployee) {
      set({ error: 'Selecciona un colaborador primero.' });
      return false;
    }
    if (pin.length !== 4) {
      set({ error: 'Ingresa tu PIN personal de 4 dígitos completo.' });
      return false;
    }

    set({ clocking: true, error: null });
    try {
      const result = await kioskRepository.clockWithPin({
        branchId,
        userId: selectedEmployee.id,
        pin,
        action,
        notes,
      });

      set({
        clocking: false,
        actionSuccess: result,
        pin: '',
        selectedEmployee: null,
      });

      // Refresh list to update badge status
      get().fetchEmployees(branchId);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar turno con PIN';
      set({ error: msg, clocking: false, pin: '' });
      return false;
    }
  },

  clearSuccess: () => {
    set({ actionSuccess: null, error: null });
  },
}));

import { create } from 'zustand';
import { scheduleUseCases } from '@/core/di/container';
import type { Schedule, Holiday } from '@/app/domain';


interface ScheduleState {
  schedules: Schedule[];
  holidays: Holiday[];
  loading: boolean;
  isSaving: boolean;
  error: string | null;

  fetchScheduleAndHolidays: () => Promise<void>;
  saveSchedule: (schedules: Schedule[]) => Promise<boolean>;
  createHoliday: (data: { date: string; description: string }) => Promise<boolean>;
  deleteHoliday: (id: string) => Promise<boolean>;
  clearError: () => void;
}

const DEFAULT_SCHEDULE: Schedule[] = Array.from({ length: 7 }).map((_, i) => ({
  dayOfWeek: i,
  isWorking: i >= 1 && i <= 5, // Lunes a Viernes
  startTime: '09:00',
  endTime: '18:00',
}));

export const useScheduleStore = create<ScheduleState>((set) => ({
  schedules: [],
  holidays: [],
  loading: false,
  isSaving: false,
  error: null,

  fetchScheduleAndHolidays: async () => {
    set({ loading: true, error: null });
    try {
      const [schData, holData] = await Promise.all([
        scheduleUseCases.getSchedule(),
        scheduleUseCases.getHolidays(),
      ]);

      const initialSchedule = schData.length === 0 ? DEFAULT_SCHEDULE : schData;
      set({ schedules: initialSchedule, holidays: holData, loading: false });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar horarios y feriados';
      set({ error: msg, loading: false });
    }
  },

  saveSchedule: async (newSchedules: Schedule[]) => {
    set({ isSaving: true, error: null });
    try {
      await scheduleUseCases.updateSchedule(newSchedules);
      set({ schedules: newSchedules, isSaving: false });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar horarios';
      set({ error: msg, isSaving: false });
      return false;
    }
  },

  createHoliday: async (data) => {
    set({ isSaving: true, error: null });
    try {
      await scheduleUseCases.createHoliday(data.date, data.description);
      const updatedHolidays = await scheduleUseCases.getHolidays();
      set({ holidays: updatedHolidays, isSaving: false });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear feriado';
      set({ error: msg, isSaving: false });
      return false;
    }
  },

  deleteHoliday: async (id) => {
    set({ isSaving: true, error: null });
    try {
      await scheduleUseCases.deleteHoliday(id);
      set((state) => ({
        holidays: state.holidays.filter((h) => h.id !== id),
        isSaving: false,
      }));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar feriado';
      set({ error: msg, isSaving: false });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));

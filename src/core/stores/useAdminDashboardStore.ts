import { create } from 'zustand';
import type { AdminAppointment } from '@/app/domain/entities/AdminEntities';
import type { OccupiedSlots } from '@/app/domain/entities/ClientPortalEntities';

export type DashboardModalType =
  | 'approve'
  | 'reject'
  | 'reschedule'
  | 'approveRescheduled'
  | 'addAppointment'
  | 'cancelApproved'
  | 'complete'
  | null;

export interface ToastMessage {
  id: number;
  type: 'success' | 'error';
  message: string;
}

interface AdminDashboardState {
  // State
  appointments: AdminAppointment[];
  loading: boolean;
  error: string | null;
  statusFilter: string;
  branchFilter: string;
  searchValue: string;
  updatingId: string | null;
  toasts: ToastMessage[];
  activeModal: DashboardModalType;
  selectedAppt: AdminAppointment | null;
  modalMessage: string;
  isMessageEdited: boolean;
  rejectionReason: string;
  suggestedSchedules: { date: string; time: string }[];
  newSuggestionDate: string;
  newSuggestionTime: string;
  finalDate: string;
  finalTime: string;
  occupiedSlots: OccupiedSlots | null;
  occupiedLoading: boolean;
  viewType: 'list' | 'calendar';
  timelineAppointments: AdminAppointment[];
  timelineLoading: boolean;
  currentWeekRefDate: Date;
  selectedTimelineAppt: AdminAppointment | null;

  // Actions
  setAppointments: (appointments: AdminAppointment[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStatusFilter: (filter: string) => void;
  setBranchFilter: (filter: string) => void;
  setSearchValue: (val: string) => void;
  setUpdatingId: (id: string | null) => void;
  addToast: (type: 'success' | 'error', message: string) => void;
  removeToast: (id: number) => void;
  setActiveModal: (modal: DashboardModalType) => void;
  setSelectedAppt: (appt: AdminAppointment | null) => void;
  setModalMessage: (msg: string) => void;
  setIsMessageEdited: (edited: boolean) => void;
  setRejectionReason: (reason: string) => void;
  setSuggestedSchedules: (
    schedules:
      | { date: string; time: string }[]
      | ((prev: { date: string; time: string }[]) => { date: string; time: string }[])
  ) => void;
  setNewSuggestionDate: (date: string) => void;
  setNewSuggestionTime: (time: string) => void;
  setFinalDate: (date: string) => void;
  setFinalTime: (time: string) => void;
  setOccupiedSlots: (slots: OccupiedSlots | null) => void;
  setOccupiedLoading: (loading: boolean) => void;
  setViewType: (view: 'list' | 'calendar') => void;
  setTimelineAppointments: (appointments: AdminAppointment[]) => void;
  setTimelineLoading: (loading: boolean) => void;
  setCurrentWeekRefDate: (date: Date | ((prev: Date) => Date)) => void;
  setSelectedTimelineAppt: (appt: AdminAppointment | null) => void;
  updateAppointmentInStates: (id: string, updatedFields: Partial<AdminAppointment>) => void;
}

export const useAdminDashboardStore = create<AdminDashboardState>((set) => ({
  // Initial State
  appointments: [],
  loading: true,
  error: null,
  statusFilter: 'pending',
  branchFilter: 'all',
  searchValue: '',
  updatingId: null,
  toasts: [],
  activeModal: null,
  selectedAppt: null,
  modalMessage: '',
  isMessageEdited: false,
  rejectionReason: '',
  suggestedSchedules: [],
  newSuggestionDate: '',
  newSuggestionTime: '09:00',
  finalDate: '',
  finalTime: '08:00',
  occupiedSlots: null,
  occupiedLoading: false,
  viewType: 'list',
  timelineAppointments: [],
  timelineLoading: false,
  currentWeekRefDate: new Date(),
  selectedTimelineAppt: null,

  // Actions
  setAppointments: (appointments) => set({ appointments }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setBranchFilter: (branchFilter) => set({ branchFilter }),
  setSearchValue: (searchValue) => set({ searchValue }),
  setUpdatingId: (updatingId) => set({ updatingId }),
  addToast: (type, message) => {
    const id = Date.now() + Math.random();
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3500);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  setActiveModal: (activeModal) => set({ activeModal }),
  setSelectedAppt: (selectedAppt) => set({ selectedAppt }),
  setModalMessage: (modalMessage) => set({ modalMessage }),
  setIsMessageEdited: (isMessageEdited) => set({ isMessageEdited }),
  setRejectionReason: (rejectionReason) => set({ rejectionReason }),
  setSuggestedSchedules: (schedules) =>
    set((state) => ({
      suggestedSchedules:
        typeof schedules === 'function' ? schedules(state.suggestedSchedules) : schedules,
    })),
  setNewSuggestionDate: (newSuggestionDate) => set({ newSuggestionDate }),
  setNewSuggestionTime: (newSuggestionTime) => set({ newSuggestionTime }),
  setFinalDate: (finalDate) => set({ finalDate }),
  setFinalTime: (finalTime) => set({ finalTime }),
  setOccupiedSlots: (occupiedSlots) => set({ occupiedSlots }),
  setOccupiedLoading: (occupiedLoading) => set({ occupiedLoading }),
  setViewType: (viewType) => set({ viewType }),
  setTimelineAppointments: (timelineAppointments) => set({ timelineAppointments }),
  setTimelineLoading: (timelineLoading) => set({ timelineLoading }),
  setCurrentWeekRefDate: (currentWeekRefDate) =>
    set((state) => ({
      currentWeekRefDate:
        typeof currentWeekRefDate === 'function'
          ? currentWeekRefDate(state.currentWeekRefDate)
          : currentWeekRefDate,
    })),
  setSelectedTimelineAppt: (selectedTimelineAppt) => set({ selectedTimelineAppt }),

  updateAppointmentInStates: (id, updatedFields) =>
    set((state) => {
      const updatedAppointments = state.appointments.map((a) =>
        a.id === id ? ({ ...a, ...updatedFields } as AdminAppointment) : a
      );
      const updatedTimelineAppointments = state.timelineAppointments.map((a) =>
        a.id === id ? ({ ...a, ...updatedFields } as AdminAppointment) : a
      );

      // Also sync selectedAppt if it is the one updated
      const updatedSelectedAppt =
        state.selectedAppt && state.selectedAppt.id === id
          ? ({ ...state.selectedAppt, ...updatedFields } as AdminAppointment)
          : state.selectedAppt;

      const updatedSelectedTimelineAppt =
        state.selectedTimelineAppt && state.selectedTimelineAppt.id === id
          ? ({ ...state.selectedTimelineAppt, ...updatedFields } as AdminAppointment)
          : state.selectedTimelineAppt;

      return {
        appointments: updatedAppointments,
        timelineAppointments: updatedTimelineAppointments,
        selectedAppt: updatedSelectedAppt,
        selectedTimelineAppt: updatedSelectedTimelineAppt,
      };
    }),
}));

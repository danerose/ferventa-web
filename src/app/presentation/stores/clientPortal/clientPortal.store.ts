import { create } from 'zustand';
import type { Appointment, MaintenanceTrack, OccupiedSlots, Branch } from '@/app/domain';
import { clientPortalUseCases } from '@/core/di/container';
import { cleanPhoneDigits } from '@/core/utils';

interface ClientPortalState {
  // Booking States
  bookingLoading: boolean;
  bookingSuccess: boolean;
  bookingError: string | null;

  // Form Fields
  formCustomerName: string;
  formCustomerPhone: string;
  formCustomerEmail: string;
  formBrand: string;
  formModel: string;
  formYear: string;
  formSerialNumberLastFour: string;
  formServiceRequested: string;
  formSelectedDate: string;
  formSelectedTime: string;
  formNotes: string;
  formBranchName: string;
  formBranchId: string;
  formValidationError: string | null;

  // Search States
  searchQuery: string;
  searchLoading: boolean;
  searchError: string | null;
  appointments: Appointment[];
  maintenanceTrack: MaintenanceTrack | null;
  hasSearched: boolean;

  // Occupied Slots States
  occupiedSlots: OccupiedSlots | null;
  occupiedSlotsLoading: boolean;
  occupiedSlotsError: string | null;

  // Branches
  branches: Branch[];

  // Actions
  setFormField: (field: string, value: string) => void;
  setFormValidationError: (error: string | null) => void;
  submitBooking: () => Promise<void>;
  searchStatus: (query: string) => Promise<void>;
  loadOccupiedSlots: (startDate: string, endDate: string) => Promise<void>;
  resetForm: () => void;
  resetBookingState: () => void;
  clearSearchResults: () => void;
  loadBranches: () => Promise<void>;
}

export const useClientPortalStore = create<ClientPortalState>((set, get) => ({
  bookingLoading: false,
  bookingSuccess: false,
  bookingError: null,

  formCustomerName: '',
  formCustomerPhone: '',
  formCustomerEmail: '',
  formBrand: '',
  formModel: '',
  formYear: '',
  formSerialNumberLastFour: '',
  formServiceRequested: 'Frenos y Suspensión',
  formSelectedDate: '',
  formSelectedTime: '',
  formNotes: '',
  formBranchName: 'Nova FV Sucursal Uman',
  formBranchId: '',
  formValidationError: null,

  searchQuery: '',
  searchLoading: false,
  searchError: null,
  appointments: [],
  maintenanceTrack: null,
  hasSearched: false,

  occupiedSlots: null,
  occupiedSlotsLoading: false,
  occupiedSlotsError: null,

  branches: [],

  setFormField: (field, value) => {
    set((state) => ({
      ...state,
      [field]: value,
      formValidationError: null,
    }));
  },

  setFormValidationError: (error) => {
    set({ formValidationError: error });
  },

  submitBooking: async () => {
    const {
      formCustomerName,
      formCustomerPhone,
      formCustomerEmail,
      formBrand,
      formModel,
      formYear,
      formSerialNumberLastFour,
      formServiceRequested,
      formSelectedDate,
      formSelectedTime,
      formNotes,
      formBranchName,
      formBranchId,
    } = get();

    set({ bookingLoading: true, bookingSuccess: false, bookingError: null, formValidationError: null });

    // Validate fields
    if (!formCustomerName.trim()) {
      set({ bookingLoading: false, formValidationError: 'El nombre completo es requerido.' });
      return;
    }
    if (!formCustomerPhone.trim() || cleanPhoneDigits(formCustomerPhone).length < 10) {
      set({ bookingLoading: false, formValidationError: 'El teléfono es requerido (mínimo 10 dígitos).' });
      return;
    }
    if (!formSelectedDate || !formSelectedTime) {
      set({ bookingLoading: false, formValidationError: 'La fecha y el horario de la cita son requeridos.' });
      return;
    }

    try {
      if (formBranchId) {
        localStorage.setItem('ferventa_public_branch', formBranchId);
      }
      
      const scheduledAtStr = `${formSelectedDate}T${formSelectedTime}:00Z`;
      const selectedDateObj = new Date(scheduledAtStr);

      const serialToSend = formSerialNumberLastFour?.trim()
        ? formSerialNumberLastFour.trim().slice(0, 4).toUpperCase()
        : 'N/A';

      await clientPortalUseCases.bookAppointment.execute({
        customerName: formCustomerName.trim(),
        customerPhone: formCustomerPhone.trim(),
        customerEmail: formCustomerEmail.trim(),
        vehicle: {
          brand: formBrand.trim() || 'Genérica',
          model: formModel.trim() || 'Generico',
          year: formYear.trim() === '' ? 1900 : (parseInt(formYear) || 0),
          serialNumberLastFour: serialToSend,
        },
        serviceRequested: formServiceRequested,
        scheduledAt: selectedDateObj.toISOString(),
        notes: formNotes.trim(),
        branchName: formBranchName,
      });

      set({ bookingLoading: false, bookingSuccess: true, bookingError: null });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Error al agendar la cita';
      set({ bookingLoading: false, bookingSuccess: false, bookingError: errMsg });
      throw error;
    }
  },

  searchStatus: async (query) => {
    set({ searchLoading: true, searchError: null, searchQuery: query, hasSearched: true });
    try {
      const [appointments, maintenanceTrack] = await Promise.all([
        clientPortalUseCases.getAppointmentStatus.execute(query).catch((err) => {
          console.warn('Failed querying appointments status:', err);
          return [] as Appointment[];
        }),
        clientPortalUseCases.getMaintenanceTrack.execute(query).catch((err) => {
          console.warn('Failed querying maintenance tracking:', err);
          return null as MaintenanceTrack | null;
        }),
      ]);

      set({
        appointments,
        maintenanceTrack,
        searchLoading: false,
        searchError: null,
      });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Error al realizar la búsqueda';
      set({
        appointments: [],
        maintenanceTrack: null,
        searchLoading: false,
        searchError: errMsg,
      });
    }
  },

  loadOccupiedSlots: async (startDate, endDate) => {
    set({ occupiedSlotsLoading: true, occupiedSlotsError: null });
    try {
      const occupiedSlots = await clientPortalUseCases.getOccupiedSlots.execute(startDate, endDate);
      set({ occupiedSlots, occupiedSlotsLoading: false, occupiedSlotsError: null });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Error al cargar horarios ocupados';
      set({ occupiedSlotsLoading: false, occupiedSlotsError: errMsg });
    }
  },

  resetForm: () => {
    set({
      formCustomerName: '',
      formCustomerPhone: '',
      formCustomerEmail: '',
      formBrand: '',
      formModel: '',
      formYear: '',
      formSerialNumberLastFour: '',
      formServiceRequested: 'Frenos y Suspensión',
      formSelectedDate: '',
      formSelectedTime: '',
      formNotes: '',
      formBranchName: 'Nova FV Sucursal Uman',
      formValidationError: null,
      bookingSuccess: false,
      bookingError: null,
      bookingLoading: false,
    });
  },

  resetBookingState: () => {
    set({ bookingLoading: false, bookingSuccess: false, bookingError: null });
  },

  clearSearchResults: () => {
    set({
      appointments: [],
      maintenanceTrack: null,
      searchLoading: false,
      searchError: null,
      searchQuery: '',
      hasSearched: false,
    });
  },

  loadBranches: async () => {
    try {
      const branches = await clientPortalUseCases.getPublicBranches();
      set({ branches });
      const currentBranchId = get().formBranchId;
      if (branches.length > 0 && !currentBranchId) {
        const firstBranch = branches[0];
        const firstBranchId = firstBranch.id || firstBranch._id || '';
        set({ formBranchId: firstBranchId, formBranchName: firstBranch.name });
        localStorage.setItem('ferventa_public_branch', firstBranchId);
      }
    } catch (e) {
      console.error('Error fetching public branches:', e);
    }
  }
}));

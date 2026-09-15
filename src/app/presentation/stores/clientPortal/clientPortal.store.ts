import { create } from 'zustand';
import type { Appointment, MaintenanceTrack, OccupiedSlots, PublicBranch } from '@/app/domain';
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
  formColor: string;
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
  branches: PublicBranch[];

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
  formColor: '',
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
    set({
      [field]: value,
      formValidationError: null,
    } as unknown as Partial<ClientPortalState>);
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
      formColor,
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
    if (!formBrand.trim()) {
      set({ bookingLoading: false, formValidationError: 'La marca del vehículo es requerida.' });
      return;
    }
    if (!formModel.trim()) {
      set({ bookingLoading: false, formValidationError: 'El modelo del vehículo es requerido.' });
      return;
    }
    if (!formSelectedDate || !formSelectedTime) {
      set({ bookingLoading: false, formValidationError: 'La fecha y el horario de la cita son requeridos.' });
      return;
    }

    try {
      const scheduledAtStr = `${formSelectedDate}T${formSelectedTime}:00Z`;
      const selectedDateObj = new Date(scheduledAtStr);

      const serialToSend = formSerialNumberLastFour?.trim()
        ? formSerialNumberLastFour.trim().slice(0, 4).toUpperCase()
        : '';

      const parsedYear = formYear.trim() !== '' ? (parseInt(formYear.trim(), 10) || undefined) : undefined;

      await clientPortalUseCases.bookAppointment.execute({
        customerName: formCustomerName.trim(),
        customerPhone: formCustomerPhone.trim(),
        customerEmail: formCustomerEmail.trim(),
        vehicle: {
          brand: formBrand.trim(),
          model: formModel.trim(),
          year: parsedYear || '',
          serialNumberLastFour: serialToSend,
          color: formColor.trim() || undefined,
        },
        serviceRequested: formServiceRequested,
        scheduledAt: selectedDateObj.toISOString(),
        notes: formNotes.trim(),
        branchName: formBranchName,
        branchId: formBranchId || undefined,
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
      set({ appointments, maintenanceTrack, searchLoading: false });
    } catch {
      set({
        searchError: 'No se pudo consultar el estatus. Por favor intente más tarde.',
        searchLoading: false,
      });
    }
  },

  loadOccupiedSlots: async (startDate, endDate) => {
    set({ occupiedSlotsLoading: true, occupiedSlotsError: null });
    try {
      const currentBranch = get().formBranchId || undefined;
      const slots = await clientPortalUseCases.getOccupiedSlots.execute(startDate, endDate, currentBranch);
      set({ occupiedSlots: slots, occupiedSlotsLoading: false });
    } catch (error) {
      console.warn('Failed fetching occupied slots:', error);
      set({
        occupiedSlotsError: 'No se pudieron cargar los horarios ocupados',
        occupiedSlotsLoading: false,
      });
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
      formColor: '',
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
    if (get().branches.length > 0) return;
    try {
      const branches = await clientPortalUseCases.getPublicBranches();
      set({ branches });
      const currentBranchId = get().formBranchId;
      if (branches.length > 0 && !currentBranchId) {
        const firstBranch = branches[0];
        const firstBranchId = firstBranch.id || firstBranch._id || '';
        set({ formBranchId: firstBranchId, formBranchName: firstBranch.name });
      }
    } catch (e) {
      console.error('Error fetching public branches:', e);
    }
  }
}));

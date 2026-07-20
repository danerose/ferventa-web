import { create } from 'zustand';
import type { Appointment, MaintenanceTrack, OccupiedSlots } from '../../domain/entities/ClientPortalEntities';
import { APIClientPortalRepository } from '../../data/repositories/APIClientPortalRepository';
import { BookAppointmentUseCase } from '../../domain/usecases/BookAppointmentUseCase';
import { GetAppointmentStatusUseCase } from '../../domain/usecases/GetAppointmentStatusUseCase';
import { GetMaintenanceTrackUseCase } from '../../domain/usecases/GetMaintenanceTrackUseCase';
import { GetOccupiedSlotsUseCase } from '../../domain/usecases/GetOccupiedSlotsUseCase';

const repository = new APIClientPortalRepository();
const bookAppointmentUseCase = new BookAppointmentUseCase(repository);
const getAppointmentStatusUseCase = new GetAppointmentStatusUseCase(repository);
const getMaintenanceTrackUseCase = new GetMaintenanceTrackUseCase(repository);
const getOccupiedSlotsUseCase = new GetOccupiedSlotsUseCase(repository);

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
  branches: any[];

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
  formServiceRequested: 'Mantenimiento Preventivo',
  formSelectedDate: '',
  formSelectedTime: '',
  formNotes: '',
  formBranchName: '',
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
    set((state) => {
      const newState = { ...state, [field]: value };
      if (field === 'formBranchId') {
        const branch = state.branches.find(b => b._id === value || b.id === value);
        if (branch) {
          newState.formBranchName = branch.name;
        }
        localStorage.setItem('ferventa_public_branch', value);
      }
      return newState;
    });
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
    if (!formCustomerPhone.trim() || formCustomerPhone.length < 10) {
      set({ bookingLoading: false, formValidationError: 'El teléfono es requerido (mínimo 10 dígitos).' });
      return;
    }
    if (!formSerialNumberLastFour.trim() || formSerialNumberLastFour.trim().length !== 4 || isNaN(Number(formSerialNumberLastFour))) {
      set({ bookingLoading: false, formValidationError: 'Se requieren los últimos 4 números del número de serie (exactamente 4 números).' });
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

      await bookAppointmentUseCase.execute({
        customerName: formCustomerName.trim(),
        customerPhone: formCustomerPhone.trim(),
        customerEmail: formCustomerEmail.trim(),
        vehicle: {
          brand: formBrand.trim() || 'Genérica',
          model: formModel.trim() || 'Generico',
          year: formYear.trim() === '' ? 1900 : (parseInt(formYear) || 0),
          serialNumberLastFour: formSerialNumberLastFour.trim(),
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
        getAppointmentStatusUseCase.execute(query).catch((err) => {
          console.warn('Failed querying appointments status:', err);
          return [] as Appointment[];
        }),
        getMaintenanceTrackUseCase.execute(query).catch((err) => {
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
      const occupiedSlots = await getOccupiedSlotsUseCase.execute(startDate, endDate);
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
      formServiceRequested: 'Mantenimiento Preventivo',
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
      const branches = await repository.getPublicBranches();
      set({ branches });
      const currentBranchId = get().formBranchId;
      if (branches.length > 0 && !currentBranchId) {
        const firstBranchId = branches[0]._id || branches[0].id;
        set({ formBranchId: firstBranchId, formBranchName: branches[0].name });
        localStorage.setItem('ferventa_public_branch', firstBranchId);
      }
    } catch (e) {
      console.error('Error fetching public branches:', e);
    }
  }
}));

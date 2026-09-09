import { NetworkService } from '@/core/services';
import { API_ENDPOINTS } from '@/core/constants';
import { AppointmentModel, type RawAppointmentResponse } from '@/app/data/model/Appointment/AppointmentModel';
import type {
  Appointment,
  AppointmentsFilter,
  DirectReceptionPayload,
  CheckInResult,
} from '@/app/domain/entities';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class AppointmentRemoteDataSource {
  private readonly network: NetworkService;

  constructor(network: NetworkService) {
    this.network = network;
  }

  async getAppointments(filter: AppointmentsFilter = {}): Promise<AppointmentModel[]> {
    const params: Record<string, string | undefined> = {};
    if (filter.status && filter.status !== 'all') params.status = filter.status;
    if (filter.search) params.search = filter.search;
    if (filter.fromDate) params.fromDate = filter.fromDate;
    if (filter.toDate) params.toDate = filter.toDate;
    if (filter.branchId && filter.branchId !== 'all') params.branchId = filter.branchId;

    const res = await this.network.get<ApiResponse<RawAppointmentResponse[]>>(
      API_ENDPOINTS.APPOINTMENTS.BASE,
      { params }
    );
    return (res.data || []).map((item) => AppointmentModel.fromJson(item));
  }

  async getAppointmentsTimeline(startDate: string, endDate?: string): Promise<AppointmentModel[]> {
    const params: Record<string, string> = { startDate };
    if (endDate) params.endDate = endDate;
    const res = await this.network.get<ApiResponse<RawAppointmentResponse[]>>(
      API_ENDPOINTS.APPOINTMENTS.TIMELINE,
      { params }
    );
    return (res.data || []).map((item) => AppointmentModel.fromJson(item));
  }

  async getAppointmentById(id: string): Promise<AppointmentModel> {
    const res = await this.network.get<ApiResponse<RawAppointmentResponse>>(
      API_ENDPOINTS.APPOINTMENTS.BY_ID(id)
    );
    return AppointmentModel.fromJson(res.data);
  }

  async createAppointment(payload: Partial<Appointment>): Promise<AppointmentModel> {
    const body: Record<string, unknown> = {};
    if (payload.customerName) body.customerName = payload.customerName;
    if (payload.customerPhone) body.customerPhone = payload.customerPhone;
    if (payload.customerEmail) body.customerEmail = payload.customerEmail;
    if (payload.customerId) body.customerId = payload.customerId;
    if (payload.serviceRequested) body.serviceRequested = payload.serviceRequested;
    if (payload.scheduledAt) body.scheduledAt = payload.scheduledAt;
    if (payload.status) body.status = payload.status;
    if (payload.notes) body.notes = payload.notes;
    if (payload.duration !== undefined) body.duration = payload.duration;
    if (payload.assignedMechanic) body.assignedMechanic = payload.assignedMechanic;
    if (payload.branchName) body.branchName = payload.branchName;
    if (payload.vehicle) {
      body.vehicle = {
        brand: payload.vehicle.brand,
        model: payload.vehicle.model,
        year: Number(payload.vehicle.year) || new Date().getFullYear(),
        serialNumberLastFour: payload.vehicle.serialNumberLastFour,
        ...(payload.vehicle.color ? { color: payload.vehicle.color } : {}),
      };
    }

    const res = await this.network.post<ApiResponse<RawAppointmentResponse>>(
      API_ENDPOINTS.APPOINTMENTS.BASE,
      body
    );
    return AppointmentModel.fromJson(res.data);
  }

  async updateAppointment(id: string, payload: Partial<Appointment>): Promise<AppointmentModel> {
    const body: Record<string, unknown> = {};
    if (payload.customerName !== undefined) body.customerName = payload.customerName;
    if (payload.customerPhone !== undefined) body.customerPhone = payload.customerPhone;
    if (payload.customerEmail !== undefined) body.customerEmail = payload.customerEmail;
    if (payload.customerId !== undefined) body.customerId = payload.customerId;
    if (payload.serviceRequested !== undefined) body.serviceRequested = payload.serviceRequested;
    if (payload.scheduledAt !== undefined) body.scheduledAt = payload.scheduledAt;
    if (payload.status !== undefined) body.status = payload.status;
    if (payload.notes !== undefined) body.notes = payload.notes;
    if (payload.duration !== undefined) body.duration = payload.duration;
    if (payload.assignedMechanic !== undefined) body.assignedMechanic = payload.assignedMechanic;
    if (payload.branchName !== undefined) body.branchName = payload.branchName;
    if (payload.vehicle !== undefined) {
      body.vehicle = payload.vehicle ? {
        brand: payload.vehicle.brand,
        model: payload.vehicle.model,
        year: Number(payload.vehicle.year) || new Date().getFullYear(),
        serialNumberLastFour: payload.vehicle.serialNumberLastFour,
        ...(payload.vehicle.color ? { color: payload.vehicle.color } : {}),
      } : null;
    }

    const res = await this.network.patch<ApiResponse<RawAppointmentResponse>>(
      API_ENDPOINTS.APPOINTMENTS.BY_ID(id),
      body
    );
    return AppointmentModel.fromJson(res.data);
  }

  async deleteAppointment(id: string): Promise<void> {
    await this.network.delete<ApiResponse<null>>(API_ENDPOINTS.APPOINTMENTS.BY_ID(id));
  }

  async approveAppointment(id: string, notes?: string): Promise<AppointmentModel> {
    const res = await this.network.patch<ApiResponse<RawAppointmentResponse>>(
      API_ENDPOINTS.APPOINTMENTS.APPROVE(id),
      { message: notes || '' }
    );
    return AppointmentModel.fromJson(res.data);
  }

  async rejectAppointment(id: string, notes?: string): Promise<AppointmentModel> {
    const res = await this.network.patch<ApiResponse<RawAppointmentResponse>>(
      API_ENDPOINTS.APPOINTMENTS.REJECT(id),
      { message: notes || '' }
    );
    return AppointmentModel.fromJson(res.data);
  }

  async rescheduleAppointment(
    id: string,
    newDate: string,
    duration?: number,
    notes?: string
  ): Promise<AppointmentModel> {
    const body: Record<string, unknown> = { scheduledAt: newDate };
    if (duration !== undefined && duration > 0) body.duration = duration;
    if (notes) body.message = notes;

    const res = await this.network.patch<ApiResponse<RawAppointmentResponse>>(
      API_ENDPOINTS.APPOINTMENTS.RESCHEDULE(id),
      body
    );
    return AppointmentModel.fromJson(res.data);
  }

  async checkInAppointment(id: string, notes?: string): Promise<CheckInResult> {
    const res = await this.network.patch<ApiResponse<{ appointment: RawAppointmentResponse; maintenanceOrderId?: string }>>(
      API_ENDPOINTS.APPOINTMENTS.CHECK_IN(id),
      { receptionNotes: notes || '' }
    );
    if (!res?.data?.appointment) {
      throw new Error(res?.message || 'Error al realizar el check-in: respuesta incompleta del servidor');
    }
    return {
      appointment: AppointmentModel.fromJson(res.data.appointment).toEntity(),
      maintenanceOrderId: res.data.maintenanceOrderId,
    };
  }

  async markNoShow(id: string, notes?: string): Promise<AppointmentModel> {
    const body: Record<string, unknown> = {};
    if (notes) body.notes = notes;

    const res = await this.network.patch<ApiResponse<RawAppointmentResponse>>(
      API_ENDPOINTS.APPOINTMENTS.NO_SHOW(id),
      body
    );
    return AppointmentModel.fromJson(res.data);
  }

  async directReception(payload: DirectReceptionPayload): Promise<CheckInResult> {
    const body: Record<string, unknown> = {
      customerName: payload.customerName,
      serviceRequested: payload.serviceRequested,
    };
    if (payload.customerPhone) body.customerPhone = payload.customerPhone;
    if (payload.customerEmail) body.customerEmail = payload.customerEmail;
    if (payload.customerId) body.customerId = payload.customerId;
    if (payload.vehicleId) body.vehicleId = payload.vehicleId;
    if (payload.whatsappId) body.whatsappId = payload.whatsappId;
    if (payload.notes || payload.receptionNotes) body.notes = payload.notes || payload.receptionNotes;
    if (payload.laborCost !== undefined) body.laborCost = payload.laborCost;
    if (payload.assignedMechanic) body.assignedMechanic = payload.assignedMechanic;
    if (payload.vehicle) {
      body.vehicle = {
        brand: payload.vehicle.brand,
        model: payload.vehicle.model,
        year: Number(payload.vehicle.year) || new Date().getFullYear(),
        serialNumberLastFour: payload.vehicle.serialNumberLastFour,
        ...(payload.vehicle.color ? { color: payload.vehicle.color } : {}),
      };
    }

    const res = await this.network.post<ApiResponse<{ appointment?: RawAppointmentResponse; maintenanceOrderId?: string; _id?: string }>>(
      API_ENDPOINTS.MAINTENANCE.DIRECT_RECEPTION,
      body
    );
    const appt = res.data?.appointment
      ? AppointmentModel.fromJson(res.data.appointment).toEntity()
      : ({ id: res.data?.maintenanceOrderId || res.data?._id || '', status: 'approved' } as Appointment);

    return {
      appointment: appt,
      maintenanceOrderId: res.data?.maintenanceOrderId || res.data?._id,
    };
  }
}

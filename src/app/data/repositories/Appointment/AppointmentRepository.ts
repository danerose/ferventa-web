import type { IAppointmentRepository } from '@/app/domain/repository/Appointment/IAppointmentRepository';
import type {
  Appointment,
  AppointmentsFilter,
  DirectReceptionPayload,
  CheckInResult,
} from '@/app/domain/entities';
import type { AppointmentRemoteDataSource } from '@/app/data/datasources/remote/Appointment/AppointmentRemoteDataSource';

export class AppointmentRepository implements IAppointmentRepository {
  private readonly remote: AppointmentRemoteDataSource;

  constructor(remote: AppointmentRemoteDataSource) {
    this.remote = remote;
  }

  async getAppointments(filter: AppointmentsFilter = {}): Promise<Appointment[]> {
    const models = await this.remote.getAppointments(filter);
    return models.map((m) => m.toEntity());
  }

  async getAppointmentsTimeline(startDate: string, endDate?: string): Promise<Appointment[]> {
    const models = await this.remote.getAppointmentsTimeline(startDate, endDate);
    return models.map((m) => m.toEntity());
  }

  async getAppointmentById(id: string): Promise<Appointment> {
    const model = await this.remote.getAppointmentById(id);
    return model.toEntity();
  }

  async createAppointment(payload: Partial<Appointment>): Promise<Appointment> {
    const model = await this.remote.createAppointment(payload);
    return model.toEntity();
  }

  async updateAppointment(id: string, payload: Partial<Appointment>): Promise<Appointment> {
    const model = await this.remote.updateAppointment(id, payload);
    return model.toEntity();
  }

  async deleteAppointment(id: string): Promise<void> {
    await this.remote.deleteAppointment(id);
  }

  async approveAppointment(id: string, notes?: string): Promise<Appointment> {
    const model = await this.remote.approveAppointment(id, notes);
    return model.toEntity();
  }

  async rejectAppointment(id: string, notes?: string): Promise<Appointment> {
    const model = await this.remote.rejectAppointment(id, notes);
    return model.toEntity();
  }

  async rescheduleAppointment(
    id: string,
    newDate: string,
    duration?: number,
    notes?: string
  ): Promise<Appointment> {
    const model = await this.remote.rescheduleAppointment(id, newDate, duration, notes);
    return model.toEntity();
  }

  async markNoShow(id: string, notes?: string): Promise<Appointment> {
    const model = await this.remote.markNoShow(id, notes);
    return model.toEntity();
  }

  async checkInAppointment(id: string, notes?: string): Promise<CheckInResult> {
    try {
      return await this.remote.checkInAppointment(id, notes);
    } catch (error) {
      console.error(`[AppointmentRepository.checkInAppointment] Error for appointment ${id}:`, error);
      throw error instanceof Error ? error : new Error('Error al registrar la recepción de la cita');
    }
  }

  async directReception(payload: DirectReceptionPayload): Promise<CheckInResult> {
    try {
      return await this.remote.directReception(payload);
    } catch (error) {
      console.error('[AppointmentRepository.directReception] Error during direct reception:', error);
      throw error instanceof Error ? error : new Error('Error al realizar la recepción directa');
    }
  }
}

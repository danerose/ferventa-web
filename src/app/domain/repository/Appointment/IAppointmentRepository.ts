import type {
  Appointment,
  AppointmentsFilter,
  DirectReceptionPayload,
  CheckInResult,
} from '@/app/domain/entities';

export interface IAppointmentRepository {
  getAppointments(filter?: AppointmentsFilter): Promise<Appointment[]>;
  getAppointmentsTimeline(startDate: string, endDate?: string): Promise<Appointment[]>;
  getAppointmentById(id: string): Promise<Appointment>;
  createAppointment(payload: Partial<Appointment>): Promise<Appointment>;
  updateAppointment(id: string, payload: Partial<Appointment>): Promise<Appointment>;
  deleteAppointment(id: string): Promise<void>;
  approveAppointment(id: string, notes?: string): Promise<Appointment>;
  rejectAppointment(id: string, notes?: string): Promise<Appointment>;
  rescheduleAppointment(id: string, newDate: string, duration?: number, notes?: string): Promise<Appointment>;
  markNoShow(id: string, notes?: string): Promise<Appointment>;
  checkInAppointment(id: string, notes?: string): Promise<CheckInResult>;
  directReception(payload: DirectReceptionPayload): Promise<CheckInResult>;
}

import type { Appointment, MaintenanceTrack, OccupiedSlots } from '../entities/ClientPortalEntities';

export interface ClientPortalRepository {
  bookAppointment(appointment: Appointment): Promise<Appointment>;
  getAppointmentStatus(query: string): Promise<Appointment[]>;
  getMaintenanceTrack(query: string): Promise<MaintenanceTrack | null>;
  getOccupiedSlots(startDate: string, endDate: string): Promise<OccupiedSlots>;
}

import type { MaintenanceTrack, OccupiedSlots, PublicBranch, BookAppointmentPayload } from '../../entities/ClientPortal/ClientPortalEntities';
import type { Appointment } from '../../entities/Appointment/Appointment';


export interface IClientPortalRepository {
  bookAppointment(appointment: BookAppointmentPayload): Promise<Appointment>;
  getAppointmentStatus(query: string): Promise<Appointment[]>;
  getMaintenanceTrack(query: string): Promise<MaintenanceTrack | null>;
  getOccupiedSlots(startDate: string, endDate: string): Promise<OccupiedSlots>;
  getPublicBranches(): Promise<PublicBranch[]>;
}

// Aliased for backward compatibility
export type ClientPortalRepository = IClientPortalRepository;

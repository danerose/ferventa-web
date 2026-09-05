import type { Appointment, MaintenanceTrack, OccupiedSlots, PublicBranch } from '../../entities/ClientPortal/ClientPortalEntities';

export interface IClientPortalRepository {
  bookAppointment(appointment: Appointment): Promise<Appointment>;
  getAppointmentStatus(query: string): Promise<Appointment[]>;
  getMaintenanceTrack(query: string): Promise<MaintenanceTrack | null>;
  getOccupiedSlots(startDate: string, endDate: string): Promise<OccupiedSlots>;
  getPublicBranches(): Promise<PublicBranch[]>;
}

// Aliased for backward compatibility
export type ClientPortalRepository = IClientPortalRepository;

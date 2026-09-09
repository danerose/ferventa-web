import type { PublicBranch } from '../../entities/ClientPortal/ClientPortalEntities';
import type { IClientPortalRepository } from '../../repository/ClientPortal/IClientPortalRepository';
import { BookAppointmentUseCase } from './BookAppointmentUseCase';
import { GetAppointmentStatusUseCase } from './GetAppointmentStatusUseCase';
import { GetMaintenanceTrackUseCase } from './GetMaintenanceTrackUseCase';
import { GetOccupiedSlotsUseCase } from './GetOccupiedSlotsUseCase';

export {
  BookAppointmentUseCase,
  GetAppointmentStatusUseCase,
  GetMaintenanceTrackUseCase,
  GetOccupiedSlotsUseCase,
};

export class ClientPortalUseCases {
  private readonly repository: IClientPortalRepository;
  public readonly bookAppointment: BookAppointmentUseCase;
  public readonly getAppointmentStatus: GetAppointmentStatusUseCase;
  public readonly getMaintenanceTrack: GetMaintenanceTrackUseCase;
  public readonly getOccupiedSlots: GetOccupiedSlotsUseCase;

  constructor(repository: IClientPortalRepository) {
    this.repository = repository;
    this.bookAppointment = new BookAppointmentUseCase(repository);
    this.getAppointmentStatus = new GetAppointmentStatusUseCase(repository);
    this.getMaintenanceTrack = new GetMaintenanceTrackUseCase(repository);
    this.getOccupiedSlots = new GetOccupiedSlotsUseCase(repository);
  }

  getPublicBranches(): Promise<PublicBranch[]> {
    return this.repository.getPublicBranches();
  }
}

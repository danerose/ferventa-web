import type { Appointment, MaintenanceTrack, OccupiedSlots, PublicBranch } from '../../entities/ClientPortal/ClientPortalEntities';
import type { IClientPortalRepository } from '../../repository/ClientPortal/IClientPortalRepository';

export class BookAppointmentUseCase {
  private readonly clientPortalRepository: IClientPortalRepository;

  constructor(clientPortalRepository: IClientPortalRepository) {
    this.clientPortalRepository = clientPortalRepository;
  }

  async execute(appointment: Appointment): Promise<Appointment> {
    if (!appointment.customerName.trim()) {
      throw new Error('El nombre del cliente es requerido');
    }
    if (!appointment.customerPhone.trim()) {
      throw new Error('El teléfono del cliente es requerido');
    }
    if (!appointment.vehicle.serialNumberLastFour.trim() || appointment.vehicle.serialNumberLastFour.trim().length !== 4) {
      throw new Error('Los últimos 4 números del número de serie son requeridos (exactamente 4 dígitos)');
    }
    if (!appointment.scheduledAt) {
      throw new Error('La fecha y hora de la cita es requerida');
    }

    return this.clientPortalRepository.bookAppointment(appointment);
  }
}

export class GetAppointmentStatusUseCase {
  private readonly clientPortalRepository: IClientPortalRepository;

  constructor(clientPortalRepository: IClientPortalRepository) {
    this.clientPortalRepository = clientPortalRepository;
  }

  async execute(query: string): Promise<Appointment[]> {
    if (!query || !query.trim()) {
      throw new Error('La consulta de búsqueda es requerida');
    }
    return this.clientPortalRepository.getAppointmentStatus(query.trim());
  }
}

export class GetMaintenanceTrackUseCase {
  private readonly clientPortalRepository: IClientPortalRepository;

  constructor(clientPortalRepository: IClientPortalRepository) {
    this.clientPortalRepository = clientPortalRepository;
  }

  async execute(query: string): Promise<MaintenanceTrack | null> {
    if (!query || !query.trim()) {
      throw new Error('La consulta de búsqueda es requerida');
    }
    return this.clientPortalRepository.getMaintenanceTrack(query.trim());
  }
}

export class GetOccupiedSlotsUseCase {
  private readonly clientPortalRepository: IClientPortalRepository;

  constructor(clientPortalRepository: IClientPortalRepository) {
    this.clientPortalRepository = clientPortalRepository;
  }

  async execute(startDate: string, endDate: string): Promise<OccupiedSlots> {
    if (!startDate || !endDate) {
      throw new Error('Las fechas de inicio y fin son requeridas');
    }
    return this.clientPortalRepository.getOccupiedSlots(startDate, endDate);
  }
}

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

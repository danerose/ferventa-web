import type { IClientPortalRepository } from '@/app/domain/repository/ClientPortal/IClientPortalRepository';
import type { Appointment } from '@/app/domain/entities';

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

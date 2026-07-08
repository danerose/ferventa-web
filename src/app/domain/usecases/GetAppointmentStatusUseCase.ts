import type { Appointment } from '../entities/ClientPortalEntities';
import type { ClientPortalRepository } from '../repositories/ClientPortalRepository';

export class GetAppointmentStatusUseCase {
  private clientPortalRepository: ClientPortalRepository;

  constructor(clientPortalRepository: ClientPortalRepository) {
    this.clientPortalRepository = clientPortalRepository;
  }

  async execute(query: string): Promise<Appointment[]> {
    if (!query || !query.trim()) {
      throw new Error('La consulta de búsqueda es requerida');
    }
    return this.clientPortalRepository.getAppointmentStatus(query.trim());
  }
}

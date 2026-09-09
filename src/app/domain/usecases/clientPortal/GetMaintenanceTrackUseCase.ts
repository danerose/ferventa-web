import type { IClientPortalRepository } from '@/app/domain/repository/ClientPortal/IClientPortalRepository';
import type { MaintenanceTrack } from '@/app/domain/entities';

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

import type { MaintenanceTrack } from '@/app/domain';
import type { ClientPortalRepository } from '@/app/domain';

export class GetMaintenanceTrackUseCase {
  private clientPortalRepository: ClientPortalRepository;

  constructor(clientPortalRepository: ClientPortalRepository) {
    this.clientPortalRepository = clientPortalRepository;
  }

  async execute(query: string): Promise<MaintenanceTrack | null> {
    if (!query || !query.trim()) {
      throw new Error('La consulta de búsqueda es requerida');
    }
    return this.clientPortalRepository.getMaintenanceTrack(query.trim());
  }
}

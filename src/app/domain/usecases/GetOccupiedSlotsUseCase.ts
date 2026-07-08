import type { OccupiedSlots } from '../entities/ClientPortalEntities';
import type { ClientPortalRepository } from '../repositories/ClientPortalRepository';

export class GetOccupiedSlotsUseCase {
  private clientPortalRepository: ClientPortalRepository;

  constructor(clientPortalRepository: ClientPortalRepository) {
    this.clientPortalRepository = clientPortalRepository;
  }

  async execute(startDate: string, endDate: string): Promise<OccupiedSlots> {
    if (!startDate || !endDate) {
      throw new Error('Las fechas de inicio y fin son requeridas');
    }
    return this.clientPortalRepository.getOccupiedSlots(startDate, endDate);
  }
}

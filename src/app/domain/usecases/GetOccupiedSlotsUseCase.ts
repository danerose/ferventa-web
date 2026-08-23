import type { OccupiedSlots } from '@/app/domain';
import type { ClientPortalRepository } from '@/app/domain';

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

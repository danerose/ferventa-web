import type { IClientPortalRepository } from '@/app/domain/repository/ClientPortal/IClientPortalRepository';
import type { OccupiedSlots } from '@/app/domain/entities';

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

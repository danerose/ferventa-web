import type { IMaintenanceRepository } from '@/app/domain/repository/Maintenance/IMaintenanceRepository';
import type { MaintenanceOrder, DirectReceptionPayload } from '@/app/domain/entities';

export class DirectReceptionMaintenanceUseCase {
  private readonly maintenanceRepository: IMaintenanceRepository;

  constructor(maintenanceRepository: IMaintenanceRepository) {
    this.maintenanceRepository = maintenanceRepository;
  }

  execute(payload: DirectReceptionPayload): Promise<MaintenanceOrder> {
    return this.maintenanceRepository.directReception(payload);
  }
}

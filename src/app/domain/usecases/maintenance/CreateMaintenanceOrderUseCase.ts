import type { IMaintenanceRepository } from '@/app/domain/repository/Maintenance/IMaintenanceRepository';
import type { MaintenanceOrder } from '@/app/domain/entities';

export class CreateMaintenanceOrderUseCase {
  private readonly maintenanceRepository: IMaintenanceRepository;

  constructor(maintenanceRepository: IMaintenanceRepository) {
    this.maintenanceRepository = maintenanceRepository;
  }

  execute(payload: Partial<MaintenanceOrder>): Promise<MaintenanceOrder> {
    return this.maintenanceRepository.createMaintenanceOrder(payload);
  }
}

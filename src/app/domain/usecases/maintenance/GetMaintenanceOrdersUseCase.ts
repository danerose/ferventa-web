import type { IMaintenanceRepository } from '@/app/domain/repository/Maintenance/IMaintenanceRepository';
import type { MaintenanceOrder, MaintenanceFilterParams } from '@/app/domain/entities';

export class GetMaintenanceOrdersUseCase {
  private readonly maintenanceRepository: IMaintenanceRepository;

  constructor(maintenanceRepository: IMaintenanceRepository) {
    this.maintenanceRepository = maintenanceRepository;
  }

  execute(filter?: MaintenanceFilterParams): Promise<MaintenanceOrder[]> {
    return this.maintenanceRepository.getMaintenanceOrders(filter);
  }
}

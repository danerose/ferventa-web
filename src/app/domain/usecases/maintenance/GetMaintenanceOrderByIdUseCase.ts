import type { IMaintenanceRepository } from '@/app/domain/repository/Maintenance/IMaintenanceRepository';
import type { MaintenanceOrder } from '@/app/domain/entities';

export class GetMaintenanceOrderByIdUseCase {
  private readonly maintenanceRepository: IMaintenanceRepository;

  constructor(maintenanceRepository: IMaintenanceRepository) {
    this.maintenanceRepository = maintenanceRepository;
  }

  execute(id: string): Promise<MaintenanceOrder> {
    if (!id || !id.trim()) {
      throw new Error('El ID de la orden de mantenimiento es requerido');
    }
    return this.maintenanceRepository.getMaintenanceOrderById(id.trim());
  }
}

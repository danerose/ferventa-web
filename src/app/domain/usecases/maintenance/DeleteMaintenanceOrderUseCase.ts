import type { IMaintenanceRepository } from '@/app/domain/repository/Maintenance/IMaintenanceRepository';

export class DeleteMaintenanceOrderUseCase {
  private readonly maintenanceRepository: IMaintenanceRepository;

  constructor(maintenanceRepository: IMaintenanceRepository) {
    this.maintenanceRepository = maintenanceRepository;
  }

  execute(id: string): Promise<void> {
    if (!id || !id.trim()) {
      throw new Error('El ID de la orden de mantenimiento es requerido');
    }
    return this.maintenanceRepository.deleteMaintenanceOrder(id.trim());
  }
}

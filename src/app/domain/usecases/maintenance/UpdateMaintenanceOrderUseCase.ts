import type { IMaintenanceRepository } from '@/app/domain/repository/Maintenance/IMaintenanceRepository';
import type { MaintenanceOrder, UpdateMaintenancePayload } from '@/app/domain/entities';

export class UpdateMaintenanceOrderUseCase {
  private readonly maintenanceRepository: IMaintenanceRepository;

  constructor(maintenanceRepository: IMaintenanceRepository) {
    this.maintenanceRepository = maintenanceRepository;
  }

  execute(id: string, payload: UpdateMaintenancePayload): Promise<MaintenanceOrder> {
    if (!id || !id.trim()) {
      throw new Error('El ID de la orden de mantenimiento es requerido');
    }
    return this.maintenanceRepository.updateMaintenanceOrder(id.trim(), payload);
  }
}

import type { IMaintenanceRepository } from '@/app/domain/repository/Maintenance/IMaintenanceRepository';
import type { MaintenanceOrder } from '@/app/domain/entities';

export class UpdateMaintenanceStatusUseCase {
  private readonly maintenanceRepository: IMaintenanceRepository;

  constructor(maintenanceRepository: IMaintenanceRepository) {
    this.maintenanceRepository = maintenanceRepository;
  }

  execute(id: string, status: string, notes?: string): Promise<MaintenanceOrder> {
    if (!id || !id.trim()) {
      throw new Error('El ID de la orden de mantenimiento es requerido');
    }
    if (!status || !status.trim()) {
      throw new Error('El estado es requerido');
    }
    return this.maintenanceRepository.updateMaintenanceStatus(id.trim(), status.trim(), notes);
  }
}

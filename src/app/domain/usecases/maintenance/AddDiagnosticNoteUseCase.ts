import type { IMaintenanceRepository } from '@/app/domain/repository/Maintenance/IMaintenanceRepository';
import type { MaintenanceOrder } from '@/app/domain/entities';

export class AddDiagnosticNoteUseCase {
  private readonly maintenanceRepository: IMaintenanceRepository;

  constructor(maintenanceRepository: IMaintenanceRepository) {
    this.maintenanceRepository = maintenanceRepository;
  }

  execute(id: string, note: string): Promise<MaintenanceOrder> {
    if (!id || !id.trim()) {
      throw new Error('El ID de la orden de mantenimiento es requerido');
    }
    if (!note || !note.trim()) {
      throw new Error('La nota de diagnóstico es requerida');
    }
    return this.maintenanceRepository.addDiagnosticNote(id.trim(), note.trim());
  }
}

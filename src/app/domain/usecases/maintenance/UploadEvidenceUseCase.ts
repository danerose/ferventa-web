import type { IMaintenanceRepository } from '@/app/domain/repository/Maintenance/IMaintenanceRepository';

export class UploadEvidenceUseCase {
  private readonly maintenanceRepository: IMaintenanceRepository;

  constructor(maintenanceRepository: IMaintenanceRepository) {
    this.maintenanceRepository = maintenanceRepository;
  }

  execute(orderId: string, stage: string, files: File[]): Promise<boolean> {
    if (!orderId || !orderId.trim()) {
      throw new Error('El ID de la orden de mantenimiento es requerido');
    }
    return this.maintenanceRepository.uploadEvidence(orderId.trim(), stage, files);
  }
}

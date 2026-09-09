import type { IMaintenanceRepository } from '@/app/domain/repository/Maintenance/IMaintenanceRepository';
import type {
  MaintenanceOrder,
  UpdateMaintenancePayload,
  MaintenanceFilterParams,
  DirectReceptionPayload,
} from '@/app/domain/entities';
import type { MaintenanceRemoteDataSource } from '@/app/data/datasources/remote/Maintenance/MaintenanceRemoteDataSource';

export class MaintenanceRepository implements IMaintenanceRepository {
  private readonly remote: MaintenanceRemoteDataSource;

  constructor(remote: MaintenanceRemoteDataSource) {
    this.remote = remote;
  }

  getMaintenanceOrders(filter?: MaintenanceFilterParams): Promise<MaintenanceOrder[]> {
    return this.remote.getMaintenanceOrders(filter);
  }

  getMaintenanceOrderById(id: string): Promise<MaintenanceOrder> {
    return this.remote.getMaintenanceOrderById(id);
  }

  createMaintenanceOrder(payload: Partial<MaintenanceOrder>): Promise<MaintenanceOrder> {
    return this.remote.createMaintenanceOrder(payload);
  }

  updateMaintenanceOrder(id: string, payload: UpdateMaintenancePayload): Promise<MaintenanceOrder> {
    return this.remote.updateMaintenanceOrder(id, payload);
  }

  deleteMaintenanceOrder(id: string): Promise<void> {
    return this.remote.deleteMaintenanceOrder(id);
  }

  updateMaintenanceStatus(id: string, status: string, notes?: string): Promise<MaintenanceOrder> {
    return this.remote.updateMaintenanceStatus(id, status, notes);
  }

  addDiagnosticNote(id: string, note: string): Promise<MaintenanceOrder> {
    return this.remote.addDiagnosticNote(id, note);
  }

  notifyMaintenance(id: string, notes?: string): Promise<MaintenanceOrder> {
    return this.remote.notifyMaintenance(id, notes);
  }

  linkMaintenanceSale(id: string, payload: { saleId?: string; folio?: string }): Promise<MaintenanceOrder> {
    return this.remote.linkMaintenanceSale(id, payload);
  }

  unlinkMaintenanceSale(id: string): Promise<MaintenanceOrder> {
    return this.remote.unlinkMaintenanceSale(id);
  }

  uploadEvidence(orderId: string, stage: string, files: File[]): Promise<boolean> {
    return this.remote.uploadEvidence(orderId, stage, files);
  }

  directReception(payload: DirectReceptionPayload): Promise<MaintenanceOrder> {
    return this.remote.directReception(payload);
  }

  getOrderPdfBlob(id: string): Promise<Blob> {
    return this.remote.getOrderPdfBlob(id);
  }
}


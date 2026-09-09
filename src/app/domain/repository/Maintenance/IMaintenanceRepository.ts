import type {
  MaintenanceOrder,
  UpdateMaintenancePayload,
  MaintenanceFilterParams,
  DirectReceptionPayload,
} from '@/app/domain/entities';

export interface IMaintenanceRepository {
  getMaintenanceOrders(filter?: MaintenanceFilterParams): Promise<MaintenanceOrder[]>;
  getMaintenanceOrderById(id: string): Promise<MaintenanceOrder>;
  createMaintenanceOrder(payload: Partial<MaintenanceOrder>): Promise<MaintenanceOrder>;
  updateMaintenanceOrder(id: string, payload: UpdateMaintenancePayload): Promise<MaintenanceOrder>;
  deleteMaintenanceOrder(id: string): Promise<void>;
  updateMaintenanceStatus(id: string, status: string, notes?: string): Promise<MaintenanceOrder>;
  addDiagnosticNote(id: string, note: string): Promise<MaintenanceOrder>;
  notifyMaintenance(id: string, notes?: string): Promise<MaintenanceOrder>;
  linkMaintenanceSale(id: string, payload: { saleId?: string; folio?: string }): Promise<MaintenanceOrder>;
  unlinkMaintenanceSale(id: string): Promise<MaintenanceOrder>;
  uploadEvidence(orderId: string, stage: string, files: File[]): Promise<boolean>;
  directReception(payload: DirectReceptionPayload): Promise<MaintenanceOrder>;
  getOrderPdfBlob(id: string): Promise<Blob>;
}


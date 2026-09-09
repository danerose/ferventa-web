import type { IMaintenanceRepository } from '@/app/domain/repository/Maintenance/IMaintenanceRepository';
import type {
  MaintenanceOrder,
  UpdateMaintenancePayload,
  MaintenanceFilterParams,
  DirectReceptionPayload,
} from '@/app/domain/entities';
import { GetMaintenanceOrdersUseCase } from './GetMaintenanceOrdersUseCase';
import { GetMaintenanceOrderByIdUseCase } from './GetMaintenanceOrderByIdUseCase';
import { CreateMaintenanceOrderUseCase } from './CreateMaintenanceOrderUseCase';
import { UpdateMaintenanceOrderUseCase } from './UpdateMaintenanceOrderUseCase';
import { DeleteMaintenanceOrderUseCase } from './DeleteMaintenanceOrderUseCase';
import { UpdateMaintenanceStatusUseCase } from './UpdateMaintenanceStatusUseCase';
import { AddDiagnosticNoteUseCase } from './AddDiagnosticNoteUseCase';
import { NotifyMaintenanceUseCase } from './NotifyMaintenanceUseCase';
import { LinkMaintenanceSaleUseCase } from './LinkMaintenanceSaleUseCase';
import { UnlinkMaintenanceSaleUseCase } from './UnlinkMaintenanceSaleUseCase';
import { UploadEvidenceUseCase } from './UploadEvidenceUseCase';
import { DirectReceptionMaintenanceUseCase } from './DirectReceptionMaintenanceUseCase';
import { GetOrderPdfBlobUseCase } from './GetOrderPdfBlobUseCase';

/**
 * Composite Facade for Maintenance UseCases.
 * Provides backwards-compatibility while delegating all execution
 * to single-responsibility UseCase instances.
 */
export class MaintenanceUseCases {
  public readonly getMaintenanceOrdersUseCase: GetMaintenanceOrdersUseCase;
  public readonly getMaintenanceOrderByIdUseCase: GetMaintenanceOrderByIdUseCase;
  public readonly createMaintenanceOrderUseCase: CreateMaintenanceOrderUseCase;
  public readonly updateMaintenanceOrderUseCase: UpdateMaintenanceOrderUseCase;
  public readonly deleteMaintenanceOrderUseCase: DeleteMaintenanceOrderUseCase;
  public readonly updateMaintenanceStatusUseCase: UpdateMaintenanceStatusUseCase;
  public readonly addDiagnosticNoteUseCase: AddDiagnosticNoteUseCase;
  public readonly notifyMaintenanceUseCase: NotifyMaintenanceUseCase;
  public readonly linkMaintenanceSaleUseCase: LinkMaintenanceSaleUseCase;
  public readonly unlinkMaintenanceSaleUseCase: UnlinkMaintenanceSaleUseCase;
  public readonly uploadEvidenceUseCase: UploadEvidenceUseCase;
  public readonly directReceptionMaintenanceUseCase: DirectReceptionMaintenanceUseCase;
  public readonly getOrderPdfBlobUseCase: GetOrderPdfBlobUseCase;

  constructor(repository: IMaintenanceRepository) {
    this.getMaintenanceOrdersUseCase = new GetMaintenanceOrdersUseCase(repository);
    this.getMaintenanceOrderByIdUseCase = new GetMaintenanceOrderByIdUseCase(repository);
    this.createMaintenanceOrderUseCase = new CreateMaintenanceOrderUseCase(repository);
    this.updateMaintenanceOrderUseCase = new UpdateMaintenanceOrderUseCase(repository);
    this.deleteMaintenanceOrderUseCase = new DeleteMaintenanceOrderUseCase(repository);
    this.updateMaintenanceStatusUseCase = new UpdateMaintenanceStatusUseCase(repository);
    this.addDiagnosticNoteUseCase = new AddDiagnosticNoteUseCase(repository);
    this.notifyMaintenanceUseCase = new NotifyMaintenanceUseCase(repository);
    this.linkMaintenanceSaleUseCase = new LinkMaintenanceSaleUseCase(repository);
    this.unlinkMaintenanceSaleUseCase = new UnlinkMaintenanceSaleUseCase(repository);
    this.uploadEvidenceUseCase = new UploadEvidenceUseCase(repository);
    this.directReceptionMaintenanceUseCase = new DirectReceptionMaintenanceUseCase(repository);
    this.getOrderPdfBlobUseCase = new GetOrderPdfBlobUseCase(repository);
  }

  getMaintenanceOrders(filter?: MaintenanceFilterParams): Promise<MaintenanceOrder[]> {
    return this.getMaintenanceOrdersUseCase.execute(filter);
  }

  getMaintenanceOrderById(id: string): Promise<MaintenanceOrder> {
    return this.getMaintenanceOrderByIdUseCase.execute(id);
  }

  createMaintenanceOrder(payload: Partial<MaintenanceOrder>): Promise<MaintenanceOrder> {
    return this.createMaintenanceOrderUseCase.execute(payload);
  }

  updateMaintenanceOrder(id: string, payload: UpdateMaintenancePayload): Promise<MaintenanceOrder> {
    return this.updateMaintenanceOrderUseCase.execute(id, payload);
  }

  deleteMaintenanceOrder(id: string): Promise<void> {
    return this.deleteMaintenanceOrderUseCase.execute(id);
  }

  updateMaintenanceStatus(id: string, status: string, notes?: string): Promise<MaintenanceOrder> {
    return this.updateMaintenanceStatusUseCase.execute(id, status, notes);
  }

  addDiagnosticNote(id: string, note: string): Promise<MaintenanceOrder> {
    return this.addDiagnosticNoteUseCase.execute(id, note);
  }

  notifyMaintenance(id: string, notes?: string): Promise<MaintenanceOrder> {
    return this.notifyMaintenanceUseCase.execute(id, notes);
  }

  linkMaintenanceSale(id: string, payload: { saleId?: string; folio?: string }): Promise<MaintenanceOrder> {
    return this.linkMaintenanceSaleUseCase.execute(id, payload);
  }

  unlinkMaintenanceSale(id: string): Promise<MaintenanceOrder> {
    return this.unlinkMaintenanceSaleUseCase.execute(id);
  }

  uploadEvidence(orderId: string, stage: string, files: File[]): Promise<boolean> {
    return this.uploadEvidenceUseCase.execute(orderId, stage, files);
  }

  directReception(payload: DirectReceptionPayload): Promise<MaintenanceOrder> {
    return this.directReceptionMaintenanceUseCase.execute(payload);
  }

  getOrderPdfBlob(id: string): Promise<Blob> {
    return this.getOrderPdfBlobUseCase.execute(id);
  }
}

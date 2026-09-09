import { NetworkService } from '@/core/services';
import { API_ENDPOINTS } from '@/core/constants';
import {
  MaintenanceOrderModel,
  type RawMaintenanceOrderResponse,
} from '@/app/data/model/Maintenance/MaintenanceOrderModel';
import type {
  MaintenanceOrder,
  UpdateMaintenancePayload,
  MaintenanceFilterParams,
  DirectReceptionPayload,
} from '@/app/domain/entities';


interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export class MaintenanceRemoteDataSource {
  private readonly network: NetworkService;

  constructor(network: NetworkService) {
    this.network = network;
  }

  async getMaintenanceOrders(filter: MaintenanceFilterParams = {}): Promise<MaintenanceOrder[]> {
    const params: Record<string, string | undefined> = {};
    if (filter.customerId) params.customerId = filter.customerId;
    if (filter.scope) params.scope = filter.scope;
    if (filter.status && filter.status !== 'all') params.status = filter.status;
    if (filter.search) params.search = filter.search;
    if (filter.from) params.from = filter.from;
    if (filter.to) params.to = filter.to;
    if (filter.dateField) params.dateField = filter.dateField;

    const res = await this.network.get<ApiResponse<RawMaintenanceOrderResponse[]>>(
      API_ENDPOINTS.MAINTENANCE.BASE,
      { params }
    );
    return (res.data || []).map((item) => MaintenanceOrderModel.toEntity(item));
  }

  async getMaintenanceOrderById(id: string): Promise<MaintenanceOrder> {
    const res = await this.network.get<ApiResponse<RawMaintenanceOrderResponse>>(
      API_ENDPOINTS.MAINTENANCE.BY_ID(id)
    );
    return MaintenanceOrderModel.toEntity(res.data);
  }

  async createMaintenanceOrder(payload: Partial<MaintenanceOrder>): Promise<MaintenanceOrder> {
    const raw = payload as Record<string, unknown>;
    const body: Record<string, unknown> = {};
    const customerId = raw.customerId || payload.customer?.id || payload.customer?._id;
    if (customerId) body.customerId = customerId;
    const vehicleId = raw.vehicleId || payload.vehicle?.id || payload.vehicle?._id;
    if (vehicleId) body.vehicleId = vehicleId;
    const apptId = raw.appointmentId || payload.appointmentId || payload.appointment?.id;
    if (apptId) body.appointmentId = apptId;
    const cost = payload.laborCost ?? payload.laborPrice;
    if (cost !== undefined) body.laborCost = cost;
    if (payload.notes) body.notes = payload.notes;

    const res = await this.network.post<ApiResponse<RawMaintenanceOrderResponse>>(
      API_ENDPOINTS.MAINTENANCE.BASE,
      body
    );
    return MaintenanceOrderModel.toEntity(res.data);
  }

  async updateMaintenanceOrder(id: string, payload: UpdateMaintenancePayload): Promise<MaintenanceOrder> {
    const body: Record<string, unknown> = {};
    if (payload.status) body.status = payload.status;
    const cost = payload.laborCost ?? payload.laborPrice;
    if (cost !== undefined) body.laborCost = cost;
    if (payload.notes !== undefined) body.notes = payload.notes;
    if (payload.receptionNotes !== undefined) body.receptionNotes = payload.receptionNotes;

    const res = await this.network.patch<ApiResponse<RawMaintenanceOrderResponse>>(
      API_ENDPOINTS.MAINTENANCE.BY_ID(id),
      body
    );
    return MaintenanceOrderModel.toEntity(res.data);
  }

  async deleteMaintenanceOrder(id: string): Promise<void> {
    await this.network.delete<ApiResponse<null>>(API_ENDPOINTS.MAINTENANCE.BY_ID(id));
  }

  async updateMaintenanceStatus(id: string, status: string, notes?: string): Promise<MaintenanceOrder> {
    const res = await this.network.patch<ApiResponse<RawMaintenanceOrderResponse>>(
      API_ENDPOINTS.MAINTENANCE.BY_ID(id),
      { status, notes }
    );
    return MaintenanceOrderModel.toEntity(res.data);
  }

  async addDiagnosticNote(id: string, note: string): Promise<MaintenanceOrder> {
    const res = await this.network.post<ApiResponse<RawMaintenanceOrderResponse>>(
      API_ENDPOINTS.MAINTENANCE.NOTES(id),
      { note }
    );
    return MaintenanceOrderModel.toEntity(res.data);
  }

  async notifyMaintenance(id: string, notes?: string): Promise<MaintenanceOrder> {
    const res = await this.network.patch<ApiResponse<RawMaintenanceOrderResponse>>(
      API_ENDPOINTS.MAINTENANCE.NOTIFY(id),
      { notes }
    );
    return MaintenanceOrderModel.toEntity(res.data);
  }

  async linkMaintenanceSale(
    id: string,
    payload: { saleId?: string; folio?: string }
  ): Promise<MaintenanceOrder> {
    const res = await this.network.patch<ApiResponse<RawMaintenanceOrderResponse>>(
      API_ENDPOINTS.MAINTENANCE.LINK_SALE(id),
      payload
    );
    return MaintenanceOrderModel.toEntity(res.data);
  }

  async unlinkMaintenanceSale(id: string): Promise<MaintenanceOrder> {
    const res = await this.network.patch<ApiResponse<RawMaintenanceOrderResponse>>(
      API_ENDPOINTS.MAINTENANCE.UNLINK_SALE(id)
    );
    return MaintenanceOrderModel.toEntity(res.data);
  }

  async uploadEvidence(orderId: string, stage: string, files: File[]): Promise<boolean> {
    const formData = new FormData();
    formData.append('stage', stage);
    files.forEach((file) => formData.append('files', file));

    const res = await this.network.post<ApiResponse<{ evidence: unknown }>>(
      API_ENDPOINTS.MAINTENANCE.EVIDENCE(orderId),
      formData
    );
    return res.success;
  }

  async directReception(payload: DirectReceptionPayload): Promise<MaintenanceOrder> {
    const body: Record<string, unknown> = {
      customerName: payload.customerName,
      serviceRequested: payload.serviceRequested,
    };
    if (payload.customerPhone) body.customerPhone = payload.customerPhone;
    if (payload.customerEmail) body.customerEmail = payload.customerEmail;
    if (payload.customerId) body.customerId = payload.customerId;
    if (payload.vehicleId) body.vehicleId = payload.vehicleId;
    if (payload.whatsappId) body.whatsappId = payload.whatsappId;
    if (payload.notes || payload.receptionNotes) body.notes = payload.notes || payload.receptionNotes;
    if (payload.laborCost !== undefined) body.laborCost = payload.laborCost;
    if (payload.assignedMechanic) body.assignedMechanic = payload.assignedMechanic;
    if (payload.vehicle) {
      body.vehicle = {
        brand: payload.vehicle.brand,
        model: payload.vehicle.model,
        year: Number(payload.vehicle.year) || new Date().getFullYear(),
        serialNumberLastFour: payload.vehicle.serialNumberLastFour,
        ...(payload.vehicle.color ? { color: payload.vehicle.color } : {}),
      };
    }

    const res = await this.network.post<ApiResponse<RawMaintenanceOrderResponse>>(
      API_ENDPOINTS.MAINTENANCE.DIRECT_RECEPTION,
      body
    );
    return MaintenanceOrderModel.toEntity(res.data);
  }

  async getOrderPdfBlob(id: string): Promise<Blob> {
    return this.network.request<Blob>(API_ENDPOINTS.MAINTENANCE.PDF(id), {
      method: 'GET',
      headers: { Accept: 'application/pdf' },
    });
  }
}

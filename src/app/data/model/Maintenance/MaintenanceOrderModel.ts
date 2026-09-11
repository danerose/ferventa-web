import type { MaintenanceOrder, MaintenanceOrderStatus } from '@/app/domain/entities';


export interface RawMaintenanceOrderResponse {
  id?: string;
  _id?: string;
  status?: string;
  laborCost?: number;
  laborPrice?: number;
  notes?: string;
  receptionNotes?: string;
  serviceRequested?: string;
  receptionDate?: string;
  startedAt?: string;
  startDate?: string;
  completedAt?: string;
  notifiedAt?: string;
  deliveredAt?: string;
  endDate?: string;
  diagnosticNotes?: {
    note: string;
    createdAt: string;
    createdBy?: { _id?: string; id?: string; name?: string };
  }[];
  statusHistory?: {
    status: string;
    changedAt: string;
    changedBy?: { _id?: string; id?: string; name?: string };
    notes?: string;
  }[];
  appointment?: {
    id?: string;
    _id?: string;
    scheduledAt?: string;
    status?: string;
  } | string | null;
  customer?: {
    id?: string;
    _id?: string;
    name?: string;
    phone?: string;
    email?: string;
  };
  vehicle?: {
    id?: string;
    _id?: string;
    brand?: string;
    model?: string;
    year?: number | string;
    serialNumberLastFour?: string;
    color?: string;
    licensePlate?: string;
  };
  evidence?: {
    stage: string;
    photoUrls: string[];
  }[];
  sale?: {
    id?: string;
    _id?: string;
    folio?: string;
    total?: number;
    paymentMethod?: string;
    paymentReference?: string;
    items?: {
      name: string;
      quantity: number;
      priceSnapshot: number;
    }[];
    seller?: {
      id?: string;
      _id?: string;
      name?: string;
    } | string;
    createdAt?: string;
  } | null;
  assignedMechanic?: string | { id?: string; _id?: string; name?: string } | null;
  mechanic?: string | { id?: string; _id?: string; name?: string } | null;
  branchName?: string;
  branchId?: string;
  bay?: string;
  initialFuelLevel?: number;
  initialMileage?: number;
  inventoryReceived?: {
    spareTire?: boolean;
    jack?: boolean;
    tools?: boolean;
    documents?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export class MaintenanceOrderModel {
  static toEntity(raw: RawMaintenanceOrderResponse): MaintenanceOrder {
    if (!raw) {
      return {
        id: '',
        _id: '',
        status: 'not_started',
        laborCost: 0,
        laborPrice: 0,
        serviceRequested: 'Servicio de mantenimiento',
        diagnosticNotes: [],
        receptionDate: new Date().toISOString(),
        customer: { id: '', _id: '', name: 'Sin nombre' },
        vehicle: { id: '', _id: '', brand: 'Sin marca', model: 'Sin modelo', year: 0, serialNumberLastFour: '' },
        evidence: [],
        sale: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const id = raw.id || raw._id || '';

    let appointmentObj: MaintenanceOrder['appointment'] = null;
    if (raw.appointment) {
      if (typeof raw.appointment === 'string') {
        appointmentObj = { id: raw.appointment, scheduledAt: '', status: '' };
      } else {
        appointmentObj = {
          id: raw.appointment.id || raw.appointment._id || '',
          scheduledAt: raw.appointment.scheduledAt || '',
          status: raw.appointment.status || '',
        };
      }
    }

    const startedAt =
      raw.startedAt ||
      raw.startDate ||
      (Array.isArray(raw.statusHistory)
        ? raw.statusHistory.find((h) => h.status === 'in_progress')?.changedAt
        : undefined);

    const completedAt =
      raw.completedAt ||
      (Array.isArray(raw.statusHistory)
        ? raw.statusHistory.find((h) => h.status === 'completed')?.changedAt
        : undefined);

    const deliveredAt =
      raw.deliveredAt ||
      raw.endDate ||
      (Array.isArray(raw.statusHistory)
        ? raw.statusHistory.find((h) => h.status === 'delivered')?.changedAt
        : undefined);

    return {
      id,
      _id: id,
      status: (raw.status as MaintenanceOrderStatus) || 'not_started',
      laborCost: raw.laborCost || raw.laborPrice || 0,
      laborPrice: raw.laborPrice || raw.laborCost || 0,
      notes: raw.notes,
      receptionNotes: raw.receptionNotes,
      serviceRequested: raw.serviceRequested || raw.notes || 'Servicio de mantenimiento',
      diagnosticNotes: raw.diagnosticNotes || [],
      receptionDate: raw.receptionDate || raw.createdAt,
      startedAt,
      completedAt,
      notifiedAt: raw.notifiedAt,
      deliveredAt,
      statusHistory: raw.statusHistory || [],
      appointment: appointmentObj,
      customer: {
        id: raw.customer?.id || raw.customer?._id || '',
        _id: raw.customer?._id || raw.customer?.id || '',
        name: raw.customer?.name || 'Sin nombre',
        phone: raw.customer?.phone,
        email: raw.customer?.email,
      },
      vehicle: {
        id: raw.vehicle?.id || raw.vehicle?._id || '',
        _id: raw.vehicle?._id || raw.vehicle?.id || '',
        brand: raw.vehicle?.brand || 'Sin marca',
        model: raw.vehicle?.model || 'Sin modelo',
        year: raw.vehicle?.year || 0,
        serialNumberLastFour: raw.vehicle?.serialNumberLastFour || '',
        color: raw.vehicle?.color,
        licensePlate: raw.vehicle?.licensePlate,
      },
      evidence: raw.evidence || [],
      sale: raw.sale
        ? {
            id: raw.sale.id || raw.sale._id,
            _id: raw.sale._id || raw.sale.id,
            folio: raw.sale.folio,
            total: raw.sale.total,
            paymentMethod: raw.sale.paymentMethod,
            paymentReference: raw.sale.paymentReference,
            items: Array.isArray(raw.sale.items) ? raw.sale.items : [],
            seller: raw.sale.seller,
            createdAt: raw.sale.createdAt,
          }
        : null,
      assignedMechanic: raw.assignedMechanic,
      mechanic: raw.mechanic,
      branchName: raw.branchName,
      branchId: raw.branchId,
      bay: raw.bay,
      initialFuelLevel: raw.initialFuelLevel,
      initialMileage: raw.initialMileage,
      inventoryReceived: raw.inventoryReceived,
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
    };
  }
}

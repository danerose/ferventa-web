export interface DiagnosticNote {
  note: string;
  createdAt: string;
  createdBy?: {
    _id?: string;
    id?: string;
    name?: string;
  };
}

export interface MaintenanceStatusHistoryItem {
  status: string;
  changedAt: string;
  changedBy?: {
    _id?: string;
    id?: string;
    name?: string;
  };
  notes?: string;
}

export interface MaintenanceTask {
  _id?: string;
  id?: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: {
    _id?: string;
    id?: string;
    name?: string;
  };
}

export interface MaintenanceEvidenceItem {
  stage: string;
  photoUrls: string[];
}

export interface AdminMaintenanceSaleInfo {
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
}

export type MaintenanceOrderStatus =
  | 'awaiting_appointment'
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'delivered';

export interface MaintenanceOrder {
  id: string;
  _id?: string;
  appointmentId?: string;
  status: MaintenanceOrderStatus;
  laborCost?: number;
  laborPrice?: number;
  notes?: string;
  receptionNotes?: string;
  serviceRequested?: string;
  receptionDate?: string;
  startedAt?: string;
  completedAt?: string;
  notifiedAt?: string;
  deliveredAt?: string;
  diagnosticNotes?: DiagnosticNote[];
  statusHistory?: MaintenanceStatusHistoryItem[];
  tasks?: MaintenanceTask[];
  evidence?: MaintenanceEvidenceItem[];
  sale?: AdminMaintenanceSaleInfo | null;
  appointment?: {
    id: string;
    scheduledAt: string;
    status: string;
  } | null;
  customer: {
    id?: string;
    _id?: string;
    name: string;
    phone?: string;
    email?: string;
  };
  vehicle: {
    id?: string;
    _id?: string;
    brand: string;
    model: string;
    year: number | string;
    serialNumberLastFour: string;
    color?: string;
    licensePlate?: string;
  };
  assignedMechanic?: string | { id?: string; _id?: string; name?: string; email?: string } | null;
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

// Backwards compatibility alias
export type AdminMaintenanceOrder = MaintenanceOrder;

export interface UpdateMaintenancePayload {
  status?: string;
  notes?: string;
  receptionNotes?: string;
  assignedMechanic?: string | null;
  laborCost?: number;
  laborPrice?: number;
  bay?: string;
  initialFuelLevel?: number;
  initialMileage?: number;
  inventoryReceived?: {
    spareTire?: boolean;
    jack?: boolean;
    tools?: boolean;
    documents?: boolean;
  };
}

export interface MaintenanceFilterParams {
  customerId?: string;
  scope?: 'active' | 'delivered_recent' | 'history' | string;
  status?: string;
  search?: string;
  from?: string;
  to?: string;
  dateField?: string;
}

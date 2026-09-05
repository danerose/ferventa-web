export interface AuthUser {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: string;
  branches?: string[];
}

export interface AdminVehicle {
  brand: string;
  model: string;
  year: number | string;
  serialNumberLastFour: string;
  licensePlate?: string;
  color?: string;
}

export interface AdminAppointment {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  vehicle?: AdminVehicle;
  serviceRequested: string;
  scheduledAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'rescheduled';
  notes?: string;
  receptionNotes?: string;
  duration?: number;
  assignedMechanic?: string;
  branchName?: string;
  startTime?: string;
  endTime?: string;
}

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

export interface AdminMaintenanceOrder {
  id: string;
  status: 'awaiting_appointment' | 'not_started' | 'in_progress' | 'completed' | 'delivered';
  laborCost: number;
  laborPrice?: number;
  notes?: string;
  receptionNotes?: string;
  serviceRequested?: string;
  diagnosticNotes?: DiagnosticNote[];
  receptionDate?: string;
  startedAt?: string;
  completedAt?: string;
  notifiedAt?: string;
  deliveredAt?: string;
  statusHistory?: MaintenanceStatusHistoryItem[];
  appointment?: {
    id: string;
    scheduledAt: string;
    status: string;
  } | null;
  customer: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
  };
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year: number;
    serialNumberLastFour: string;
    licensePlate?: string;
    color?: string;
  };
  evidence?: {
    stage: string;
    photoUrls: string[];
  }[];
  sale?: AdminMaintenanceSaleInfo | null;
  assignedMechanic?: string | { id?: string; _id?: string; name?: string } | null;
  mechanic?: string | { id?: string; _id?: string; name?: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MaintenanceMetricsData {
  volume: {
    totalReceived: number;
    totalCompleted: number;
    totalDelivered: number;
    pendingPickupCount: number;
  };
  averages: {
    avgQueueHours: number;
    avgQueueDays: number;
    avgWorkHours: number;
    avgWorkDays: number;
    avgPickupHours: number;
    avgPickupDays: number;
    avgTotalStayHours: number;
    avgTotalStayDays: number;
  };
  pendingPickupVehicles: Array<{
    _id: string;
    customerName: string;
    customerPhone: string;
    vehicle: string;
    completedAt: string;
    notifiedAt?: string;
    daysWaiting: number;
    daysSinceNotified?: number;
    notes?: string;
  }>;
}


export interface Branch {
  id: string;
  _id?: string;
  name: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}

export interface Schedule {
  dayOfWeek: number;
  isWorking: boolean;
  startTime: string;
  endTime: string;
}

export interface Holiday {
  id: string;
  date: string;
  description: string;
}

export interface CustomerLookupVehicle {
  id?: string;
  _id?: string;
  brand: string;
  model: string;
  year: number | string;
  serialNumberLastFour: string;
  color?: string;
}

export interface CustomerLookupResult {
  id: string;
  name: string;
  phone: string;
  email?: string;
  vehicles?: CustomerLookupVehicle[];
}

export interface DirectReceptionPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  whatsappId?: string;
  customerId?: string;
  vehicle: {
    brand: string;
    model: string;
    year: number | string;
    serialNumberLastFour: string;
    color?: string;
  };
  serviceRequested: string;
  notes?: string;
  laborCost?: number;
  assignedMechanic?: string;
}

export interface CheckInResult {
  appointment: Partial<AdminAppointment>;
  maintenance: AdminMaintenanceOrder;
}


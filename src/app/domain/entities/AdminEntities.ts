export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AdminVehicle {
  brand: string;
  model: string;
  year: number | string;
  serialNumberLastFour: string;
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
  duration?: number;
  assignedMechanic?: string;
  branchName?: string;
  startTime?: string;
  endTime?: string;
}

export interface AdminMaintenanceOrder {
  id: string;
  status: 'awaiting_appointment' | 'not_started' | 'in_progress' | 'completed' | 'delivered';
  laborCost: number;
  notes?: string;
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
    color?: string;
  };
  evidence?: {
    stage: string;
    photoUrls: string[];
  }[];
  createdAt?: string;
  updatedAt?: string;
}

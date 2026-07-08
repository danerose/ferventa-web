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
}

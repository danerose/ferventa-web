export interface AppointmentVehicle {
  brand: string;
  model: string;
  year: number | string;
  serialNumberLastFour: string;
  licensePlate?: string;
  color?: string;
}

export type AppointmentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed'
  | 'rescheduled'
  | 'no_show';

export interface Appointment {
  id: string;
  _id?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerId?: string;
  whatsappId?: string;
  vehicle?: AppointmentVehicle;
  serviceRequested: string;
  scheduledAt: string;
  status: AppointmentStatus;
  notes?: string;
  receptionNotes?: string;
  duration?: number;
  assignedMechanic?: string;
  branchName?: string;
  branchId?: string;
  startTime?: string;
  endTime?: string;
}

// Backwards compatibility alias
export type AdminAppointment = Appointment;

export interface AppointmentsFilter {
  search?: string;
  status?: string;
  branchId?: string;
  fromDate?: string;
  toDate?: string;
}

export interface DirectReceptionPayload {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerId?: string;
  vehicleId?: string;
  whatsappId?: string;
  vehicle: {
    brand: string;
    model: string;
    year: number | string;
    serialNumberLastFour: string;
    licensePlate?: string;
    color?: string;
  };
  serviceRequested: string;
  receptionNotes?: string;
  notes?: string;
  laborCost?: number;
  assignedMechanic?: string;
  branchId?: string;
}

export interface CheckInResult {
  appointment: Appointment;
  maintenanceOrderId?: string;
  maintenance?: {
    id: string;
    status?: string;
  };
}


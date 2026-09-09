import type { Holiday } from '../Schedule/Schedule';


export interface Vehicle {
  brand: string;
  model: string;
  year: number | string;
  serialNumberLastFour: string;
  color?: string;
}

export type { Appointment } from '../Appointment/Appointment';

export interface BookAppointmentPayload {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicle: Vehicle;
  serviceRequested: string;
  scheduledAt: string;
  notes?: string;
  branchName?: string;
}



export interface MaintenanceTrackHistory {
  stage: 'reception' | 'disassembly' | 'maintenance' | 'completed' | 'delivered';
  status: 'pending' | 'in_progress' | 'completed';
  updatedAt: string | null;
}

export interface MaintenanceTrackItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface MaintenanceEvidence {
  stage: 'reception' | 'disassembly' | 'completed' | string;
  url: string;
  uploadedAt: string;
}

export interface MaintenanceTrack {
  id: string;
  orderNumber: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'delivered';
  vehicle: Vehicle;
  laborCost: number;
  notes: string;
  items: MaintenanceTrackItem[];
  history: MaintenanceTrackHistory[];
  evidence: MaintenanceEvidence[];
}

export interface BusySlot {
  appointmentId?: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface WorkingHours {
  dayOfWeek: number;
  isWorking: boolean;
  startTime: string;
  endTime: string;
}

export interface OccupiedSlots {
  holidays: Holiday[];
  nonWorkingDaysOfWeek: number[];
  busySlots: BusySlot[];
  workingHours: WorkingHours[];
}

export interface PublicBranch {
  id: string;
  _id?: string;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  isActive?: boolean;
}


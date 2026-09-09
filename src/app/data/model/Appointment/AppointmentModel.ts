import type { Appointment, AppointmentStatus, AppointmentVehicle } from '@/app/domain/entities';

export interface RawAppointmentResponse {
  id?: string;
  _id?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  vehicle?: {
    brand: string;
    model: string;
    year: number | string;
    serialNumberLastFour: string;
    licensePlate?: string;
    color?: string;
  };
  serviceRequested?: string;
  scheduledAt?: string;
  status?: AppointmentStatus;
  notes?: string;
  receptionNotes?: string;
  duration?: number;
  assignedMechanic?: string;
  branchName?: string;
  branchId?: string;
  startTime?: string;
  endTime?: string;
}

export class AppointmentModel {
  readonly id: string;
  readonly customerName: string;
  readonly serviceRequested: string;
  readonly scheduledAt: string;
  readonly status: AppointmentStatus;
  readonly customerPhone?: string;
  readonly customerEmail?: string;
  readonly vehicle?: AppointmentVehicle;
  readonly notes?: string;
  readonly receptionNotes?: string;
  readonly duration?: number;
  readonly assignedMechanic?: string;
  readonly branchName?: string;
  readonly branchId?: string;
  readonly startTime?: string;
  readonly endTime?: string;

  constructor(
    id: string,
    customerName: string,
    serviceRequested: string,
    scheduledAt: string,
    status: AppointmentStatus,
    customerPhone?: string,
    customerEmail?: string,
    vehicle?: AppointmentVehicle,
    notes?: string,
    receptionNotes?: string,
    duration?: number,
    assignedMechanic?: string,
    branchName?: string,
    branchId?: string,
    startTime?: string,
    endTime?: string
  ) {
    this.id = id;
    this.customerName = customerName;
    this.serviceRequested = serviceRequested;
    this.scheduledAt = scheduledAt;
    this.status = status;
    this.customerPhone = customerPhone;
    this.customerEmail = customerEmail;
    this.vehicle = vehicle;
    this.notes = notes;
    this.receptionNotes = receptionNotes;
    this.duration = duration;
    this.assignedMechanic = assignedMechanic;
    this.branchName = branchName;
    this.branchId = branchId;
    this.startTime = startTime;
    this.endTime = endTime;
  }

  static fromJson(json: RawAppointmentResponse): AppointmentModel {
    return new AppointmentModel(
      json.id || json._id || '',
      json.customerName || 'Sin Nombre',
      json.serviceRequested || 'Servicio General',
      json.scheduledAt || '',
      json.status || 'pending',
      json.customerPhone,
      json.customerEmail,
      json.vehicle,
      json.notes,
      json.receptionNotes,
      json.duration,
      json.assignedMechanic,
      json.branchName,
      json.branchId,
      json.startTime,
      json.endTime
    );
  }

  toEntity(): Appointment {
    return {
      id: this.id,
      _id: this.id,
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      customerEmail: this.customerEmail,
      vehicle: this.vehicle,
      serviceRequested: this.serviceRequested,
      scheduledAt: this.scheduledAt,
      status: this.status,
      notes: this.notes,
      receptionNotes: this.receptionNotes,
      duration: this.duration,
      assignedMechanic: this.assignedMechanic,
      branchName: this.branchName,
      branchId: this.branchId,
      startTime: this.startTime,
      endTime: this.endTime,
    };
  }
}

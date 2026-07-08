import type { Appointment } from '../entities/ClientPortalEntities';
import type { ClientPortalRepository } from '../repositories/ClientPortalRepository';

export class BookAppointmentUseCase {
  private clientPortalRepository: ClientPortalRepository;

  constructor(clientPortalRepository: ClientPortalRepository) {
    this.clientPortalRepository = clientPortalRepository;
  }

  async execute(appointment: Appointment): Promise<Appointment> {
    if (!appointment.customerName.trim()) {
      throw new Error('El nombre del cliente es requerido');
    }
    if (!appointment.customerPhone.trim()) {
      throw new Error('El teléfono del cliente es requerido');
    }
    if (!appointment.vehicle.serialNumberLastFour.trim() || appointment.vehicle.serialNumberLastFour.trim().length !== 4) {
      throw new Error('Los últimos 4 números del número de serie son requeridos (exactamente 4 dígitos)');
    }
    if (!appointment.scheduledAt) {
      throw new Error('La fecha y hora de la cita es requerida');
    }

    return this.clientPortalRepository.bookAppointment(appointment);
  }
}

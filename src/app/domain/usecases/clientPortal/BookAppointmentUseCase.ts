import type { IClientPortalRepository } from '@/app/domain/repository/ClientPortal/IClientPortalRepository';
import type { Appointment, BookAppointmentPayload } from '@/app/domain/entities';

export class BookAppointmentUseCase {
  private readonly clientPortalRepository: IClientPortalRepository;

  constructor(clientPortalRepository: IClientPortalRepository) {
    this.clientPortalRepository = clientPortalRepository;
  }

  async execute(appointment: BookAppointmentPayload): Promise<Appointment> {
    if (!appointment.customerName.trim()) {
      throw new Error('El nombre del cliente es requerido');
    }
    if (!appointment.customerPhone.trim()) {
      throw new Error('El teléfono del cliente es requerido');
    }
    if (!appointment.scheduledAt) {
      throw new Error('La fecha y hora de la cita es requerida');
    }

    const payload: BookAppointmentPayload = {
      ...appointment,
      vehicle: {
        ...appointment.vehicle,
        serialNumberLastFour: appointment.vehicle.serialNumberLastFour?.trim()
          ? appointment.vehicle.serialNumberLastFour.trim().slice(0, 4)
          : 'N/A',
      },
    };

    return this.clientPortalRepository.bookAppointment(payload);
  }
}

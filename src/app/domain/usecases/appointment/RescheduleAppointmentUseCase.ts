import type { IAppointmentRepository } from '@/app/domain/repository/Appointment/IAppointmentRepository';
import type { Appointment } from '@/app/domain/entities';

export class RescheduleAppointmentUseCase {
  private readonly appointmentRepository: IAppointmentRepository;

  constructor(appointmentRepository: IAppointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  execute(
    id: string,
    newDate: string,
    duration?: number,
    notes?: string
  ): Promise<Appointment> {
    if (!id || !id.trim()) {
      throw new Error('El ID de la cita es requerido');
    }
    if (!newDate || !newDate.trim()) {
      throw new Error('La nueva fecha es requerida');
    }
    return this.appointmentRepository.rescheduleAppointment(id.trim(), newDate, duration, notes);
  }
}

import type { IAppointmentRepository } from '@/app/domain/repository/Appointment/IAppointmentRepository';
import type { Appointment } from '@/app/domain/entities';

export class MarkNoShowAppointmentUseCase {
  private readonly appointmentRepository: IAppointmentRepository;

  constructor(appointmentRepository: IAppointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  execute(id: string, notes?: string): Promise<Appointment> {
    if (!id || !id.trim()) {
      throw new Error('El ID de la cita es requerido');
    }
    return this.appointmentRepository.markNoShow(id.trim(), notes);
  }
}

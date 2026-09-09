import type { IAppointmentRepository } from '@/app/domain/repository/Appointment/IAppointmentRepository';
import type { Appointment } from '@/app/domain/entities';

export class UpdateAppointmentUseCase {
  private readonly appointmentRepository: IAppointmentRepository;

  constructor(appointmentRepository: IAppointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  execute(id: string, payload: Partial<Appointment>): Promise<Appointment> {
    if (!id || !id.trim()) {
      throw new Error('El ID de la cita es requerido');
    }
    return this.appointmentRepository.updateAppointment(id.trim(), payload);
  }
}

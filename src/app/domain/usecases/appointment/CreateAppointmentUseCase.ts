import type { IAppointmentRepository } from '@/app/domain/repository/Appointment/IAppointmentRepository';
import type { Appointment } from '@/app/domain/entities';

export class CreateAppointmentUseCase {
  private readonly appointmentRepository: IAppointmentRepository;

  constructor(appointmentRepository: IAppointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  execute(payload: Partial<Appointment>): Promise<Appointment> {
    return this.appointmentRepository.createAppointment(payload);
  }
}

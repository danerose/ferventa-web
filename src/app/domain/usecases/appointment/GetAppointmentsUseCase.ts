import type { IAppointmentRepository } from '@/app/domain/repository/Appointment/IAppointmentRepository';
import type { Appointment, AppointmentsFilter } from '@/app/domain/entities';

export class GetAppointmentsUseCase {
  private readonly appointmentRepository: IAppointmentRepository;

  constructor(appointmentRepository: IAppointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  execute(filter?: AppointmentsFilter): Promise<Appointment[]> {
    return this.appointmentRepository.getAppointments(filter);
  }
}

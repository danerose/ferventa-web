import type { IAppointmentRepository } from '@/app/domain/repository/Appointment/IAppointmentRepository';
import type { DirectReceptionPayload, CheckInResult } from '@/app/domain/entities';

export class DirectReceptionAppointmentUseCase {
  private readonly appointmentRepository: IAppointmentRepository;

  constructor(appointmentRepository: IAppointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  execute(payload: DirectReceptionPayload): Promise<CheckInResult> {
    return this.appointmentRepository.directReception(payload);
  }
}

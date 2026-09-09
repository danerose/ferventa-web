import type { IAppointmentRepository } from '@/app/domain/repository/Appointment/IAppointmentRepository';
import type { Appointment } from '@/app/domain/entities';

export class GetAppointmentsTimelineUseCase {
  private readonly appointmentRepository: IAppointmentRepository;

  constructor(appointmentRepository: IAppointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  execute(startDate: string, endDate?: string): Promise<Appointment[]> {
    if (!startDate || !startDate.trim()) {
      throw new Error('La fecha de inicio es requerida');
    }
    return this.appointmentRepository.getAppointmentsTimeline(startDate, endDate);
  }
}

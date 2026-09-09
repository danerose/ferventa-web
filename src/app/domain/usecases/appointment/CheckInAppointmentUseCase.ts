import type { IAppointmentRepository } from '@/app/domain/repository/Appointment/IAppointmentRepository';
import type { CheckInResult } from '@/app/domain/entities';

export class CheckInAppointmentUseCase {
  private readonly appointmentRepository: IAppointmentRepository;

  constructor(appointmentRepository: IAppointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  execute(id: string, notes?: string): Promise<CheckInResult> {
    if (!id || !id.trim()) {
      throw new Error('El ID de la cita es requerido');
    }
    return this.appointmentRepository.checkInAppointment(id.trim(), notes);
  }
}

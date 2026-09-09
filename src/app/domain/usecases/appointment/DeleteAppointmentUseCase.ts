import type { IAppointmentRepository } from '@/app/domain/repository/Appointment/IAppointmentRepository';

export class DeleteAppointmentUseCase {
  private readonly appointmentRepository: IAppointmentRepository;

  constructor(appointmentRepository: IAppointmentRepository) {
    this.appointmentRepository = appointmentRepository;
  }

  execute(id: string): Promise<void> {
    if (!id || !id.trim()) {
      throw new Error('El ID de la cita es requerido');
    }
    return this.appointmentRepository.deleteAppointment(id.trim());
  }
}

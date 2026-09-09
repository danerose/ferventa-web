import type { IScheduleRepository } from '@/app/domain/repository/Schedule/IScheduleRepository';

export class DeleteHolidayUseCase {
  private readonly scheduleRepository: IScheduleRepository;

  constructor(scheduleRepository: IScheduleRepository) {
    this.scheduleRepository = scheduleRepository;
  }

  execute(id: string): Promise<void> {
    if (!id || !id.trim()) {
      throw new Error('El ID del día festivo es requerido');
    }
    return this.scheduleRepository.deleteHoliday(id.trim());
  }
}

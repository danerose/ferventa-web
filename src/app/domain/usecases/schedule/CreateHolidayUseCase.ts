import type { IScheduleRepository } from '@/app/domain/repository/Schedule/IScheduleRepository';
import type { Holiday } from '@/app/domain/entities';

export class CreateHolidayUseCase {
  private readonly scheduleRepository: IScheduleRepository;

  constructor(scheduleRepository: IScheduleRepository) {
    this.scheduleRepository = scheduleRepository;
  }

  execute(date: string, description: string): Promise<Holiday> {
    if (!date || !date.trim()) {
      throw new Error('La fecha del día festivo es requerida');
    }
    return this.scheduleRepository.createHoliday(date.trim(), description.trim());
  }
}

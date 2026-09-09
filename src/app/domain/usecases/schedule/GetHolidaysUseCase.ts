import type { IScheduleRepository } from '@/app/domain/repository/Schedule/IScheduleRepository';
import type { Holiday } from '@/app/domain/entities';

export class GetHolidaysUseCase {
  private readonly scheduleRepository: IScheduleRepository;

  constructor(scheduleRepository: IScheduleRepository) {
    this.scheduleRepository = scheduleRepository;
  }

  execute(): Promise<Holiday[]> {
    return this.scheduleRepository.getHolidays();
  }
}

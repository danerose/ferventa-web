import type { IScheduleRepository } from '@/app/domain/repository/Schedule/IScheduleRepository';
import type { Schedule } from '@/app/domain/entities';

export class UpdateScheduleUseCase {
  private readonly scheduleRepository: IScheduleRepository;

  constructor(scheduleRepository: IScheduleRepository) {
    this.scheduleRepository = scheduleRepository;
  }

  execute(schedules: Schedule[]): Promise<void> {
    return this.scheduleRepository.updateSchedule(schedules);
  }
}

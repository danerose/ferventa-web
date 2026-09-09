import type { IScheduleRepository } from '@/app/domain/repository/Schedule/IScheduleRepository';

export class GetScheduleOccupiedSlotsUseCase {
  private readonly scheduleRepository: IScheduleRepository;

  constructor(scheduleRepository: IScheduleRepository) {
    this.scheduleRepository = scheduleRepository;
  }

  execute(date: string): Promise<string[]> {
    if (!date || !date.trim()) {
      throw new Error('La fecha es requerida');
    }
    return this.scheduleRepository.getOccupiedSlots(date.trim());
  }
}

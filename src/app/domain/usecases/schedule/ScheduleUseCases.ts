import type { IScheduleRepository } from '@/app/domain/repository/Schedule/IScheduleRepository';
import type { Schedule, Holiday } from '@/app/domain/entities';
import { GetScheduleUseCase } from './GetScheduleUseCase';
import { UpdateScheduleUseCase } from './UpdateScheduleUseCase';
import { GetHolidaysUseCase } from './GetHolidaysUseCase';
import { CreateHolidayUseCase } from './CreateHolidayUseCase';
import { DeleteHolidayUseCase } from './DeleteHolidayUseCase';
import { GetScheduleOccupiedSlotsUseCase } from './GetScheduleOccupiedSlotsUseCase';

/**
 * Composite Facade for Schedule UseCases.
 * Provides backwards-compatibility while delegating all execution
 * to single-responsibility UseCase instances.
 */
export class ScheduleUseCases {
  public readonly getScheduleUseCase: GetScheduleUseCase;
  public readonly updateScheduleUseCase: UpdateScheduleUseCase;
  public readonly getHolidaysUseCase: GetHolidaysUseCase;
  public readonly createHolidayUseCase: CreateHolidayUseCase;
  public readonly deleteHolidayUseCase: DeleteHolidayUseCase;
  public readonly getOccupiedSlotsUseCase: GetScheduleOccupiedSlotsUseCase;

  constructor(repository: IScheduleRepository) {
    this.getScheduleUseCase = new GetScheduleUseCase(repository);
    this.updateScheduleUseCase = new UpdateScheduleUseCase(repository);
    this.getHolidaysUseCase = new GetHolidaysUseCase(repository);
    this.createHolidayUseCase = new CreateHolidayUseCase(repository);
    this.deleteHolidayUseCase = new DeleteHolidayUseCase(repository);
    this.getOccupiedSlotsUseCase = new GetScheduleOccupiedSlotsUseCase(repository);
  }

  getSchedule(): Promise<Schedule[]> {
    return this.getScheduleUseCase.execute();
  }

  updateSchedule(schedules: Schedule[]): Promise<void> {
    return this.updateScheduleUseCase.execute(schedules);
  }

  getHolidays(): Promise<Holiday[]> {
    return this.getHolidaysUseCase.execute();
  }

  createHoliday(date: string, description: string): Promise<Holiday> {
    return this.createHolidayUseCase.execute(date, description);
  }

  deleteHoliday(id: string): Promise<void> {
    return this.deleteHolidayUseCase.execute(id);
  }

  getOccupiedSlots(date: string): Promise<string[]> {
    return this.getOccupiedSlotsUseCase.execute(date);
  }
}

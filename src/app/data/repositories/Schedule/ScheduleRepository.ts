import type { IScheduleRepository } from '@/app/domain/repository/Schedule/IScheduleRepository';
import type { Schedule, Holiday } from '@/app/domain/entities';
import type { ScheduleRemoteDataSource } from '@/app/data/datasources/remote/Schedule/ScheduleRemoteDataSource';

export class ScheduleRepository implements IScheduleRepository {
  private readonly remote: ScheduleRemoteDataSource;

  constructor(remote: ScheduleRemoteDataSource) {
    this.remote = remote;
  }

  getSchedule(): Promise<Schedule[]> {
    return this.remote.getSchedule();
  }

  updateSchedule(schedules: Schedule[]): Promise<void> {
    return this.remote.updateSchedule(schedules);
  }

  getHolidays(): Promise<Holiday[]> {
    return this.remote.getHolidays();
  }

  createHoliday(date: string, description: string): Promise<Holiday> {
    return this.remote.createHoliday(date, description);
  }

  deleteHoliday(id: string): Promise<void> {
    return this.remote.deleteHoliday(id);
  }

  getOccupiedSlots(date: string): Promise<string[]> {
    return this.remote.getOccupiedSlots(date);
  }
}

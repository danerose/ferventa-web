import type { Schedule, Holiday } from '@/app/domain/entities';

export interface IScheduleRepository {
  getSchedule(): Promise<Schedule[]>;
  updateSchedule(schedules: Schedule[]): Promise<void>;
  getHolidays(): Promise<Holiday[]>;
  createHoliday(date: string, description: string): Promise<Holiday>;
  deleteHoliday(id: string): Promise<void>;
  getOccupiedSlots(date: string): Promise<string[]>;
}

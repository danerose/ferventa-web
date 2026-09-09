import type { Schedule, Holiday } from '@/app/domain/entities';

export interface RawScheduleResponse {
  day?: number;
  dayOfWeek?: number;
  enabled?: boolean;
  isOpen?: boolean;
  isWorking?: boolean;
  slots?: { start: string; end: string }[];
  openTime?: string;
  closeTime?: string;
  startTime?: string;
  endTime?: string;
}

export interface RawHolidayResponse {
  id?: string;
  _id?: string;
  date: string;
  description: string;
  isRecurring?: boolean;
}

export class ScheduleModel {
  static toScheduleEntity(raw: RawScheduleResponse): Schedule {
    const dayOfWeek = raw.dayOfWeek ?? raw.day ?? 0;
    const isWorking = raw.isWorking ?? raw.isOpen ?? raw.enabled ?? true;
    const startTime = raw.startTime ?? raw.openTime ?? '09:00';
    const endTime = raw.endTime ?? raw.closeTime ?? '18:00';
    return {
      dayOfWeek,
      isWorking,
      startTime,
      endTime,
      day: dayOfWeek,
      enabled: isWorking,
      slots: raw.slots || [{ start: startTime, end: endTime }],
    };
  }

  static toHolidayEntity(raw: RawHolidayResponse): Holiday {
    return {
      id: raw.id || raw._id || '',
      _id: raw._id || raw.id,
      date: raw.date,
      description: raw.description,
      isRecurring: raw.isRecurring,
    };
  }
}

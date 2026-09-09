export interface ScheduleDaySlot {
  start: string;
  end: string;
}

export interface Schedule {
  dayOfWeek: number;
  isWorking: boolean;
  startTime: string;
  endTime: string;
  day?: number;
  enabled?: boolean;
  slots?: ScheduleDaySlot[];
}

export interface Holiday {
  id: string;
  _id?: string;
  date: string;
  description: string;
  isRecurring?: boolean;
}

export interface OccupiedSlots {
  [date: string]: string[];
}


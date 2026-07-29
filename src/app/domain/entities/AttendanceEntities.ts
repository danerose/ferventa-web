import type { User } from './UserEntities';

export interface AttendanceBreak {
  _id?: string;
  id?: string;
  startTime: string;
  endTime?: string | null;
  durationMinutes?: number;
  note?: string;
}

export interface AttendanceRecord {
  _id: string;
  id?: string;
  user: string | User;
  branch: string | any;
  date: string;
  clockIn: string;
  clockOut?: string | null;
  breaks: AttendanceBreak[];
  status: 'working' | 'on_break' | 'completed';
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  netWorkMinutes: number;
  clockInNote?: string;
  clockOutNote?: string;
  adminNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TodayAttendanceStatus {
  hasActiveShift: boolean;
  status: 'off_shift' | 'working' | 'on_break' | 'completed' | string;
  attendance?: AttendanceRecord | null;
  lastRecordToday?: AttendanceRecord | null;
  currentWorkMinutes?: number;
  currentWorkHours?: number;
  totalBreakMinutes?: number;
  totalBreakHours?: number;
  netWorkMinutes?: number;
  netWorkHours?: number;
  activeBreak?: {
    startTime: string;
    durationMinutes: number;
    note?: string;
  } | null;
}

export interface AttendanceUserSummary {
  userId: string;
  userName: string;
  userEmail?: string;
  branchId: string;
  branchName?: string;
  totalShifts: number;
  completedShifts: number;
  totalWorkMinutes: number;
  totalWorkHours: number;
  totalBreakMinutes: number;
  totalBreakHours: number;
  netWorkMinutes: number;
  netWorkHours: number;
}

export interface AttendancePeriodSummary {
  period: 'weekly' | 'biweekly' | 'monthly' | 'custom';
  range: {
    startDate: string;
    endDate: string;
  };
  usersSummary: AttendanceUserSummary[];
}

export interface UserAttendanceBreakdown {
  user: User;
  records: AttendanceRecord[];
  totals: {
    totalShifts: number;
    totalWorkMinutes: number;
    totalBreakMinutes: number;
    netWorkMinutes: number;
    totalWorkHours: number;
    totalBreakHours: number;
    netWorkHours: number;
  };
}

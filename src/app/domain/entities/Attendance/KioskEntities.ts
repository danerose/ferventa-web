export type KioskClockAction = 'clock-in' | 'clock-out' | 'break-start' | 'break-end';

export interface KioskEmployee {
  id: string;
  _id?: string;
  name: string;
  username?: string;
  role: string;
  avatarUrl?: string;
  shiftStatus?: 'clocked-in' | 'on-break' | 'clocked-out' | string;
  hasActiveShift?: boolean;
  isOnBreak?: boolean;
  lastRecordAt?: string;
  lastAction?: string;
}

export interface KioskClockPayload {
  branchId: string;
  userId: string;
  pin: string;
  action: KioskClockAction;
  notes?: string;
}

export interface KioskClockResult {
  employeeName: string;
  action: KioskClockAction;
  recordedAt: string;
  message?: string;
}

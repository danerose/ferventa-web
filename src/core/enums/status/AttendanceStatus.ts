export const AttendanceStatus = {
  Present: 'present',
  Late: 'late',
  Absent: 'absent',
  Justified: 'justified',
  Holiday: 'holiday',
  DayOff: 'day_off',
} as const;

export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

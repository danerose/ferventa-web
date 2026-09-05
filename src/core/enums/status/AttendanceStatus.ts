export const AttendanceStatus = {
  Present: 'present',
  Late: 'late',
  Absent: 'absent',
  Justified: 'justified',
  Holiday: 'holiday',
  DayOff: 'day_off',
} as const;

export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus | string, string> = {
  [AttendanceStatus.Present]: 'Presente',
  [AttendanceStatus.Late]: 'Retardo',
  [AttendanceStatus.Absent]: 'Falta',
  [AttendanceStatus.Justified]: 'Justificado',
  [AttendanceStatus.Holiday]: 'Feriado',
  [AttendanceStatus.DayOff]: 'Día Libre',
};

export const ATTENDANCE_STATUS_COLORS: Record<
  AttendanceStatus | string,
  {
    bg: string;
    text: string;
    border: string;
    badgeColor: 'neutral' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
  }
> = {
  [AttendanceStatus.Present]: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/20',
    badgeColor: 'success',
  },
  [AttendanceStatus.Late]: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/20',
    badgeColor: 'warning',
  },
  [AttendanceStatus.Absent]: {
    bg: 'bg-error/10',
    text: 'text-error',
    border: 'border-error/20',
    badgeColor: 'error',
  },
  [AttendanceStatus.Justified]: {
    bg: 'bg-info/10',
    text: 'text-info',
    border: 'border-info/20',
    badgeColor: 'info',
  },
  [AttendanceStatus.Holiday]: {
    bg: 'bg-secondary/10',
    text: 'text-secondary',
    border: 'border-secondary/20',
    badgeColor: 'secondary',
  },
  [AttendanceStatus.DayOff]: {
    bg: 'bg-base-200',
    text: 'text-base-content/70',
    border: 'border-base-300',
    badgeColor: 'neutral',
  },
};


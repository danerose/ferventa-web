export const ServiceStatus = {
  Pending: 'pending',
  Confirmed: 'confirmed',
  InProgress: 'in_progress',
  Completed: 'completed',
  Cancelled: 'cancelled',
  Delivered: 'delivered',
  NotStarted: 'not_started',
} as const;

export type ServiceStatus = (typeof ServiceStatus)[keyof typeof ServiceStatus];

export const SERVICE_STATUS_LABELS: Record<ServiceStatus | string, string> = {
  [ServiceStatus.NotStarted]: 'No Comenzado',
  [ServiceStatus.Pending]: 'Pendiente',
  [ServiceStatus.Confirmed]: 'Confirmado',
  [ServiceStatus.InProgress]: 'En Proceso',
  [ServiceStatus.Completed]: 'Terminado',
  [ServiceStatus.Delivered]: 'Entregado',
  [ServiceStatus.Cancelled]: 'Cancelado',
};

export const SERVICE_STATUS_COLORS: Record<
  ServiceStatus | string,
  {
    bg: string;
    text: string;
    border: string;
    badgeColor: 'neutral' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';
  }
> = {
  [ServiceStatus.NotStarted]: {
    bg: 'bg-base-200',
    text: 'text-base-content/70',
    border: 'border-base-300',
    badgeColor: 'neutral',
  },
  [ServiceStatus.Pending]: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    border: 'border-warning/20',
    badgeColor: 'warning',
  },
  [ServiceStatus.Confirmed]: {
    bg: 'bg-info/10',
    text: 'text-info',
    border: 'border-info/20',
    badgeColor: 'info',
  },
  [ServiceStatus.InProgress]: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/20',
    badgeColor: 'primary',
  },
  [ServiceStatus.Completed]: {
    bg: 'bg-success/10',
    text: 'text-success',
    border: 'border-success/20',
    badgeColor: 'success',
  },
  [ServiceStatus.Delivered]: {
    bg: 'bg-base-300',
    text: 'text-base-content',
    border: 'border-base-content/20',
    badgeColor: 'neutral',
  },
  [ServiceStatus.Cancelled]: {
    bg: 'bg-error/10',
    text: 'text-error',
    border: 'border-error/20',
    badgeColor: 'error',
  },
};


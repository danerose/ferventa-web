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

export interface AuditLogUser {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface AuditLogBranch {
  id?: string;
  _id?: string;
  name?: string;
}

export interface AuditLog {
  id: string;
  module: 'appointments' | 'sales' | 'maintenance' | 'inventory' | 'attendance' | 'orders' | 'users' | string;
  action: 'cancelled' | 'rejected' | 'approved' | 'box_opened' | 'movement_deleted' | 'notified' | 'clocked' | string;
  description: string;
  performedBy?: AuditLogUser | null;
  branch?: AuditLogBranch | string | null;
  targetId?: string;
  targetFolio?: string;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogFilter {
  module?: string;
  action?: string;
  userId?: string;
  entityId?: string;
  entityType?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

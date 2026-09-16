import type { AuditLog, AuditLogFilter } from '@/app/domain/entities/Audit/AuditEntities';

export interface IAuditRepository {
  getAuditLogs(filter?: AuditLogFilter): Promise<{ logs: AuditLog[]; total?: number }>;
  getEntityAuditLogs(entityId: string, entityType?: string): Promise<AuditLog[]>;
}

import type { IAuditRepository } from '@/app/domain/repository/Audit/IAuditRepository';
import type { AuditLog, AuditLogFilter } from '@/app/domain/entities/Audit/AuditEntities';
import type { AuditRemoteDataSource } from '@/app/data/datasources/remote/Audit/AuditRemoteDataSource';

export class AuditRepository implements IAuditRepository {
  private readonly remote: AuditRemoteDataSource;

  constructor(remote: AuditRemoteDataSource) {
    this.remote = remote;
  }

  getAuditLogs(filter?: AuditLogFilter): Promise<{ logs: AuditLog[]; total?: number }> {
    return this.remote.getAuditLogs(filter);
  }

  getEntityAuditLogs(entityId: string, entityType?: string): Promise<AuditLog[]> {
    return this.remote.getEntityAuditLogs(entityId, entityType);
  }
}

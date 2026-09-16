import { NetworkService } from '@/core/services';
import { API_ENDPOINTS } from '@/core/constants';
import type { AuditLog, AuditLogFilter } from '@/app/domain/entities/Audit/AuditEntities';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  total?: number;
}

export class AuditRemoteDataSource {
  private readonly network: NetworkService;

  constructor(network: NetworkService) {
    this.network = network;
  }

  async getAuditLogs(filter: AuditLogFilter = {}): Promise<{ logs: AuditLog[]; total?: number }> {
    const params: Record<string, string | number | undefined> = {};
    if (filter.module) params.module = filter.module;
    if (filter.action) params.action = filter.action;
    if (filter.userId) params.userId = filter.userId;
    if (filter.entityId) params.entityId = filter.entityId;
    if (filter.entityType) params.entityType = filter.entityType;
    if (filter.from) params.from = filter.from;
    if (filter.to) params.to = filter.to;
    if (filter.search) params.search = filter.search;
    if (filter.page) params.page = filter.page;
    if (filter.limit) params.limit = filter.limit;

    const res = await this.network.get<ApiResponse<any[]>>(
      API_ENDPOINTS.AUDIT_LOGS.BASE,
      { params }
    );

    const rawList = Array.isArray(res.data) ? res.data : [];
    const logs: AuditLog[] = rawList.map((item) => ({
      id: item.id || item._id,
      module: item.module,
      action: item.action,
      description: item.description,
      performedBy: item.performedBy
        ? {
            id: item.performedBy.id || item.performedBy._id,
            name: item.performedBy.name,
            email: item.performedBy.email,
            role: item.performedBy.role,
          }
        : null,
      branch: item.branch
        ? typeof item.branch === 'object'
          ? {
              id: item.branch.id || item.branch._id,
              name: item.branch.name,
            }
          : item.branch
        : null,
      entityId: item.entityId || item.targetId,
      entityType: item.entityType,
      targetId: item.entityId || item.targetId,
      targetFolio: item.entityFolio || item.targetFolio,
      metadata: item.metadata,
      ipAddress: item.ipAddress,
      userAgent: item.userAgent,
      createdAt: item.createdAt,
    }));

    return { logs, total: res.total ?? logs.length };
  }

  async getEntityAuditLogs(entityId: string, entityType?: string): Promise<AuditLog[]> {
    if (!entityId) return [];

    try {
      const res = await this.network.get<ApiResponse<any[]>>(
        API_ENDPOINTS.AUDIT_LOGS.BY_ENTITY(entityId)
      );

      const rawList = Array.isArray(res.data) ? res.data : [];
      if (rawList.length > 0) {
        return rawList.map((item) => ({
          id: item.id || item._id,
          module: item.module,
          action: item.action,
          description: item.description,
          performedBy: item.performedBy
            ? {
                id: item.performedBy.id || item.performedBy._id,
                name: item.performedBy.name,
                email: item.performedBy.email,
                role: item.performedBy.role,
              }
            : null,
          branch: item.branch
            ? typeof item.branch === 'object'
              ? {
                  id: item.branch.id || item.branch._id,
                  name: item.branch.name,
                }
              : item.branch
            : null,
          entityId: item.entityId || item.targetId,
          entityType: item.entityType,
          targetId: item.entityId || item.targetId,
          targetFolio: item.entityFolio || item.targetFolio,
          metadata: item.metadata,
          ipAddress: item.ipAddress,
          userAgent: item.userAgent,
          createdAt: item.createdAt,
        }));
      }
    } catch {
      // Fallback below to query by filter
    }

    try {
      const fallbackResult = await this.getAuditLogs({
        entityId,
        limit: 50,
      });
      if (fallbackResult.logs.length > 0) {
        return fallbackResult.logs;
      }

      if (entityType) {
        const typeFallback = await this.getAuditLogs({
          entityType,
          search: entityId,
          limit: 50,
        });
        if (typeFallback.logs.length > 0) {
          return typeFallback.logs;
        }

        const moduleName = entityType.toLowerCase().includes('appoint')
          ? 'appointments'
          : entityType.toLowerCase().includes('sale')
          ? 'sales'
          : entityType.toLowerCase().includes('maint')
          ? 'maintenance'
          : entityType.toLowerCase();

        const moduleFallback = await this.getAuditLogs({
          module: moduleName,
          search: entityId,
          limit: 50,
        });
        if (moduleFallback.logs.length > 0) {
          return moduleFallback.logs;
        }
      }

      const searchFallback = await this.getAuditLogs({
        search: entityId,
        limit: 50,
      });
      return searchFallback.logs;
    } catch {
      return [];
    }
  }
}

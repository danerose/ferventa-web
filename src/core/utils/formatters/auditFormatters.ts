import type { AuditLog } from '@/app/domain/entities/Audit/AuditEntities';
import type { StatusVariant } from '@/core/types';

/**
 * Formatea un timestamp de auditoría al estándar local de México.
 */
export const formatAuditDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

/**
 * Determina la variante semántica de status para una acción de auditoría.
 */
export const getAuditActionBadgeVariant = (action: string): StatusVariant => {
  const act = (action || '').toLowerCase();
  if (act.includes('cancel') || act.includes('reject') || act.includes('delete') || act.includes('fail')) {
    return 'error';
  }
  if (act.includes('approv') || act.includes('success') || act.includes('paid') || act.includes('create')) {
    return 'success';
  }
  if (act.includes('status') || act.includes('update') || act.includes('box') || act.includes('resched')) {
    return 'warning';
  }
  return 'primary';
};

/**
 * Determina el token de color DaisyUI para el módulo de auditoría.
 */
export const getAuditModuleBadgeColor = (module: string): string => {
  switch (module?.toLowerCase()) {
    case 'inventory':
      return 'badge-accent';
    case 'appointments':
      return 'badge-info';
    case 'maintenance':
      return 'badge-warning';
    case 'sales':
      return 'badge-success';
    case 'attendance':
      return 'badge-primary';
    case 'specialorders':
    case 'orders':
      return 'badge-secondary';
    default:
      return 'badge-ghost';
  }
};

/**
 * Calcula las métricas resumidas a partir de la lista de logs de auditoría.
 */
export const calculateAuditStats = (
  logs: AuditLog[]
): { totalCount: number; criticalCount: number; inventoryCount: number } => {
  const totalCount = logs.length;
  const criticalCount = logs.filter((l) => {
    const act = (l.action || '').toLowerCase();
    return act.includes('cancel') || act.includes('reject') || act.includes('delete');
  }).length;
  const inventoryCount = logs.filter((l) => l.module?.toLowerCase() === 'inventory').length;

  return { totalCount, criticalCount, inventoryCount };
};

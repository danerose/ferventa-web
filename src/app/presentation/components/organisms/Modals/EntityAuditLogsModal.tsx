import React from 'react';
import { Icon, Modal, Badge } from '@/app/presentation/components';
import { auditRepository } from '@/core/di/container';
import type { AuditLog } from '@/app/domain/entities/Audit/AuditEntities';
import type { StatusVariant } from '@/core/types';

interface EntityAuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityType?: string;
  title?: string;
}

export const EntityAuditLogsModal: React.FC<EntityAuditLogsModalProps> = ({
  isOpen,
  onClose,
  entityId,
  entityType,
  title,
}) => {
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen || !entityId) return;

    let isMounted = true;
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await auditRepository.getEntityAuditLogs(entityId);
        if (isMounted) {
          setLogs(data || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Error al consultar historial de auditoría');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLogs();
    return () => {
      isMounted = false;
    };
  }, [isOpen, entityId]);

  const getActionBadgeVariant = (action: string): StatusVariant => {
    const act = (action || '').toLowerCase();
    if (act.includes('cancel') || act.includes('reject') || act.includes('delete')) return 'error';
    if (act.includes('approv') || act.includes('success') || act.includes('paid')) return 'success';
    if (act.includes('status') || act.includes('update')) return 'warning';
    return 'primary';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || `Historial de Auditoría ${entityType ? `(${entityType})` : ''}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
            <span className="loading loading-spinner loading-md text-primary mb-3"></span>
            <p className="text-sm">Consultando bitácora de eventos...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-error text-sm">
            <Icon name="AlertCircle" size="sm" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && logs.length === 0 && (
          <div className="text-center py-10 text-base-content/50">
            <Icon name="FileText" size="lg" className="mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">No se encontraron registros de auditoría para este elemento.</p>
          </div>
        )}

        {!loading && !error && logs.length > 0 && (
          <div className="relative pl-6 space-y-6 before:absolute before:bottom-0 before:top-2 before:left-[11px] before:w-[2px] before:bg-base-300 dark:before:bg-base-content/10">
            {logs.map((log) => (
              <div key={log.id} className="relative group">
                {/* Dot */}
                <div className="absolute -left-[30px] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-base-100 dark:ring-base-200"></div>

                <div className="bg-base-200/50 dark:bg-base-300/30 rounded-xl p-3.5 border border-base-200 dark:border-base-content/5 hover:border-primary/20 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                        {log.action}
                      </Badge>
                      <span className="text-xs font-semibold text-base-content/70 uppercase tracking-wider">
                        {log.module}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-base-content/50">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm text-base-content font-medium leading-relaxed">
                    {log.description}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-base-200/60 dark:border-base-content/5 flex items-center justify-between text-xs text-base-content/60">
                    <div className="flex items-center gap-1.5">
                      <Icon name="User" size="xs" />
                      <span>
                        {log.performedBy?.name || 'Sistema'}
                        {log.performedBy?.role ? ` (${log.performedBy.role})` : ''}
                      </span>
                    </div>

                    {log.targetFolio && (
                      <span className="font-mono text-[11px] bg-base-300 px-1.5 py-0.5 rounded">
                        Folio: {log.targetFolio}
                      </span>
                    )}
                  </div>

                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="mt-2 text-[11px] bg-base-300/40 p-2 rounded-lg font-mono text-base-content/70 overflow-x-auto">
                      <div className="font-semibold mb-0.5 text-base-content/50 font-sans">Detalles técnicos:</div>
                      <pre className="whitespace-pre-wrap break-all">
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-base-200 dark:border-base-content/10">
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};

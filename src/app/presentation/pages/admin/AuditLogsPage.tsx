import React, { useState, useEffect, useCallback } from 'react';
import {
  Icon,
  Badge,
  TextInput,
  Select,
  SecondaryButton,
  Modal,
  PageLayout,
} from '@/app/presentation/components';
import { useAuthStore } from '@/app/presentation/stores';
import { auditRepository } from '@/core/di/container';
import type { AuditLog, AuditLogFilter } from '@/app/domain/entities/Audit/AuditEntities';
import type { StatusVariant } from '@/core/types';

export const AuditLogsPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Selected Log for JSON inspector modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filter: AuditLogFilter = {};
      if (moduleFilter !== 'all') filter.module = moduleFilter;
      if (actionFilter !== 'all') filter.action = actionFilter;
      if (searchTerm.trim()) filter.search = searchTerm.trim();
      if (fromDate) filter.from = fromDate;
      if (toDate) filter.to = toDate;

      const res = await auditRepository.getAuditLogs(filter);
      setLogs(res.logs || []);
    } catch (err: any) {
      setError(err?.message || 'Error al obtener la bitácora de auditoría');
    } finally {
      setLoading(false);
    }
  }, [moduleFilter, actionFilter, searchTerm, fromDate, toDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClearFilters = () => {
    setModuleFilter('all');
    setActionFilter('all');
    setSearchTerm('');
    setFromDate('');
    setToDate('');
  };

  const getActionBadgeVariant = (action: string): StatusVariant => {
    const act = (action || '').toLowerCase();
    if (act.includes('cancel') || act.includes('reject') || act.includes('delete')) return 'error';
    if (act.includes('approv') || act.includes('success') || act.includes('paid')) return 'success';
    if (act.includes('status') || act.includes('update') || act.includes('box')) return 'warning';
    return 'primary';
  };

  const getModuleBadgeColor = (module: string) => {
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
      default:
        return 'badge-ghost';
    }
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

  // Stats calculation
  const totalCount = logs.length;
  const criticalCount = logs.filter((l) => {
    const act = (l.action || '').toLowerCase();
    return act.includes('cancel') || act.includes('reject') || act.includes('delete');
  }).length;
  const inventoryCount = logs.filter((l) => l.module?.toLowerCase() === 'inventory').length;

  return (
    <PageLayout userName={user?.name || 'Admin'}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 dark:border-base-content/5 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Icon name="ShieldCheck" size="md" />
              </div>
              <div>
                <h1 className="text-xl font-black text-base-content tracking-tight">
                  Bitácora de Auditoría del Sistema
                </h1>
                <p className="text-xs text-base-content/60">
                  Supervisión cronológica de acciones operativas, cancelaciones y movimientos sensibles
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SecondaryButton
              size="sm"
              onClick={fetchLogs}
              disabled={loading}
              iconStart={<Icon name="RefreshCw" size="xs" className={loading ? 'animate-spin' : ''} />}
            >
              Actualizar
            </SecondaryButton>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-base-100 p-4 rounded-xl border border-base-200 dark:border-base-content/5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="FileText" size="sm" />
            </div>
            <div>
              <div className="text-2xl font-black text-base-content">{totalCount}</div>
              <div className="text-xs text-base-content/60 font-semibold uppercase">Eventos Registrados</div>
            </div>
          </div>

          <div className="bg-base-100 p-4 rounded-xl border border-base-200 dark:border-base-content/5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-error/10 text-error flex items-center justify-center">
              <Icon name="AlertTriangle" size="sm" />
            </div>
            <div>
              <div className="text-2xl font-black text-error">{criticalCount}</div>
              <div className="text-xs text-base-content/60 font-semibold uppercase">Acciones Críticas / Cancelaciones</div>
            </div>
          </div>

          <div className="bg-base-100 p-4 rounded-xl border border-base-200 dark:border-base-content/5 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
              <Icon name="Package" size="sm" />
            </div>
            <div>
              <div className="text-2xl font-black text-base-content">{inventoryCount}</div>
              <div className="text-xs text-base-content/60 font-semibold uppercase">Eventos de Inventario y Cajas</div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-base-100 p-5 rounded-2xl border border-base-200 dark:border-base-content/5 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-semibold text-base-content/70 block mb-1">Módulo</label>
              <Select
                size="sm"
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todos los Módulos' },
                  { value: 'inventory', label: 'Inventario / Cajas' },
                  { value: 'appointments', label: 'Citas' },
                  { value: 'maintenance', label: 'Mantenimiento / Taller' },
                  { value: 'sales', label: 'Ventas / POS' },
                  { value: 'attendance', label: 'Asistencia' },
                  { value: 'orders', label: 'Pedidos Especiales' },
                  { value: 'users', label: 'Usuarios' },
                ]}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-base-content/70 block mb-1">Acción</label>
              <Select
                size="sm"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'Todas las Acciones' },
                  { value: 'cancelled', label: 'Cancelado' },
                  { value: 'rejected', label: 'Rechazado' },
                  { value: 'approved', label: 'Aprobado' },
                  { value: 'open_box', label: 'Apertura de Caja' },
                  { value: 'movement_deleted', label: 'Movimiento Eliminado' },
                  { value: 'notified', label: 'Notificación' },
                  { value: 'clocked', label: 'Marcaje Asistencia' },
                ]}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-base-content/70 block mb-1">Desde</label>
              <input
                type="date"
                className="input input-sm input-bordered w-full"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-base-content/70 block mb-1">Hasta</label>
              <input
                type="date"
                className="input input-sm input-bordered w-full"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-base-content/70 block mb-1">Búsqueda</label>
              <TextInput
                size="sm"
                placeholder="Buscar por texto, folio o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {(moduleFilter !== 'all' || actionFilter !== 'all' || searchTerm || fromDate || toDate) && (
            <div className="flex justify-end">
              <button
                onClick={handleClearFilters}
                className="btn btn-ghost btn-xs text-base-content/60 hover:text-base-content gap-1"
              >
                <Icon name="X" size="xs" />
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Table Section */}
        <div className="bg-base-100 rounded-2xl border border-base-200 dark:border-base-content/5 shadow-xs overflow-hidden">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-base-content/60">
              <span className="loading loading-spinner loading-lg text-primary mb-3"></span>
              <p className="text-sm font-medium">Cargando registros de auditoría...</p>
            </div>
          )}

          {error && (
            <div className="p-6">
              <div className="alert alert-error text-sm">
                <Icon name="AlertCircle" size="sm" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {!loading && !error && logs.length === 0 && (
            <div className="text-center py-16 text-base-content/50">
              <Icon name="ShieldCheck" size="xl" className="mx-auto mb-3 opacity-30" />
              <p className="text-base font-bold text-base-content/70">No se encontraron eventos</p>
              <p className="text-xs text-base-content/50 mt-1">Prueba cambiando los criterios de filtro o la fecha</p>
            </div>
          )}

          {!loading && !error && logs.length > 0 && (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-xs">
                <thead>
                  <tr className="border-b border-base-200 text-base-content/70 uppercase text-[11px]">
                    <th>Fecha & Hora</th>
                    <th>Módulo</th>
                    <th>Acción</th>
                    <th>Descripción</th>
                    <th>Usuario</th>
                    <th>Sucursal</th>
                    <th>Folio / ID</th>
                    <th className="text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="hover">
                      <td className="font-mono whitespace-nowrap text-base-content/70">
                        {formatDate(log.createdAt)}
                      </td>
                      <td>
                        <span className={`badge badge-sm font-bold uppercase tracking-wider ${getModuleBadgeColor(log.module)}`}>
                          {log.module}
                        </span>
                      </td>
                      <td>
                        <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="max-w-xs truncate font-medium text-base-content" title={log.description}>
                        {log.description}
                      </td>
                      <td className="whitespace-nowrap">
                        {log.performedBy ? (
                          <div>
                            <div className="font-bold text-base-content">{log.performedBy.name}</div>
                            <div className="text-[10px] text-base-content/50 capitalize">{log.performedBy.role}</div>
                          </div>
                        ) : (
                          <span className="text-base-content/40 italic">Sistema</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-base-content/70">
                        {typeof log.branch === 'object' && log.branch !== null ? log.branch.name : (log.branch || '—')}
                      </td>
                      <td className="font-mono text-[11px] text-base-content/60">
                        {log.targetFolio || (log.entityId ? log.entityId.slice(-6).toUpperCase() : '—')}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="btn btn-ghost btn-xs text-primary gap-1"
                          title="Ver payload completo"
                        >
                          <Icon name="Eye" size="xs" />
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Technical Detail Modal */}
        {selectedLog && (
          <Modal
            isOpen={Boolean(selectedLog)}
            onClose={() => setSelectedLog(null)}
            title={`Detalle de Evento - ${selectedLog.action} (${selectedLog.module})`}
            maxWidth="max-w-2xl"
          >
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-base-200 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-base-content/50 uppercase block">Fecha</span>
                  <span className="font-mono font-semibold">{formatDate(selectedLog.createdAt)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-base-content/50 uppercase block">Usuario</span>
                  <span className="font-semibold">
                    {selectedLog.performedBy?.name || 'Sistema'} ({selectedLog.performedBy?.role || 'N/A'})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-base-content/50 uppercase block">Entidad Afectada</span>
                  <span className="font-mono font-semibold">
                    {selectedLog.entityType || selectedLog.module} - {selectedLog.entityId || selectedLog.targetId || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-base-content/50 uppercase block">Folio</span>
                  <span className="font-mono font-semibold">{selectedLog.targetFolio || 'N/A'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-base-content/50 uppercase block mb-1">Descripción</span>
                <p className="p-3 bg-base-200/60 rounded-xl font-medium text-sm text-base-content">
                  {selectedLog.description}
                </p>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-base-content/50 uppercase block mb-1">
                    Metadata del Evento (JSON)
                  </span>
                  <pre className="p-3 bg-base-300 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => setSelectedLog(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </PageLayout>
  );
};

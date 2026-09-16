import React, { useEffect, useState } from 'react';
import {
  Icon,
  Badge,
  TextInput,
  Select,
  SecondaryButton,
  Modal,
  PageLayout,
  Heading,
  Text,
  Box,
  Flex,
  Grid,
} from '@/app/presentation/components';
import { useAuthStore, useAuditStore } from '@/app/presentation/stores';
import {
  formatAuditDate,
  getAuditActionBadgeVariant,
  getAuditModuleBadgeColor,
  calculateAuditStats,
} from '@/core/utils';
import type { AuditLog } from '@/app/domain';

export const AuditLogsPage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const logs = useAuditStore((s) => s.logs);
  const loading = useAuditStore((s) => s.loading);
  const error = useAuditStore((s) => s.error);
  const filter = useAuditStore((s) => s.filter);
  const setFilter = useAuditStore((s) => s.setFilter);
  const resetFilter = useAuditStore((s) => s.resetFilter);
  const fetchLogs = useAuditStore((s) => s.fetchLogs);

  // Selected Log for JSON inspector modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, filter.module, filter.action, filter.search, filter.from, filter.to]);

  const { totalCount, criticalCount, inventoryCount } = calculateAuditStats(logs);

  const hasActiveFilters = Boolean(
    filter.module || filter.action || filter.search || filter.from || filter.to
  );

  return (
    <PageLayout userName={user?.name || 'Admin'}>
      <Box p="lg" className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Flex
          justify="between"
          gap="md"
          className="flex-col sm:flex-row items-start sm:items-center bg-base-100 p-6 rounded-2xl border border-base-200 dark:border-base-content/5 shadow-xs"
        >
          <Flex align="center" gap="sm">
            <Box className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <Icon name="ShieldCheck" size="md" />
            </Box>
            <Box>
              <Heading level={1} className="text-xl font-black text-base-content tracking-tight">
                Bitácora de Auditoría del Sistema
              </Heading>
              <Text size="xs" color="muted">
                Supervisión cronológica de acciones operativas, cancelaciones y movimientos sensibles
              </Text>
            </Box>
          </Flex>

          <Flex align="center" gap="xs">
            <SecondaryButton
              size="sm"
              onClick={() => fetchLogs()}
              disabled={loading}
              iconStart={<Icon name="RefreshCw" size="xs" className={loading ? 'animate-spin' : ''} />}
            >
              Actualizar
            </SecondaryButton>
          </Flex>
        </Flex>

        {/* Metric Cards */}
        <Grid cols={{ base: 1, sm: 3 }} gap="md">
          <Flex align="center" gap="sm" className="bg-base-100 p-4 rounded-xl border border-base-200 dark:border-base-content/5 shadow-xs">
            <Box className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="FileText" size="sm" />
            </Box>
            <Box>
              <Text className="text-2xl font-black text-base-content leading-none">{totalCount}</Text>
              <Text size="xs" color="muted" weight="bold" className="uppercase tracking-wider mt-1">
                Eventos Registrados
              </Text>
            </Box>
          </Flex>

          <Flex align="center" gap="sm" className="bg-base-100 p-4 rounded-xl border border-base-200 dark:border-base-content/5 shadow-xs">
            <Box className="w-10 h-10 rounded-lg bg-error/10 text-error flex items-center justify-center">
              <Icon name="AlertTriangle" size="sm" />
            </Box>
            <Box>
              <Text className="text-2xl font-black text-error leading-none">{criticalCount}</Text>
              <Text size="xs" color="muted" weight="bold" className="uppercase tracking-wider mt-1">
                Acciones Críticas / Cancelaciones
              </Text>
            </Box>
          </Flex>

          <Flex align="center" gap="sm" className="bg-base-100 p-4 rounded-xl border border-base-200 dark:border-base-content/5 shadow-xs">
            <Box className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center">
              <Icon name="Package" size="sm" />
            </Box>
            <Box>
              <Text className="text-2xl font-black text-base-content leading-none">{inventoryCount}</Text>
              <Text size="xs" color="muted" weight="bold" className="uppercase tracking-wider mt-1">
                Eventos de Inventario y Cajas
              </Text>
            </Box>
          </Flex>
        </Grid>

        {/* Filters Bar */}
        <Box className="bg-base-100 p-5 rounded-2xl border border-base-200 dark:border-base-content/5 shadow-xs space-y-4">
          <Grid cols={{ base: 1, sm: 2, lg: 5 }} gap="sm">
            <Box>
              <Text size="xs" weight="bold" color="muted" className="block mb-1">
                Módulo
              </Text>
              <Select
                size="sm"
                value={filter.module || 'all'}
                onChange={(e) => setFilter({ module: e.target.value === 'all' ? '' : e.target.value })}
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
            </Box>

            <Box>
              <Text size="xs" weight="bold" color="muted" className="block mb-1">
                Acción
              </Text>
              <Select
                size="sm"
                value={filter.action || 'all'}
                onChange={(e) => setFilter({ action: e.target.value === 'all' ? '' : e.target.value })}
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
            </Box>

            <Box>
              <Text size="xs" weight="bold" color="muted" className="block mb-1">
                Desde
              </Text>
              <TextInput
                type="date"
                size="sm"
                value={filter.from || ''}
                onChange={(e) => setFilter({ from: e.target.value })}
              />
            </Box>

            <Box>
              <Text size="xs" weight="bold" color="muted" className="block mb-1">
                Hasta
              </Text>
              <TextInput
                type="date"
                size="sm"
                value={filter.to || ''}
                onChange={(e) => setFilter({ to: e.target.value })}
              />
            </Box>

            <Box>
              <Text size="xs" weight="bold" color="muted" className="block mb-1">
                Búsqueda
              </Text>
              <TextInput
                size="sm"
                placeholder="Buscar por texto, folio o ID..."
                value={filter.search || ''}
                onChange={(e) => setFilter({ search: e.target.value })}
              />
            </Box>
          </Grid>

          {hasActiveFilters && (
            <Flex justify="end">
              <SecondaryButton
                size="xs"
                color="secondary"
                onClick={resetFilter}
                iconStart={<Icon name="X" size="xs" />}
              >
                Limpiar filtros
              </SecondaryButton>
            </Flex>
          )}
        </Box>

        {/* Table Section */}
        <Box className="bg-base-100 rounded-2xl border border-base-200 dark:border-base-content/5 shadow-xs overflow-hidden">
          {loading && (
            <Flex direction="col" align="center" justify="center" className="py-16 text-base-content/60">
              <Icon name="Loader2" size="lg" className="animate-spin text-primary mb-3" />
              <Text size="sm" weight="medium">
                Cargando registros de auditoría...
              </Text>
            </Flex>
          )}

          {error && (
            <Box p="lg">
              <Flex align="center" gap="sm" className="alert alert-error text-sm">
                <Icon name="AlertCircle" size="sm" />
                <Text>{error}</Text>
              </Flex>
            </Box>
          )}

          {!loading && !error && logs.length === 0 && (
            <Box className="text-center py-16 text-base-content/50">
              <Icon name="ShieldCheck" size="xl" className="mx-auto mb-3 opacity-30" />
              <Text weight="bold" className="text-base-content/70">
                No se encontraron eventos
              </Text>
              <Text size="xs" color="muted" className="mt-1">
                Prueba cambiando los criterios de filtro o la fecha
              </Text>
            </Box>
          )}

          {!loading && !error && logs.length > 0 && (
            <Box className="overflow-x-auto">
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
                        {formatAuditDate(log.createdAt)}
                      </td>
                      <td>
                        <Badge size="sm" className={`font-bold uppercase tracking-wider ${getAuditModuleBadgeColor(log.module)}`}>
                          {log.module}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={getAuditActionBadgeVariant(log.action)} size="sm">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="max-w-xs truncate font-medium text-base-content" title={log.description}>
                        {log.description}
                      </td>
                      <td className="whitespace-nowrap">
                        {log.performedBy ? (
                          <Box>
                            <Text weight="bold" className="text-base-content">{log.performedBy.name}</Text>
                            <Text size="xs" color="muted" className="capitalize">{log.performedBy.role}</Text>
                          </Box>
                        ) : (
                          <Text size="xs" color="muted" className="italic">Sistema</Text>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-base-content/70">
                        {typeof log.branch === 'object' && log.branch !== null ? log.branch.name : (log.branch || '—')}
                      </td>
                      <td className="font-mono text-[11px] text-base-content/60">
                        {log.targetFolio || (log.entityId ? log.entityId.slice(-6).toUpperCase() : '—')}
                      </td>
                      <td className="text-right">
                        <SecondaryButton
                          size="xs"
                          color="secondary"
                          onClick={() => setSelectedLog(log)}
                          iconStart={<Icon name="Eye" size="xs" />}
                        >
                          Ver
                        </SecondaryButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}
        </Box>

        {/* Technical Detail Modal */}
        {selectedLog && (
          <Modal
            isOpen={Boolean(selectedLog)}
            onClose={() => setSelectedLog(null)}
            title={`Detalle de Evento - ${selectedLog.action} (${selectedLog.module})`}
            maxWidth="max-w-2xl"
          >
            <Box className="space-y-4 text-xs">
              <Grid cols={{ base: 1, sm: 2 }} gap="sm" className="bg-base-200 p-3 rounded-xl">
                <Box>
                  <Text size="xs" weight="bold" color="muted" className="uppercase block">
                    Fecha
                  </Text>
                  <Text weight="semibold" className="font-mono">
                    {formatAuditDate(selectedLog.createdAt)}
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" weight="bold" color="muted" className="uppercase block">
                    Usuario
                  </Text>
                  <Text weight="semibold">
                    {selectedLog.performedBy?.name || 'Sistema'} ({selectedLog.performedBy?.role || 'N/A'})
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" weight="bold" color="muted" className="uppercase block">
                    Entidad Afectada
                  </Text>
                  <Text weight="semibold" className="font-mono">
                    {selectedLog.entityType || selectedLog.module} - {selectedLog.entityId || selectedLog.targetId || 'N/A'}
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" weight="bold" color="muted" className="uppercase block">
                    Folio
                  </Text>
                  <Text weight="semibold" className="font-mono">
                    {selectedLog.targetFolio || 'N/A'}
                  </Text>
                </Box>
              </Grid>

              <Box>
                <Text size="xs" weight="bold" color="muted" className="uppercase block mb-1">
                  Descripción
                </Text>
                <Box className="p-3 bg-base-200/60 rounded-xl">
                  <Text weight="medium" size="sm" className="text-base-content">
                    {selectedLog.description}
                  </Text>
                </Box>
              </Box>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <Box>
                  <Text size="xs" weight="bold" color="muted" className="uppercase block mb-1">
                    Metadata del Evento (JSON)
                  </Text>
                  <Box as="pre" className="p-3 bg-base-300 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </Box>
                </Box>
              )}

              <Flex justify="end" className="pt-2">
                <SecondaryButton
                  size="sm"
                  color="secondary"
                  onClick={() => setSelectedLog(null)}
                >
                  Cerrar
                </SecondaryButton>
              </Flex>
            </Box>
          </Modal>
        )}
      </Box>
    </PageLayout>
  );
};

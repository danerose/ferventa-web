import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuthStore } from '@/app/presentation/stores';
import { useMaintenanceStore, type MaintenanceScope } from '@/app/presentation/stores/maintenance/maintenance.store';
import { adminRepository, userRepository } from '@/core/di/container';
import type { AdminMaintenanceOrder, User } from '@/app/domain';
import {
  PageLayout,
  Icon,
  PrimaryButton,
  SecondaryButton,
  TertiaryButton,
  DirectReceptionModal,
  MaintenanceDetailDrawer,
  NotifyMaintenanceModal,
  LinkSaleModal,
  Box,
  Flex,
  Grid,
  Stack,
  Heading,
  Text,
  Badge,
  Select,
  TextInput,
  KbdBadge,
} from '@/app/presentation/components';
import {
  ServiceStatus,
  SERVICE_STATUS_COLORS,
  SERVICE_STATUS_LABELS,
  MODULE_THEMES,
} from '@/core';

const STATUS_OPTIONS = [
  { value: ServiceStatus.NotStarted, label: SERVICE_STATUS_LABELS[ServiceStatus.NotStarted] },
  { value: ServiceStatus.InProgress, label: SERVICE_STATUS_LABELS[ServiceStatus.InProgress] },
  { value: ServiceStatus.Completed, label: SERVICE_STATUS_LABELS[ServiceStatus.Completed] },
  { value: ServiceStatus.Delivered, label: SERVICE_STATUS_LABELS[ServiceStatus.Delivered] },
];

const SCOPE_TABS: { id: MaintenanceScope; label: string; icon: 'Wrench' | 'Clock' | 'Archive' }[] = [
  { id: 'active', label: 'En Taller / Activos', icon: 'Wrench' },
  { id: 'delivered_recent', label: 'Entregados Esta Semana', icon: 'Clock' },
  { id: 'history', label: 'Historial Completo', icon: 'Archive' },
];

const DATE_FIELD_OPTIONS = [
  { value: 'receptionDate', label: 'Fecha de Recepción' },
  { value: 'completedAt', label: 'Fecha de Terminado' },
  { value: 'deliveredAt', label: 'Fecha de Entrega' },
  { value: 'createdAt', label: 'Fecha de Creación' },
];

export const MaintenanceManagementPage: React.FC = () => {
  const { user, accessToken } = useAuthStore();
  const {
    maintenances,
    selectedOrder,
    activeScope,
    filters,
    loading,
    updatingId,
    error,
    setActiveScope,
    setSelectedOrder,
    setFilter,
    resetFilters,
    fetchMaintenances,
    updateMaintenanceStatus,
    updateMaintenanceLaborCost,
    addDiagnosticNote,
    notifyCustomer,
    linkMaintenanceSale,
    unlinkMaintenanceSale,
  } = useMaintenanceStore();

  const [usersList, setUsersList] = useState<User[]>([]);
  const [isDirectReceptionOpen, setIsDirectReceptionOpen] = useState(false);
  const [orderToNotify, setOrderToNotify] = useState<AdminMaintenanceOrder | null>(null);
  const [orderToLinkSale, setOrderToLinkSale] = useState<AdminMaintenanceOrder | null>(null);
  const [toasts, setToasts] = useState<{ id: number; type: 'success' | 'error'; message: string }[]>([]);

  const toastIdCounter = useRef(0);
  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    toastIdCounter.current += 1;
    const id = toastIdCounter.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  // Load initial data and users
  useEffect(() => {
    if (!accessToken) return;
    fetchMaintenances(accessToken, activeScope);
    userRepository.getUsers(accessToken).then(setUsersList).catch(() => {});
  }, [accessToken, activeScope, fetchMaintenances]);

  // Debounced search / filter reload
  useEffect(() => {
    if (!accessToken) return;
    const timer = setTimeout(() => {
      fetchMaintenances(accessToken, activeScope);
    }, 300);
    return () => clearTimeout(timer);
  }, [accessToken, activeScope, filters.search, filters.status, filters.from, filters.to, filters.dateField, fetchMaintenances]);

  // Global Keyboard shortcuts: Alt+W (Direct Reception), Alt+R (Refresh)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        setIsDirectReceptionOpen(true);
      } else if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        if (accessToken) fetchMaintenances(accessToken);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [accessToken, fetchMaintenances]);

  const handleDirectReceptionSuccess = (order: AdminMaintenanceOrder) => {
    addToast('success', `Vehículo recibido: ${order.vehicle.brand} ${order.vehicle.model}. Orden activa en taller.`);
    if (accessToken) fetchMaintenances(accessToken);
  };

  const assignableUsers = useMemo(() => {
    const mechs: { value: string; label: string }[] = [];
    const admins: { value: string; label: string }[] = [];

    usersList.forEach((u) => {
      if (u.isActive === false) return;
      const uid = u.id || (u as { _id?: string })._id;
      if (!uid) return;
      const roleStr = (typeof u.role === 'string' ? u.role : u.role?.name || '').toLowerCase();
      if (roleStr === 'mechanic' || roleStr === 'mecanico') {
        mechs.push({ value: uid, label: `${u.name} (Mecánico)` });
      } else if (roleStr === 'admin' || roleStr === 'administrator') {
        admins.push({ value: uid, label: `${u.name} (Admin)` });
      }
    });

    return [
      { value: '', label: 'Sin asignar' },
      ...mechs,
      ...admins,
    ];
  }, [usersList]);

  const handleAssignMechanic = async (orderId: string, mechanicId: string) => {
    if (!accessToken) return;
    try {
      await adminRepository.updateMaintenance(accessToken, orderId, {
        assignedMechanic: mechanicId || undefined,
      });
      addToast('success', 'Mecánico asignado correctamente.');
      fetchMaintenances(accessToken);
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error al asignar mecánico.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: AdminMaintenanceOrder['status']) => {
    if (!accessToken) return;
    const ok = await updateMaintenanceStatus(accessToken, id, newStatus);
    if (ok) {
      addToast('success', 'Estado de mantenimiento actualizado.');
      if (newStatus === ServiceStatus.Completed) {
        // Auto-open drawer for quick review and client notification
        const currentOrder = maintenances.find((m) => m.id === id);
        if (currentOrder) {
          setSelectedOrder({ ...currentOrder, status: ServiceStatus.Completed });
        }
      }
    } else {
      addToast('error', 'Error al actualizar estado.');
    }
  };

  const handleUpdateLaborCost = async (id: string, newCost: number) => {
    if (!accessToken) return;
    const ok = await updateMaintenanceLaborCost(accessToken, id, newCost);
    if (ok) {
      addToast('success', 'Costo de mano de obra actualizado correctamente.');
    } else {
      addToast('error', 'Error al actualizar costo de mano de obra.');
    }
  };

  const handleAddDiagnosticNote = async (id: string, noteText: string) => {
    if (!accessToken) return;
    const ok = await addDiagnosticNote(accessToken, id, noteText);
    if (ok) {
      addToast('success', 'Comentario agregado correctamente.');
    } else {
      addToast('error', 'Error al agregar comentario.');
    }
  };

  const handleConfirmNotify = async (customNotes?: string) => {
    if (!accessToken || !orderToNotify) return;
    const ok = await notifyCustomer(accessToken, orderToNotify.id, customNotes);
    if (ok) {
      addToast('success', 'Notificación registrada y cliente avisado.');
      setOrderToNotify(null);
    } else {
      addToast('error', 'Error al notificar al cliente.');
    }
  };

  const handleLinkSale = async (payload: { saleId?: string; folio?: string }) => {
    if (!accessToken || !orderToLinkSale) return;
    const ok = await linkMaintenanceSale(accessToken, orderToLinkSale.id, payload);
    if (ok) {
      addToast('success', 'Ticket de venta vinculado correctamente al mantenimiento.');
      setOrderToLinkSale(null);
    } else {
      addToast('error', 'Error al vincular el ticket de venta.');
    }
  };

  const handleUnlinkSale = async (id: string) => {
    if (!accessToken) return;
    const ok = await unlinkMaintenanceSale(accessToken, id);
    if (ok) {
      addToast('success', 'Ticket de venta desvinculado del mantenimiento.');
    } else {
      addToast('error', 'Error al desvincular ticket de venta.');
    }
  };

  // Status statistics calculation
  const stats = useMemo(() => {
    const active = maintenances.filter(
      (m) => m.status !== 'awaiting_appointment' && m.status !== ServiceStatus.Delivered
    );
    const notStarted = active.filter((m) => m.status === ServiceStatus.NotStarted).length;
    const inProgress = active.filter((m) => m.status === ServiceStatus.InProgress).length;
    const completed = active.filter((m) => m.status === ServiceStatus.Completed).length;
    const delivered = maintenances.filter((m) => m.status === ServiceStatus.Delivered).length;

    return {
      total: active.length,
      notStarted,
      inProgress,
      completed,
      delivered,
    };
  }, [maintenances]);

  // Order workflow sorting: NotStarted -> InProgress -> Completed -> Delivered
  const STATUS_WORKFLOW_ORDER: Record<string, number> = {
    [ServiceStatus.NotStarted]: 1,
    [ServiceStatus.InProgress]: 2,
    [ServiceStatus.Completed]: 3,
    [ServiceStatus.Delivered]: 4,
  };

  const sortedMaintenances = useMemo(() => {
    let list = maintenances;
    if (filters.status && filters.status !== 'all') {
      list = list.filter((m) => m.status === filters.status);
    }
    return [...list].sort((a, b) => {
      const weightA = STATUS_WORKFLOW_ORDER[a.status] || 99;
      const weightB = STATUS_WORKFLOW_ORDER[b.status] || 99;
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      const timeA = new Date(a.receptionDate || a.createdAt || 0).getTime();
      const timeB = new Date(b.receptionDate || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [maintenances, filters.status]);

  // Formatter for intake dates
  const formatIntakeDate = (dateStr?: string) => {
    if (!dateStr) return 'Reciente';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Progress detail helper
  const getProgressDetails = (status: string) => {
    switch (status) {
      case ServiceStatus.NotStarted:
        return { width: '0%', color: 'bg-base-300', label: 'Cola de espera' };
      case ServiceStatus.InProgress:
        return { width: '65%', color: 'bg-primary', label: '65% Completado' };
      case ServiceStatus.Completed:
        return { width: '100%', color: 'bg-success', label: 'Listo para entrega' };
      case ServiceStatus.Delivered:
        return { width: '100%', color: 'bg-info', label: 'Entregado al cliente' };
      default:
        return { width: '0%', color: 'bg-base-300', label: '' };
    }
  };

  const moduleMeta = MODULE_THEMES.workshop;

  return (
    <PageLayout userName={user?.name || 'Admin'}>
      {/* Topbar Search & Actions */}
      <Flex
        as="header"
        align="center"
        justify="between"
        className="h-16 px-6 bg-base-100 border-b border-base-300 shrink-0 z-10 gap-4"
      >
        <Box className="w-full max-w-md relative">
          <Box className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none z-10 flex items-center">
            <Icon name="Search" size="sm" />
          </Box>
          <TextInput
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="Buscar por serie, marca o cliente..."
            size="sm"
            className="pl-9"
          />
        </Box>

        <Flex align="center" gap="sm">
          <PrimaryButton
            size="sm"
            color="primary"
            onClick={() => setIsDirectReceptionOpen(true)}
            iconStart={<Icon name="Wrench" size="xs" />}
            title="Recepción Directa en Taller [Alt+W]"
          >
            <span>+ Recibir Vehículo (Walk-in)</span>
            <KbdBadge keys="Alt+W" className="ml-1 opacity-80" />
          </PrimaryButton>

          <TertiaryButton
            size="sm"
            onClick={() => accessToken && fetchMaintenances(accessToken)}
            title="Sincronizar órdenes"
          >
            <Icon name="RefreshCw" size="sm" className={loading ? 'animate-spin' : ''} />
          </TertiaryButton>
        </Flex>
      </Flex>

      {/* Scrollable Page Body */}
      <Box as="main" className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Header & Scope Tabs */}
        <Flex justify="between" align="end" className="flex-wrap gap-4">
          <Box>
            <Flex align="center" gap="sm" className="mb-1">
              <Box className={`w-8 h-8 rounded-DEFAULT ${moduleMeta.bgSoft} ${moduleMeta.text} flex items-center justify-center`}>
                <Icon name={moduleMeta.icon} size="sm" />
              </Box>
              <Heading level={2} className="font-bold tracking-tight">
                {moduleMeta.title}
              </Heading>
            </Flex>
            <Text variant="muted" size="sm">
              {moduleMeta.subtitle}
            </Text>
          </Box>

          {/* Scope Selector Tabs */}
          <Box className="bg-base-200 p-1 rounded-lg flex gap-1 border border-base-300">
            {SCOPE_TABS.map((tab) => {
              const isActive = activeScope === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveScope(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-base-100 text-primary shadow-xs'
                      : 'text-base-content/70 hover:text-base-content hover:bg-base-100/50'
                  }`}
                >
                  <Icon name={tab.icon} size="xs" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </Box>
        </Flex>

        {/* KPI Stats Grid - Interactive Filter Cards */}
        <Grid cols={{ base: 1, sm: 2, lg: 4 }} gap="md">
          {/* Total Vehiculos Activos */}
          <Box
            as="button"
            type="button"
            onClick={() => setFilter('status', 'all')}
            className={`w-full text-left p-4 rounded-DEFAULT border transition-all cursor-pointer shadow-xs ${
              filters.status === 'all' || !filters.status
                ? 'bg-primary/5 border-primary ring-2 ring-primary/40 shadow-sm'
                : 'bg-base-100 border-base-300 hover:border-primary/50 hover:bg-base-200/40'
            }`}
            title="Ver todos los vehículos activos"
          >
            <Flex align="center" gap="md">
              <Box className="w-11 h-11 rounded-DEFAULT bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon name="Gauge" size="md" />
              </Box>
              <Box>
                <Text size="xs" weight="bold" variant="muted" className="uppercase tracking-wider">
                  {activeScope === 'history' ? 'Todas las Órdenes' : 'Vehículos Activos'}
                </Text>
                <Heading level={3} className="text-2xl font-black tracking-tight mt-0.5">
                  {activeScope === 'history' ? maintenances.length : stats.total}
                </Heading>
              </Box>
            </Flex>
          </Box>

          {/* No Comenzado */}
          <Box
            as="button"
            type="button"
            onClick={() => setFilter('status', filters.status === ServiceStatus.NotStarted ? 'all' : ServiceStatus.NotStarted)}
            className={`w-full text-left p-4 rounded-DEFAULT border transition-all cursor-pointer shadow-xs ${
              filters.status === ServiceStatus.NotStarted
                ? 'bg-base-200 border-base-content/50 ring-2 ring-base-content/30 shadow-sm'
                : 'bg-base-100 border-base-300 hover:border-base-content/40 hover:bg-base-200/40'
            }`}
            title="Filtrar por No Comenzado"
          >
            <Flex align="center" gap="md">
              <Box className="w-11 h-11 rounded-DEFAULT bg-base-200 text-base-content/70 flex items-center justify-center shrink-0">
                <Icon name="Pause" size="md" />
              </Box>
              <Box>
                <Text size="xs" weight="bold" variant="muted" className="uppercase tracking-wider">
                  {SERVICE_STATUS_LABELS[ServiceStatus.NotStarted]}
                </Text>
                <Heading level={3} className="text-2xl font-black tracking-tight mt-0.5">
                  {stats.notStarted}
                </Heading>
              </Box>
            </Flex>
          </Box>

          {/* En Proceso */}
          <Box
            as="button"
            type="button"
            onClick={() => setFilter('status', filters.status === ServiceStatus.InProgress ? 'all' : ServiceStatus.InProgress)}
            className={`w-full text-left p-4 rounded-DEFAULT border transition-all cursor-pointer shadow-xs ${
              filters.status === ServiceStatus.InProgress
                ? 'bg-warning/10 border-warning ring-2 ring-warning/40 shadow-sm'
                : 'bg-base-100 border-base-300 hover:border-warning/50 hover:bg-warning/5'
            }`}
            title="Filtrar por En Proceso"
          >
            <Flex align="center" gap="md">
              <Box className="w-11 h-11 rounded-DEFAULT bg-warning/10 text-warning flex items-center justify-center shrink-0">
                <Icon name="Zap" size="md" />
              </Box>
              <Box>
                <Text size="xs" weight="bold" className="text-warning uppercase tracking-wider">
                  {SERVICE_STATUS_LABELS[ServiceStatus.InProgress]}
                </Text>
                <Heading level={3} className="text-2xl font-black tracking-tight text-warning mt-0.5">
                  {stats.inProgress}
                </Heading>
              </Box>
            </Flex>
          </Box>

          {/* Terminado / Listos */}
          <Box
            as="button"
            type="button"
            onClick={() => setFilter('status', filters.status === ServiceStatus.Completed ? 'all' : ServiceStatus.Completed)}
            className={`w-full text-left p-4 rounded-DEFAULT border transition-all cursor-pointer shadow-xs ${
              filters.status === ServiceStatus.Completed
                ? 'bg-success/10 border-success ring-2 ring-success/40 shadow-sm'
                : 'bg-base-100 border-base-300 hover:border-success/50 hover:bg-success/5'
            }`}
            title="Filtrar por Terminado / Listos para entrega"
          >
            <Flex align="center" gap="md">
              <Box className="w-11 h-11 rounded-DEFAULT bg-success/10 text-success flex items-center justify-center shrink-0">
                <Icon name="CheckCircle" size="md" />
              </Box>
              <Box>
                <Text size="xs" weight="bold" className="text-success uppercase tracking-wider">
                  {SERVICE_STATUS_LABELS[ServiceStatus.Completed]}
                </Text>
                <Heading level={3} className="text-2xl font-black tracking-tight text-success mt-0.5">
                  {stats.completed}
                </Heading>
              </Box>
            </Flex>
          </Box>
        </Grid>

        {/* History Scope Advanced Filters */}
        {activeScope === 'history' && (
          <Box bg="base-100" rounded="DEFAULT" className="p-4 border border-base-300 shadow-xs space-y-3">
            <Flex justify="between" align="center" className="flex-wrap gap-2">
              <Flex align="center" gap="xs">
                <Icon name="Filter" size="sm" className="text-primary" />
                <Text size="xs" weight="bold" variant="muted" className="uppercase tracking-wider">
                  Filtros de Búsqueda de Historial
                </Text>
              </Flex>
              <TertiaryButton size="xs" onClick={resetFilters}>
                Limpiar Filtros
              </TertiaryButton>
            </Flex>

            <Grid cols={{ base: 1, sm: 2, md: 4 }} gap="sm">
              <Box>
                <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
                  Campo de Fecha
                </Text>
                <Select
                  size="sm"
                  value={filters.dateField}
                  onChange={(e) => setFilter('dateField', e.target.value)}
                  options={DATE_FIELD_OPTIONS}
                />
              </Box>

              <Box>
                <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
                  Desde (Fecha inicial)
                </Text>
                <TextInput
                  type="date"
                  size="sm"
                  value={filters.from}
                  onChange={(e) => setFilter('from', e.target.value)}
                />
              </Box>

              <Box>
                <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
                  Hasta (Fecha final)
                </Text>
                <TextInput
                  type="date"
                  size="sm"
                  value={filters.to}
                  onChange={(e) => setFilter('to', e.target.value)}
                />
              </Box>

              <Box>
                <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
                  Estado del Servicio
                </Text>
                <Select
                  size="sm"
                  value={filters.status}
                  onChange={(e) => setFilter('status', e.target.value)}
                  options={[
                    { value: 'all', label: 'Todos los estados' },
                    ...STATUS_OPTIONS,
                  ]}
                />
              </Box>
            </Grid>
          </Box>
        )}

        {/* Service Cards Grid */}
        {loading ? (
          <Stack spacing="md">
            <Box bg="base-100" rounded="DEFAULT" className="h-36 border border-base-300 skeleton" />
            <Box bg="base-100" rounded="DEFAULT" className="h-36 border border-base-300 skeleton" />
          </Stack>
        ) : error ? (
          <Box bg="base-100" rounded="DEFAULT" className="border border-error/30 p-6 shadow-xs">
            <Flex align="center" justify="between" className="flex-wrap gap-3">
              <Flex align="center" gap="sm">
                <Icon name="AlertTriangle" size="md" className="text-error" />
                <Box>
                  <Heading level={4} className="text-error">
                    Error al cargar datos
                  </Heading>
                  <Text size="sm" variant="muted">
                    {error}
                  </Text>
                </Box>
              </Flex>
              <PrimaryButton size="sm" color="error" onClick={() => accessToken && fetchMaintenances(accessToken)}>
                Reintentar
              </PrimaryButton>
            </Flex>
          </Box>
        ) : sortedMaintenances.length === 0 ? (
          <Box bg="base-100" rounded="DEFAULT" className="border border-base-300 p-12 text-center">
            <Box className="w-14 h-14 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-3 text-base-content/40">
              <Icon name="Wrench" size="lg" />
            </Box>
            <Heading level={3} className="text-base font-bold mb-1">
              Sin órdenes en esta vista
            </Heading>
            <Text size="sm" variant="muted" className="max-w-sm mx-auto">
              {filters.search
                ? `No se encontraron mantenimientos para "${filters.search}"`
                : filters.status && filters.status !== 'all'
                ? `No hay órdenes en estado "${SERVICE_STATUS_LABELS[filters.status as ServiceStatus] || filters.status}".`
                : activeScope === 'delivered_recent'
                ? 'No hay vehículos entregados recientemente en esta semana.'
                : activeScope === 'history'
                ? 'No hay órdenes en el historial para los filtros seleccionados.'
                : 'No hay órdenes de mantenimiento activas en el taller.'}
            </Text>
          </Box>
        ) : (
          <Grid cols={{ base: 1, md: 2, lg: 3 }} gap="md">
            {sortedMaintenances.map((order) => {
              const sColor = SERVICE_STATUS_COLORS[order.status] || SERVICE_STATUS_COLORS[ServiceStatus.NotStarted];
              const progress = getProgressDetails(order.status);

              return (
                <Box
                  key={order.id}
                  bg="base-100"
                  rounded="DEFAULT"
                  className="border border-base-300 p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md"
                >
                  <Box>
                    {/* Status Badge & Actions */}
                    <Flex justify="between" align="center" className="mb-3">
                      <Badge
                        variant="soft"
                        color={sColor.badgeColor}
                        size="sm"
                        className="font-semibold"
                      >
                        {SERVICE_STATUS_LABELS[order.status] || order.status}
                      </Badge>
                      <Text size="xs" variant="mono" weight="semibold">
                        SERIE: {order.vehicle.serialNumberLastFour}
                      </Text>
                    </Flex>

                    {/* Vehicle Header */}
                    <Heading level={3} className="text-lg font-bold mb-1">
                      {order.vehicle.brand} {order.vehicle.model}
                    </Heading>

                    {/* Customer & Date info */}
                    <Stack spacing="xs" className="my-3">
                      <Flex align="center" gap="xs">
                        <Icon name="User" size="xs" className="text-base-content/50" />
                        <Text size="sm" weight="medium">
                          {order.customer.name}
                        </Text>
                      </Flex>
                      <Flex align="center" gap="xs">
                        <Icon name="Calendar" size="xs" className="text-base-content/50" />
                        <Text size="xs" variant="muted">
                          Recepción: {formatIntakeDate(order.receptionDate || order.createdAt)}
                        </Text>
                      </Flex>
                      <div className="mt-1">
                        <div className="bg-primary/10 border border-primary/20 rounded-md px-2.5 py-1 inline-flex items-center gap-1.5 max-w-full">
                          <Icon name="Wrench" size="xs" className="text-primary shrink-0" />
                          <span className="text-xs font-bold text-primary truncate">
                            {order.serviceRequested || 'Mantenimiento General'}
                          </span>
                        </div>
                      </div>
                    </Stack>

                    {/* Progress Bar */}
                    <Box className="pt-2 border-t border-base-200 my-3">
                      <Flex justify="between" align="center" className="mb-1">
                        <Text size="xs" variant="muted">
                          Avance
                        </Text>
                        <Text size="xs" weight="semibold">
                          {progress.label}
                        </Text>
                      </Flex>
                      <Box className="w-full bg-base-200 h-2 rounded-full overflow-hidden">
                        <Box
                          className={`h-full transition-all duration-500 rounded-full ${progress.color}`}
                          style={{ width: progress.width }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  {/* Card Actions */}
                  <Box className="pt-3 border-t border-base-200 mt-2 space-y-2">
                    <SecondaryButton
                      size="xs"
                      onClick={() => setSelectedOrder(order)}
                      className="w-full gap-1"
                      iconStart={<Icon name="ClipboardList" size="xs" />}
                    >
                      Ver Detalle
                    </SecondaryButton>

                    {/* Selects: Mechanic & Status */}
                    <Flex gap="sm" align="center">
                      <Box className="flex-1">
                        <Select
                          size="sm"
                          value={
                            typeof order.assignedMechanic === 'string'
                              ? order.assignedMechanic
                              : (order.assignedMechanic?.id || order.assignedMechanic?._id || (typeof order.mechanic === 'string' ? order.mechanic : (order.mechanic?.id || order.mechanic?._id)) || '')
                          }
                          onChange={(e) => handleAssignMechanic(order.id, e.target.value)}
                          options={assignableUsers}
                          title="Asignar mecánico o administrador"
                        />
                      </Box>

                      <Box className="flex-1">
                        <Select
                          size="sm"
                          value={order.status}
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as AdminMaintenanceOrder['status'])}
                          options={STATUS_OPTIONS}
                        />
                      </Box>
                    </Flex>
                  </Box>
                </Box>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* Maintenance Detail Drawer */}
      <MaintenanceDetailDrawer
        isOpen={selectedOrder !== null}
        order={selectedOrder}
        assignableUsers={assignableUsers}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
        onAssignMechanic={handleAssignMechanic}
        onAddDiagnosticNote={handleAddDiagnosticNote}
        onNotifyCustomer={(order) => setOrderToNotify(order)}
        onUpdateLaborCost={handleUpdateLaborCost}
        onLinkSale={(order) => setOrderToLinkSale(order)}
        onUnlinkSale={handleUnlinkSale}
      />

      {/* Notify Customer Modal */}
      <NotifyMaintenanceModal
        isOpen={orderToNotify !== null}
        order={orderToNotify}
        onClose={() => setOrderToNotify(null)}
        onConfirm={handleConfirmNotify}
        loading={loading}
      />

      {/* Link Sale POS Ticket Modal */}
      <LinkSaleModal
        isOpen={orderToLinkSale !== null}
        order={orderToLinkSale}
        onClose={() => setOrderToLinkSale(null)}
        onLink={handleLinkSale}
        loading={loading}
      />

      <DirectReceptionModal
        isOpen={isDirectReceptionOpen}
        onClose={() => setIsDirectReceptionOpen(false)}
        onSuccess={handleDirectReceptionSuccess}
      />

      {/* Floating Notifications */}
      <Box className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <Box
            key={toast.id}
            bg="neutral"
            rounded="DEFAULT"
            className="p-3.5 shadow-xl border border-neutral-content/20 pointer-events-auto flex items-center gap-2 text-xs font-semibold text-neutral-content animate-in fade-in"
          >
            <Icon
              name={toast.type === 'success' ? 'CheckCircle' : 'AlertCircle'}
              size="sm"
              className={toast.type === 'success' ? 'text-success' : 'text-error'}
            />
            {toast.message}
          </Box>
        ))}
      </Box>
    </PageLayout>
  );
};

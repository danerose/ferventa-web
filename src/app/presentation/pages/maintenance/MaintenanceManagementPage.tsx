import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/presentation/stores';
import { adminRepository, userRepository } from '@/core/di/container';
import type { AdminMaintenanceOrder, User } from '@/app/domain';
import {
  PageLayout,
  Icon,
  PrimaryButton,
  SecondaryButton,
  TertiaryButton,
  DirectReceptionModal,
  Modal,
  Box,
  Flex,
  Grid,
  Stack,
  Heading,
  Text,
  Badge,
  Select,
  TextInput,
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

const EVIDENCE_STAGE_OPTIONS = [
  { value: 'reception', label: 'Recepción' },
  { value: 'disassembly', label: 'Desarmado' },
  { value: 'maintenance', label: 'Reparación' },
  { value: 'completed', label: 'Finalizado' },
];

export const MaintenanceManagementPage: React.FC = () => {
  const { user, accessToken, clearAuth } = useAuthStore();
  const [maintenances, setMaintenances] = useState<AdminMaintenanceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Evidence modal state
  const [activeEvidenceOrder, setActiveEvidenceOrder] = useState<AdminMaintenanceOrder | null>(null);
  const [evidenceStage, setEvidenceStage] = useState<'reception' | 'disassembly' | 'maintenance' | 'completed'>('reception');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; type: 'success' | 'error'; message: string }[]>([]);

  const [usersList, setUsersList] = useState<User[]>([]);
  const [isDirectReceptionOpen, setIsDirectReceptionOpen] = useState(false);

  const navigate = useNavigate();
  const toastIdCounter = useRef(0);
  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    toastIdCounter.current += 1;
    const id = toastIdCounter.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const handleDirectReceptionSuccess = (order: AdminMaintenanceOrder) => {
    addToast('success', `Vehículo recibido: ${order.vehicle.brand} ${order.vehicle.model}. Orden activa en taller.`);
    fetchMaintenances();
  };

  const handleUnauthorized = () => {
    clearAuth();
    navigate('/login');
  };

  const fetchMaintenances = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminRepository.getMaintenances(accessToken);
      setMaintenances(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar mantenimientos';
      if (msg === 'UNAUTHORIZED') {
        handleUnauthorized();
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenances();
    if (accessToken) {
      userRepository.getUsers(accessToken).then(setUsersList).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

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
      setMaintenances((prev) =>
        prev.map((item) =>
          item.id === orderId ? { ...item, assignedMechanic: mechanicId || undefined } : item
        )
      );
      addToast('success', 'Mecánico asignado correctamente.');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error al asignar mecánico.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: AdminMaintenanceOrder['status']) => {
    if (!accessToken) return;
    setUpdatingId(id);
    try {
      await adminRepository.updateMaintenance(accessToken, id, { status: newStatus });
      setMaintenances((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
      );
      addToast('success', 'Estado de mantenimiento actualizado.');
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error al actualizar estado.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !activeEvidenceOrder || !selectedFiles || selectedFiles.length === 0) return;

    setUploadingEvidence(true);
    try {
      const filesArray = Array.from(selectedFiles);
      await adminRepository.uploadMaintenanceEvidence(accessToken, activeEvidenceOrder.id, evidenceStage, filesArray);

      addToast('success', 'Evidencia subida correctamente.');
      setSelectedFiles(null);

      // Reload order details to refresh evidence list
      const updatedOrder = await adminRepository.getMaintenances(accessToken);
      setMaintenances(updatedOrder);

      // Find and update active order in state
      const refreshedActive = updatedOrder.find((o) => o.id === activeEvidenceOrder.id);
      if (refreshedActive) {
        setActiveEvidenceOrder(refreshedActive);
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Error al subir la evidencia.');
    } finally {
      setUploadingEvidence(false);
    }
  };

  // Filtered maintenance list
  const filteredMaintenances = useMemo(() => {
    let list = maintenances.filter((m) => m.status !== 'awaiting_appointment');

    if (searchValue.trim()) {
      const q = searchValue.toLowerCase();
      list = list.filter(
        (m) =>
          m.customer.name.toLowerCase().includes(q) ||
          m.vehicle.brand.toLowerCase().includes(q) ||
          m.vehicle.model.toLowerCase().includes(q) ||
          m.vehicle.serialNumberLastFour.includes(q)
      );
    }
    return list;
  }, [maintenances, searchValue]);

  // Status statistics calculation
  const stats = useMemo(() => {
    const active = maintenances.filter(
      (m) => m.status !== 'awaiting_appointment' && m.status !== ServiceStatus.Delivered
    );
    const notStarted = active.filter((m) => m.status === ServiceStatus.NotStarted).length;
    const inProgress = active.filter((m) => m.status === ServiceStatus.InProgress).length;
    const completed = active.filter((m) => m.status === ServiceStatus.Completed).length;

    return {
      total: active.length,
      notStarted,
      inProgress,
      completed,
    };
  }, [maintenances]);

  // Formatter for creation dates
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
          className="h-16 px-6 bg-base-100 border-b border-base-300 shrink-0 z-10"
        >
          <Box className="w-full max-w-md relative">
            <Box className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none z-10 flex items-center">
              <Icon name="Search" size="sm" />
            </Box>
            <TextInput
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
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
            >
              + Recibir Vehículo (Walk-in)
            </PrimaryButton>

            <TertiaryButton
              size="sm"
              onClick={fetchMaintenances}
              title="Sincronizar órdenes"
            >
              <Icon name="RefreshCw" size="sm" className={loading ? 'animate-spin' : ''} />
            </TertiaryButton>
          </Flex>
        </Flex>

        {/* Scrollable Page Body */}
        <Box as="main" className="flex-1 overflow-y-auto p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header */}
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

          {/* KPI Stats Grid */}
          <Grid cols={{ base: 1, sm: 2, lg: 4 }} gap="md">
            {/* Total Vehiculos */}
            <Box bg="base-100" rounded="DEFAULT" className="border border-base-300 p-4 shadow-xs">
              <Flex align="center" gap="md">
                <Box className="w-11 h-11 rounded-DEFAULT bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon name="Gauge" size="md" />
                </Box>
                <Box>
                  <Text size="xs" weight="bold" variant="muted" className="uppercase tracking-wider">
                    Vehículos Activos
                  </Text>
                  <Heading level={3} className="text-2xl font-black tracking-tight mt-0.5">
                    {stats.total}
                  </Heading>
                </Box>
              </Flex>
            </Box>

            {/* No Comenzado */}
            <Box bg="base-100" rounded="DEFAULT" className="border border-base-300 p-4 shadow-xs">
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
            <Box bg="base-100" rounded="DEFAULT" className="border border-base-300 p-4 shadow-xs">
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

            {/* Terminado */}
            <Box bg="base-100" rounded="DEFAULT" className="border border-base-300 p-4 shadow-xs">
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

          {/* Service Cards Grid */}
          {loading ? (
            <Stack spacing="md">
              <Box bg="base-100" rounded="DEFAULT" className="h-32 border border-base-300 skeleton" />
              <Box bg="base-100" rounded="DEFAULT" className="h-32 border border-base-300 skeleton" />
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
                <PrimaryButton size="sm" color="error" onClick={fetchMaintenances}>
                  Reintentar
                </PrimaryButton>
              </Flex>
            </Box>
          ) : filteredMaintenances.length === 0 ? (
            <Box bg="base-100" rounded="DEFAULT" className="border border-base-300 p-12 text-center">
              <Box className="w-14 h-14 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-3 text-base-content/40">
                <Icon name="Wrench" size="lg" />
              </Box>
              <Heading level={3} className="text-base font-bold mb-1">
                Sin órdenes activas
              </Heading>
              <Text size="sm" variant="muted" className="max-w-sm mx-auto">
                {searchValue
                  ? `No se encontraron mantenimientos para "${searchValue}"`
                  : 'No hay órdenes de mantenimiento activas en el taller.'}
              </Text>
            </Box>
          ) : (
            <Grid cols={{ base: 1, md: 2, lg: 3 }} gap="md">
              {filteredMaintenances.map((order) => {
                const sColor = SERVICE_STATUS_COLORS[order.status] || SERVICE_STATUS_COLORS[ServiceStatus.NotStarted];
                const progress = getProgressDetails(order.status);

                return (
                  <Box
                    key={order.id}
                    bg="base-100"
                    rounded="DEFAULT"
                    className="border border-base-300 p-5 shadow-xs flex flex-col justify-between transition-shadow hover:shadow-md"
                  >
                    <Box>
                      {/* Status Badge */}
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
                            Ingreso: {formatIntakeDate(order.createdAt)}
                          </Text>
                        </Flex>
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

                    {/* Actions */}
                    <Flex gap="sm" align="center" className="pt-3 border-t border-base-200 mt-2">
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
                );
              })}
            </Grid>
          )}
        </Box>

      {/* Evidence Upload Modal */}
      <Modal
        isOpen={activeEvidenceOrder !== null}
        onClose={() => {
          setActiveEvidenceOrder(null);
          setSelectedFiles(null);
        }}
        title="Evidencia Fotográfica"
        maxWidth="650px"
      >
        {activeEvidenceOrder && (
          <Stack spacing="md">
            <Box>
              <Heading level={4} className="font-bold">
                {activeEvidenceOrder.vehicle.brand} {activeEvidenceOrder.vehicle.model}
              </Heading>
              <Text size="xs" variant="muted">
                Cliente: {activeEvidenceOrder.customer.name} | Serie: {activeEvidenceOrder.vehicle.serialNumberLastFour}
              </Text>
            </Box>

            {/* Existing Evidence List */}
            <Box className="border-t border-base-300 pt-4">
              <Text size="xs" weight="bold" variant="muted" className="uppercase tracking-wider mb-3">
                Fotos Guardadas
              </Text>

              {!activeEvidenceOrder.evidence || activeEvidenceOrder.evidence.length === 0 ? (
                <Box className="p-6 text-center bg-base-200 rounded-DEFAULT border border-dashed border-base-300">
                  <Text size="xs" variant="muted">
                    No hay fotos subidas para esta orden de servicio.
                  </Text>
                </Box>
              ) : (
                <Stack spacing="sm">
                  {activeEvidenceOrder.evidence.map((ev, idx) => (
                    <Box key={idx} bg="base-200" rounded="DEFAULT" className="p-3 border border-base-300">
                      <Badge variant="soft" color="warning" size="xs" className="uppercase font-bold mb-2">
                        Etapa: {ev.stage === 'reception' ? 'Recepción' : ev.stage === 'disassembly' ? 'Desarmado' : ev.stage === 'maintenance' ? 'Reparación' : 'Finalizado'}
                      </Badge>
                      <Grid cols={{ base: 2, sm: 3, md: 4 }} gap="xs">
                        {ev.photoUrls.map((url, uidx) => (
                          <Box
                            key={uidx}
                            as="a"
                            href={`${adminRepository.login.name === 'mock' ? '' : import.meta.env.VITE_API_URL || 'http://localhost:3000'}${url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-DEFAULT overflow-hidden h-20 border border-base-300 hover:opacity-80 transition-opacity"
                          >
                            <Box
                              as="img"
                              src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${url}`}
                              alt="Evidencia"
                              className="w-full h-full object-cover"
                            />
                          </Box>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

            {/* Upload Form */}
            <Box
              as="form"
              onSubmit={handleUploadEvidence}
              className="border-t border-base-300 pt-4 space-y-4"
            >
              <Text size="xs" weight="bold" variant="muted" className="uppercase tracking-wider">
                Subir Nueva Evidencia
              </Text>

              <Grid cols={{ base: 1, sm: 2 }} gap="md">
                <Box>
                  <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
                    Fase / Etapa
                  </Text>
                  <Select
                    size="sm"
                    value={evidenceStage}
                    onChange={(e) => setEvidenceStage(e.target.value as typeof evidenceStage)}
                    options={EVIDENCE_STAGE_OPTIONS}
                  />
                </Box>
                <Box>
                  <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
                    Archivos de Imagen (Máx. 5)
                  </Text>
                  <Box
                    as="input"
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSelectedFiles(e.target.files)}
                    className="file-input file-input-bordered file-input-sm w-full bg-base-100 text-base-content border-base-300 rounded-DEFAULT"
                  />
                </Box>
              </Grid>

              <Flex justify="end" gap="sm" className="pt-2">
                <SecondaryButton
                  size="sm"
                  type="button"
                  disabled={uploadingEvidence}
                  onClick={() => {
                    setActiveEvidenceOrder(null);
                    setSelectedFiles(null);
                  }}
                >
                  Cerrar
                </SecondaryButton>
                <PrimaryButton
                  size="sm"
                  color="primary"
                  type="submit"
                  disabled={uploadingEvidence || !selectedFiles || selectedFiles.length === 0}
                  loading={uploadingEvidence}
                >
                  Subir fotos
                </PrimaryButton>
              </Flex>
            </Box>
          </Stack>
        )}
      </Modal>

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

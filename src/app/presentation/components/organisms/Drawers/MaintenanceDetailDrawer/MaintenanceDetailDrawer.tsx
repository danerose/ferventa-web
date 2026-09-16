import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Stack,
  Text,
  Heading,
  Badge,
  PrimaryButton,
  SecondaryButton,
  TertiaryButton,
  Icon,
  Select,
  TextInput,
  Textarea,
  Grid,
  KbdBadge,
  Modal,
} from '@/app/presentation/components';
import {
  ServiceStatus,
  SERVICE_STATUS_COLORS,
  SERVICE_STATUS_LABELS,
  UserRole,
} from '@/core/enums';
import { useAuthorization } from '@/core/hooks';
import { EntityAuditLogsModal } from '@/app/presentation/components/organisms/Modals/EntityAuditLogsModal';
import type { AdminMaintenanceOrder, Sale } from '@/app/domain';
import { formatDate, formatCommentDate, formatDateTimeSplit, formatCurrency, formatWhatsAppUrl } from '@/core/utils';
import { useActiveBranch } from '@/app/presentation/hooks';
import { ServiceReceptionReceipt } from '@/app/presentation/components/molecules/Receipt/ServiceReceptionReceipt';
import { ServiceInvoiceReceipt } from '@/app/presentation/components/molecules/Receipt/ServiceInvoiceReceipt';
import { TicketReceipt } from '@/app/presentation/components/molecules/Receipt/TicketReceipt';
import { documentPrintService } from '@/core/services/print/documentPrintService';
import { thermalPrintService } from '@/core/services/print/ThermalPrintService';
import { usePrinterSettingsStore } from '@/app/presentation/stores';

export interface MaintenanceDetailDrawerProps {
  isOpen: boolean;
  order: AdminMaintenanceOrder | null;
  assignableUsers: { value: string; label: string }[];
  isMechanic?: boolean;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: AdminMaintenanceOrder['status']) => Promise<void>;
  onAssignMechanic: (id: string, mechanicId: string) => Promise<void>;
  onAddDiagnosticNote: (id: string, note: string) => Promise<void>;
  onNotifyCustomer: (order: AdminMaintenanceOrder) => void;
  onUpdateLaborCost?: (id: string, newCost: number) => Promise<void>;
  onLinkSale?: (order: AdminMaintenanceOrder) => void;
  onUnlinkSale?: (id: string) => Promise<void>;
}

export const MaintenanceDetailDrawer: React.FC<MaintenanceDetailDrawerProps> = ({
  isOpen,
  order,
  assignableUsers,
  isMechanic = false,
  onClose,
  onStatusChange,
  onAssignMechanic,
  onAddDiagnosticNote,
  onNotifyCustomer,
  onUpdateLaborCost,
  onLinkSale,
  onUnlinkSale,
}) => {
  const { activeBranchName } = useActiveBranch();
  const { hasRole } = useAuthorization();
  const isAdmin = hasRole([UserRole.Admin]);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [copiedFolio, setCopiedFolio] = useState(false);
  const [unlinkingSale, setUnlinkingSale] = useState(false);

  // Labor cost edit state
  const [editingLaborCost, setEditingLaborCost] = useState(false);
  const [laborCostValue, setLaborCostValue] = useState<number | string>('');
  const [savingLaborCost, setSavingLaborCost] = useState(false);
  const [showUnlinkConfirmModal, setShowUnlinkConfirmModal] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsAuditModalOpen(false);
    }
    if (order) {
      setLaborCostValue(order.laborCost ?? order.laborPrice ?? 0);
      setEditingLaborCost(false);
    }
  }, [isOpen, order]);

  useEffect(() => {
    if (!isOpen || !order) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, order, onClose]);

  if (!isOpen || !order) return null;

  const handleCopyFolio = () => {
    navigator.clipboard.writeText(order.id);
    setCopiedFolio(true);
    setTimeout(() => setCopiedFolio(false), 2000);
  };

  const handlePrintReception = () => {
    documentPrintService.printServiceReception(
      order,
      activeBranchName,
      typeof order.assignedMechanic === 'string'
        ? order.assignedMechanic
        : (order.assignedMechanic?.name || 'Taller')
    );
  };

  const handlePrintReceptionTicket = () => {
    thermalPrintService.printReceptionTicket(
      order,
      usePrinterSettingsStore.getState(),
      activeBranchName,
      typeof order.assignedMechanic === 'string'
        ? order.assignedMechanic
        : (order.assignedMechanic?.name || 'Taller')
    );
  };

  const handlePrintInvoice = () => {
    documentPrintService.printServiceInvoice();
  };

  const handlePrintTicket = () => {
    if (order.sale) {
      thermalPrintService.print({
        sale: order.sale as unknown as Sale,
        branchName: activeBranchName,
        sellerName: typeof order.assignedMechanic === 'string'
          ? order.assignedMechanic
          : (order.assignedMechanic?.name || 'Taller'),
        settings: usePrinterSettingsStore.getState(),
      });
    }
  };

  const handleAddNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsSubmittingNote(true);
    try {
      await onAddDiagnosticNote(order.id, newNote.trim());
      setNewNote('');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleNotifyClick = () => {
    onNotifyCustomer(order);
  };

  const handleStatusSelectChange = async (newStatus: AdminMaintenanceOrder['status']) => {
    setStatusUpdating(true);
    try {
      await onStatusChange(order.id, newStatus);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleSaveLaborCost = async () => {
    if (!onUpdateLaborCost) return;
    setSavingLaborCost(true);
    try {
      const num = Number(laborCostValue) || 0;
      await onUpdateLaborCost(order.id, num);
      setEditingLaborCost(false);
    } finally {
      setSavingLaborCost(false);
    }
  };

  const handleConfirmUnlinkSale = async () => {
    if (!onUnlinkSale || !order) return;
    setUnlinkingSale(true);
    try {
      await onUnlinkSale(order.id);
      setShowUnlinkConfirmModal(false);
    } finally {
      setUnlinkingSale(false);
    }
  };

  const sColor = SERVICE_STATUS_COLORS[order.status] || SERVICE_STATUS_COLORS[ServiceStatus.NotStarted];

  // WhatsApp quick link (empty message for direct chat)
  const waUrl = formatWhatsAppUrl(order.customer.phone) || undefined;

  // Milestone timeline calculation
  const timelineMilestones = [
    {
      key: 'reception',
      label: '1. Recepción',
      date: order.receptionDate || order.createdAt,
      completed: true,
      icon: 'ClipboardCheck' as const,
    },
    {
      key: 'workshop',
      label: '2. En Taller',
      date: order.startedAt,
      completed: order.status === ServiceStatus.InProgress || order.status === ServiceStatus.Completed || order.status === ServiceStatus.Delivered || !!order.startedAt,
      icon: 'Wrench' as const,
    },
    {
      key: 'completed',
      label: '3. Terminado',
      date: order.completedAt,
      completed: order.status === ServiceStatus.Completed || order.status === ServiceStatus.Delivered || !!order.completedAt,
      icon: 'CheckCircle' as const,
    },
    {
      key: 'notified',
      label: '4. Notificado',
      date: order.notifiedAt,
      completed: !!order.notifiedAt,
      icon: 'Bell' as const,
    },
    {
      key: 'delivered',
      label: '5. Entregado',
      date: order.deliveredAt,
      completed: order.status === ServiceStatus.Delivered || !!order.deliveredAt,
      icon: 'Car' as const,
    },
  ];

  return (
    <Box className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <Box
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over panel */}
      <Box className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <Box className="w-screen max-w-2xl bg-base-100 shadow-2xl flex flex-col border-l border-base-300">
          
          {/* HEADER */}
          <Box className="px-6 py-4 bg-base-200 border-b border-base-300 flex items-center justify-between">
            <Stack spacing="xs">
              <Flex align="center" gap="sm">
                <Badge variant="soft" color={sColor.badgeColor} size="sm" className="font-bold">
                  {SERVICE_STATUS_LABELS[order.status] || order.status}
                </Badge>
                <SecondaryButton
                  size="xs"
                  onClick={handleCopyFolio}
                  className="py-0.5 px-2 text-xs flex items-center gap-1"
                  title="Copiar ID de Orden"
                >
                  <Icon name={copiedFolio ? 'Check' : 'Copy'} size="xs" />
                  <span className="font-mono text-[11px]">{copiedFolio ? '¡Copiado!' : `ID: ${order.id.slice(-6).toUpperCase()}`}</span>
                </SecondaryButton>
                <SecondaryButton
                  size="xs"
                  onClick={handlePrintReception}
                  className="py-0.5 px-2 text-xs flex items-center gap-1"
                  title="Imprimir Comprobante Formal de Recepción (Hoja Carta)"
                >
                  <Icon name="FileText" size="xs" />
                  <span className="text-[11px] font-semibold">Hoja Recepción</span>
                </SecondaryButton>
                <SecondaryButton
                  size="xs"
                  onClick={handlePrintReceptionTicket}
                  className="py-0.5 px-2 text-xs flex items-center gap-1"
                  title="Imprimir Ticket Térmico de Recepción (58mm/80mm)"
                >
                  <Icon name="Printer" size="xs" />
                  <span className="text-[11px] font-semibold">Ticket Recepción</span>
                </SecondaryButton>
                {isAdmin && (
                  <SecondaryButton
                    size="xs"
                    onClick={() => setIsAuditModalOpen(true)}
                    className="py-0.5 px-2 text-xs flex items-center gap-1 text-primary hover:bg-primary/10"
                    title="Consultar bitácora de auditoría de esta orden"
                  >
                    <Icon name="ShieldCheck" size="xs" />
                    <span className="text-[11px] font-semibold">Auditoría</span>
                  </SecondaryButton>
                )}
              </Flex>
              <Heading level={3} className="text-lg font-black text-base-content tracking-tight">
                {order.vehicle.brand} {order.vehicle.model} {order.vehicle.year ? `(${order.vehicle.year})` : ''}
              </Heading>
              <Text size="xs" variant="muted">
                Serie: <span className="font-mono font-bold text-base-content">{order.vehicle.serialNumberLastFour}</span>
                {order.vehicle.licensePlate && ` • Placas: ${order.vehicle.licensePlate}`}
              </Text>
            </Stack>

            <Flex align="center" gap="xs">
              <KbdBadge keys="Esc" className="opacity-70 text-[10px]" />
              <TertiaryButton
                size="sm"
                onClick={onClose}
                className="btn-circle btn-ghost"
                title="Cerrar panel (Esc)"
              >
                <Icon name="X" size="md" />
              </TertiaryButton>
            </Flex>
          </Box>

          {/* SCROLLABLE BODY */}
          <Box className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* MILESTONE TIMELINE */}
            <Box bg="base-200" rounded="DEFAULT" className="p-4 border border-base-300">
              <Text size="xs" weight="bold" variant="muted" className="uppercase tracking-wider mb-3">
                Línea de Tiempo del Servicio
              </Text>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 relative">
                {timelineMilestones.map((m) => {
                  const isDone = m.completed;
                  const dateInfo = m.date ? formatDateTimeSplit(m.date) : null;
                  return (
                    <div
                      key={m.key}
                      className={`flex flex-col items-center text-center p-2 rounded-lg border transition-all ${
                        isDone
                          ? 'bg-base-100 border-success/40 text-base-content shadow-xs'
                          : 'bg-base-200/50 border-base-300 text-base-content/40 opacity-70'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 text-xs font-bold ${
                          isDone
                            ? 'bg-success text-success-content ring-2 ring-success/20'
                            : 'bg-base-300 text-base-content/50'
                        }`}
                      >
                        <Icon name={m.icon} size="xs" />
                      </div>
                      {/* Fila 1: Título */}
                      <span className="text-[11px] font-bold leading-tight line-clamp-1">
                        {m.label}
                      </span>
                      {/* Fila 2: Mes, Día y Año */}
                      <span className="text-[10px] text-base-content/70 mt-1 font-mono leading-tight">
                        {dateInfo?.dateStr ? dateInfo.dateStr : 'Pendiente'}
                      </span>
                      {/* Fila 3: Hora AM/PM */}
                      {dateInfo?.timeStr ? (
                        <span className="text-[10px] font-semibold text-primary font-mono leading-tight mt-0.5">
                          {dateInfo.timeStr}
                        </span>
                      ) : (
                        <span className="text-[10px] text-base-content/30 font-mono leading-tight mt-0.5">-</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Box>

            {/* QUICK CONTROLS: Status & Assigned Mechanic */}
            <Box bg="base-100" rounded="DEFAULT" className="p-4 border border-base-300 shadow-xs space-y-4">
              <Text size="xs" weight="bold" variant="muted" className="uppercase tracking-wider">
                Control de Estado & Asignación
              </Text>

              <Grid cols={{ base: 1, sm: 2 }} gap="md">
                <Box>
                  <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
                    Estado Actual
                  </Text>
                  <Select
                    size="sm"
                    value={order.status}
                    disabled={statusUpdating || (isMechanic && order.status === ServiceStatus.Delivered)}
                    onChange={(e) => handleStatusSelectChange(e.target.value as AdminMaintenanceOrder['status'])}
                    options={[
                      { value: ServiceStatus.NotStarted, label: SERVICE_STATUS_LABELS[ServiceStatus.NotStarted] },
                      { value: ServiceStatus.InProgress, label: SERVICE_STATUS_LABELS[ServiceStatus.InProgress] },
                      { value: ServiceStatus.Completed, label: SERVICE_STATUS_LABELS[ServiceStatus.Completed] },
                      { value: ServiceStatus.Delivered, label: SERVICE_STATUS_LABELS[ServiceStatus.Delivered] },
                    ]}
                  />
                  {isMechanic && order.status === ServiceStatus.Delivered && (
                    <span className="text-[10px] text-warning mt-1 block font-medium">
                      Orden entregada. Estado bloqueado para mecánicos.
                    </span>
                  )}
                </Box>

                <Box>
                  <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
                    Mecánico Asignado
                  </Text>
                  {isMechanic ? (
                    <Box className="p-2 bg-base-100 rounded border border-base-300 text-xs font-semibold text-base-content">
                      {typeof order.assignedMechanic === 'string'
                        ? order.assignedMechanic
                        : (order.assignedMechanic?.name || (typeof order.mechanic === 'string' ? order.mechanic : order.mechanic?.name) || 'Asignado a ti')}
                    </Box>
                  ) : (
                    <Select
                      size="sm"
                      value={
                        typeof order.assignedMechanic === 'string'
                          ? order.assignedMechanic
                          : (order.assignedMechanic?.id || order.assignedMechanic?._id || (typeof order.mechanic === 'string' ? order.mechanic : (order.mechanic?.id || order.mechanic?._id)) || '')
                      }
                      onChange={(e) => onAssignMechanic(order.id, e.target.value)}
                      options={assignableUsers}
                    />
                  )}
                </Box>
              </Grid>
            </Box>

            {/* CUSTOMER & VEHICLE INFO */}
            <Grid cols={{ base: 1, sm: 2 }} gap="md">
              {/* Customer */}
              <Box bg="base-200" rounded="DEFAULT" className="p-4 border border-base-300 flex flex-col justify-between">
                <div>
                  <Flex justify="between" align="center" className="mb-2">
                    <Flex align="center" gap="xs" className="text-primary">
                      <Icon name="User" size="sm" />
                      <Text size="xs" weight="bold" className="uppercase tracking-wider text-base-content">
                        Cliente
                      </Text>
                    </Flex>

                    {/* Notify Customer Button */}
                    {!isMechanic && (order.status === ServiceStatus.Completed || order.status === ServiceStatus.Delivered || order.notifiedAt) && (
                      <PrimaryButton
                        size="xs"
                        color="info"
                        onClick={handleNotifyClick}
                        iconStart={<Icon name="Bell" size="xs" />}
                        className="py-1 px-2 text-[11px] font-bold"
                      >
                        {order.notifiedAt ? 'Re-notificar' : 'Avisar al Cliente'}
                      </PrimaryButton>
                    )}
                  </Flex>

                  <Text size="sm" weight="bold" className="text-base-content">
                    {order.customer.name}
                  </Text>
                  {order.customer.phone && (
                    <Flex align="center" gap="xs" className="mt-1 flex-wrap">
                      <Text size="xs" variant="muted" className="font-mono">
                        {order.customer.phone}
                      </Text>
                      {!isMechanic && waUrl && (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-xs btn-ghost text-success hover:bg-success/10 gap-1 px-1.5 h-6 min-h-6"
                          title="Abrir chat de WhatsApp"
                        >
                          <Icon name="MessageSquare" size="xs" />
                          <span className="text-[10px] font-bold">WhatsApp</span>
                        </a>
                      )}
                    </Flex>
                  )}
                  {order.customer.email && (
                    <Text size="xs" variant="muted" className="block mt-0.5">
                      {order.customer.email}
                    </Text>
                  )}
                </div>

                {order.notifiedAt && (
                  <Box className="mt-2.5 pt-2 border-t border-base-300/60">
                    <Badge variant="soft" color="info" size="xs" className="gap-1">
                      <Icon name="Check" size="xs" />
                      {Array.isArray((order as any).notificationHistory) && (order as any).notificationHistory.length > 1
                        ? `Notificado ${(order as any).notificationHistory.length} veces (Último: ${formatCommentDate(order.notifiedAt)})`
                        : `Notificado (${formatCommentDate(order.notifiedAt)})`}
                    </Badge>
                  </Box>
                )}
              </Box>

              {/* Service & Labor Cost */}
              <Box bg="base-200" rounded="DEFAULT" className="p-4 border border-base-300">
                <Flex align="center" gap="xs" className="mb-2 text-warning">
                  <Icon name="Wrench" size="sm" />
                  <Text size="xs" weight="bold" className="uppercase tracking-wider text-base-content">
                    Servicio Solicitado
                  </Text>
                </Flex>
                <Text size="sm" weight="medium" className="text-base-content">
                  {order.serviceRequested || 'Mantenimiento General'}
                </Text>
                
                <Box className="mt-2 pt-2 border-t border-base-300/60">
                  <Flex justify="between" align="center" className="mb-1">
                    <Text size="xs" variant="muted" weight="semibold">
                      Mano de Obra
                    </Text>
                    {!isMechanic && !editingLaborCost && onUpdateLaborCost && (
                      <TertiaryButton
                        size="xs"
                        className="h-6 min-h-6 px-1.5 text-primary gap-1"
                        onClick={() => {
                          setLaborCostValue(order.laborCost ?? order.laborPrice ?? 0);
                          setEditingLaborCost(true);
                        }}
                      >
                        <Icon name="Edit3" size="xs" />
                        <span className="text-[10px]">Editar</span>
                      </TertiaryButton>
                    )}
                  </Flex>

                  {editingLaborCost ? (
                    <Box className="space-y-2">
                      <TextInput
                        type="number"
                        min="0"
                        step="10"
                        size="sm"
                        value={laborCostValue}
                        onChange={(e) => setLaborCostValue(e.target.value)}
                        placeholder="0.00"
                        autoFocus
                      />
                      <Flex justify="end" gap="xs">
                        <TertiaryButton
                          size="xs"
                          className="h-6 min-h-6 px-2 text-[10px]"
                          disabled={savingLaborCost}
                          onClick={() => {
                            setLaborCostValue(order.laborCost ?? order.laborPrice ?? 0);
                            setEditingLaborCost(false);
                          }}
                        >
                          Cancelar
                        </TertiaryButton>
                        <PrimaryButton
                          size="xs"
                          color="primary"
                          className="h-6 min-h-6 px-2 text-[10px]"
                          loading={savingLaborCost}
                          onClick={handleSaveLaborCost}
                        >
                          Guardar
                        </PrimaryButton>
                      </Flex>
                    </Box>
                  ) : (
                    <Text size="xs" className="font-bold text-base-content">
                      {order.laborCost || order.laborPrice ? formatCurrency(order.laborCost || order.laborPrice || 0) : 'Por cotizar'}
                    </Text>
                  )}
                </Box>
              </Box>
            </Grid>

            {/* SEPARATED NOTES SECTION */}
            <Stack spacing="sm">
              {/* Motivo de la Cita (notes) */}
              {order.notes && (
                <Box bg="base-200" rounded="DEFAULT" className="p-4 border border-base-300">
                  <Flex align="center" gap="xs" className="mb-1.5 text-primary">
                    <Icon name="FileText" size="sm" />
                    <Text size="xs" weight="bold" className="uppercase tracking-wider text-base-content">
                      Motivo / Notas de la Cita (Cliente)
                    </Text>
                  </Flex>
                  <Text size="xs" className="italic text-base-content/90 leading-relaxed bg-base-100 p-2.5 rounded border border-base-300/50">
                    "{order.notes}"
                  </Text>
                </Box>
              )}

              {/* Notas de Recepción / Inventario Físico (receptionNotes) */}
              {order.receptionNotes && (
                <Box bg="base-200" rounded="DEFAULT" className="p-4 border border-base-300">
                  <Flex align="center" gap="xs" className="mb-1.5 text-secondary">
                    <Icon name="Key" size="sm" />
                    <Text size="xs" weight="bold" className="uppercase tracking-wider text-base-content">
                      Notas de Recepción / Inventario Físico
                    </Text>
                  </Flex>
                  <Text size="xs" className="text-base-content/90 leading-relaxed bg-base-100 p-2.5 rounded border border-base-300/50">
                    {order.receptionNotes}
                  </Text>
                </Box>
              )}
            </Stack>

            {/* POS SALE TICKET SECTION */}
            <Box bg="base-100" rounded="DEFAULT" className="p-4 border border-base-300 shadow-xs space-y-3">
              <Flex justify="between" align="center">
                <Flex align="center" gap="xs">
                  <Icon name="Receipt" size="sm" className="text-primary" />
                  <Text size="xs" weight="bold" variant="muted" className="uppercase tracking-wider">
                    Ticket de Venta / Cobro (POS)
                  </Text>
                </Flex>
                {order.sale && (
                  <Badge variant="soft" color="success" size="xs" className="gap-1">
                    <Icon name="Check" size="xs" />
                    Cobrado
                  </Badge>
                )}
              </Flex>

              {order.sale ? (
                <Box bg="base-200" rounded="DEFAULT" className="p-3 border border-base-300 space-y-2">
                  <Flex justify="between" align="start">
                    <Box>
                      <Flex align="center" gap="xs">
                        <span className="font-mono font-bold text-sm text-base-content">
                          #{order.sale.folio}
                        </span>
                        <Badge variant="soft" color="primary" size="xs">
                          {order.sale.paymentMethod || 'Efectivo'}
                        </Badge>
                      </Flex>
                      <Text size="xs" variant="muted" className="mt-0.5">
                        Cajero / Vendedor:{' '}
                        <span className="font-medium text-base-content/90">
                          {typeof order.sale.seller === 'string'
                            ? order.sale.seller
                            : order.sale.seller?.name || 'Caja'}
                        </span>
                      </Text>
                      {order.sale.createdAt && (
                        <Text size="xs" variant="muted" className="text-[10px] font-mono">
                          {formatDate(order.sale.createdAt)}
                        </Text>
                      )}
                    </Box>

                    <Box className="text-right flex flex-col items-end gap-1">
                      <Text size="md" weight="bold" className="text-primary font-mono text-base font-black">
                        {formatCurrency(order.sale.total || 0)}
                      </Text>
                      <Flex align="center" gap="xs" className="mt-0.5">
                        <TertiaryButton
                          size="xs"
                          className="h-6 min-h-6 px-1.5 text-primary hover:bg-primary/10 text-[10px] gap-1"
                          onClick={handlePrintTicket}
                          title="Imprimir ticket térmico de la venta"
                        >
                          <Icon name="Printer" size="xs" />
                          <span>Ticket</span>
                        </TertiaryButton>
                        <TertiaryButton
                          size="xs"
                          className="h-6 min-h-6 px-1.5 text-primary hover:bg-primary/10 text-[10px] gap-1"
                          onClick={handlePrintInvoice}
                          title="Imprimir factura / hoja de cobro del taller"
                        >
                          <Icon name="FileText" size="xs" />
                          <span>Factura / Hoja</span>
                        </TertiaryButton>
                        {!isMechanic && onUnlinkSale && (
                          <TertiaryButton
                            size="xs"
                            className="h-6 min-h-6 px-1.5 text-error hover:bg-error/10 text-[10px] gap-1"
                            disabled={unlinkingSale}
                            onClick={() => setShowUnlinkConfirmModal(true)}
                            title="Desvincular ticket de este mantenimiento"
                          >
                            <Icon name="Trash2" size="xs" />
                            <span>Desvincular</span>
                          </TertiaryButton>
                        )}
                      </Flex>
                    </Box>
                  </Flex>

                  {/* Items summary */}
                  {order.sale.items && order.sale.items.length > 0 && (
                    <Box className="pt-2 border-t border-base-300/60 space-y-1">
                      <Text size="xs" weight="bold" variant="muted" className="text-[10px] uppercase">
                        Detalle de Artículos / Servicios Cobrados ({order.sale.items.length})
                      </Text>
                      <Stack spacing="xs" className="max-h-32 overflow-y-auto pr-1">
                        {order.sale.items.map((item, idx) => (
                          <Flex key={idx} justify="between" align="center" className="text-xs bg-base-100 p-1.5 rounded border border-base-300/50">
                            <Text size="xs" className="font-medium text-base-content truncate">
                              {item.quantity}x {item.name || (item as { productName?: string }).productName || 'Concepto'}
                            </Text>
                            <span className="font-mono text-[11px] font-semibold text-base-content/80 shrink-0 ml-2">
                              {formatCurrency((item.priceSnapshot || 0) * item.quantity)}
                            </span>
                          </Flex>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box className="p-4 bg-base-200/50 rounded-DEFAULT border border-dashed border-base-300 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Box className="text-center sm:text-left">
                    <Text size="xs" weight="semibold" className="text-base-content">
                      No hay ticket de venta vinculado
                    </Text>
                    <Text size="xs" variant="muted" className="text-[11px]">
                      Asocia el ticket de cobro emitido en el Punto de Venta (POS) para refacciones y mano de obra.
                    </Text>
                  </Box>
                  {!isMechanic && onLinkSale && (
                    <PrimaryButton
                      size="xs"
                      color="primary"
                      className="shrink-0"
                      onClick={() => onLinkSale(order)}
                      iconStart={<Icon name="Link" size="xs" />}
                    >
                      Vincular Ticket POS
                    </PrimaryButton>
                  )}
                </Box>
              )}
            </Box>

            {/* WHATSAPP NOTIFICATIONS LOG (CUMULATIVE) */}
            <Box bg="base-100" rounded="DEFAULT" className="p-4 border border-base-300 shadow-xs space-y-3">
              <Flex justify="between" align="center">
                <Flex align="center" gap="xs">
                  <Icon name="Bell" size="sm" className="text-info" />
                  <Text size="xs" weight="bold" variant="muted" className="uppercase tracking-wider">
                    Historial de Notificaciones WhatsApp
                  </Text>
                </Flex>
                <Badge variant="soft" color="info" size="xs">
                  {order.notifications?.length || (order.notifiedAt ? 1 : 0)} enviada(s)
                </Badge>
              </Flex>

              {(!order.notifications || order.notifications.length === 0) && !order.notifiedAt ? (
                <Box className="p-4 text-center bg-base-200/50 rounded-DEFAULT border border-dashed border-base-300">
                  <Text size="xs" variant="muted">
                    No se han registrado notificaciones enviadas al cliente aún.
                  </Text>
                </Box>
              ) : (
                <Stack spacing="xs" className="max-h-48 overflow-y-auto pr-1">
                  {order.notifications && order.notifications.length > 0 ? (
                    order.notifications.map((notif, nIdx) => (
                      <Box
                        key={nIdx}
                        bg="base-200"
                        rounded="DEFAULT"
                        className="p-2.5 border border-base-300 text-xs space-y-1"
                      >
                        <Flex justify="between" align="center">
                          <Flex align="center" gap="xs">
                            <span className="w-2 h-2 rounded-full bg-success inline-block" />
                            <Text size="xs" weight="bold" className="text-base-content">
                              {notif.sentBy?.name || 'Sistema'}
                            </Text>
                            <Badge variant="soft" color="success" size="xs">
                              WhatsApp
                            </Badge>
                          </Flex>
                          <Text size="xs" variant="muted" className="font-mono text-[10px]">
                            {formatCommentDate(notif.sentAt)}
                          </Text>
                        </Flex>
                        {notif.notes && (
                          <Text size="xs" className="text-base-content/80 pl-3 border-l-2 border-success/40">
                            {notif.notes}
                          </Text>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Box bg="base-200" rounded="DEFAULT" className="p-2.5 border border-base-300 text-xs space-y-1">
                      <Flex justify="between" align="center">
                        <Flex align="center" gap="xs">
                          <span className="w-2 h-2 rounded-full bg-success inline-block" />
                          <Text size="xs" weight="bold" className="text-base-content">
                            Aviso de Estado
                          </Text>
                          <Badge variant="soft" color="success" size="xs">WhatsApp</Badge>
                        </Flex>
                        <Text size="xs" variant="muted" className="font-mono text-[10px]">
                          {formatCommentDate(order.notifiedAt!)}
                        </Text>
                      </Flex>
                      <Text size="xs" className="text-base-content/80 pl-3 border-l-2 border-success/40">
                        Cliente notificado sobre avance del vehículo.
                      </Text>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>

            {/* MECHANIC COMMENTS & WORKSHOP NOTES */}
            <Box bg="base-100" rounded="DEFAULT" className="p-4 border border-base-300 shadow-xs space-y-4">
              <Flex justify="between" align="center">
                <Flex align="center" gap="xs">
                  <Icon name="MessageSquareText" size="sm" className="text-primary" />
                  <Text size="xs" weight="bold" variant="muted" className="uppercase tracking-wider">
                    Comentarios y Notas del Mecánico
                  </Text>
                </Flex>
                <Badge variant="soft" color="neutral" size="xs">
                  {order.diagnosticNotes?.length || 0} {order.diagnosticNotes?.length === 1 ? 'comentario' : 'comentarios'}
                </Badge>
              </Flex>

              {/* Comments List */}
              {!order.diagnosticNotes || order.diagnosticNotes.length === 0 ? (
                <Box className="p-4 text-center bg-base-200/50 rounded-DEFAULT border border-dashed border-base-300">
                  <Text size="xs" variant="muted">
                    No hay comentarios del equipo técnico registrados aún.
                  </Text>
                </Box>
              ) : (
                <Stack spacing="xs" className="max-h-60 overflow-y-auto pr-1">
                  {order.diagnosticNotes.map((dNote, idx) => (
                    <Box
                      key={idx}
                      bg="base-200"
                      rounded="DEFAULT"
                      className="p-3 border border-base-300 space-y-1"
                    >
                      <Flex justify="between" align="center">
                        <Flex align="center" gap="xs">
                          <Icon name="UserCheck" size="xs" className="text-primary" />
                          <Text size="xs" weight="bold" className="text-base-content">
                            {dNote.createdBy?.name || 'Mecánico'}
                          </Text>
                        </Flex>
                        <Text size="xs" variant="muted" className="font-mono text-[10px]">
                          {formatCommentDate(dNote.createdAt)}
                        </Text>
                      </Flex>
                      <Text size="xs" className="text-base-content/90 whitespace-pre-wrap leading-relaxed">
                        {dNote.note}
                      </Text>
                    </Box>
                  ))}
                </Stack>
              )}

              {/* Add Comment Form */}
              <Box as="form" onSubmit={handleAddNoteSubmit} className="pt-2 border-t border-base-200 space-y-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Ej. Encontré desgaste en balatas traseras, hay que pedir repuesto... / Se realizó cambio de filtro y aceite."
                  rows={2}
                  className="w-full text-xs"
                />
                <Flex justify="end">
                  <PrimaryButton
                    size="xs"
                    color="primary"
                    type="submit"
                    disabled={!newNote.trim() || isSubmittingNote}
                    loading={isSubmittingNote}
                    iconStart={<Icon name="Plus" size="xs" />}
                  >
                    Agregar Comentario
                  </PrimaryButton>
                </Flex>
              </Box>
            </Box>

          </Box>

          {/* FOOTER */}
          <Box className="px-4 sm:px-6 py-3 bg-base-200 border-t border-base-300 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <SecondaryButton
                size="sm"
                onClick={handlePrintReception}
                iconStart={<Icon name="FileText" size="xs" />}
                className="text-xs py-1.5 flex-1 sm:flex-initial justify-center"
                title="Imprimir comprobante formal e inventario de recepción en hoja Carta"
              >
                Hoja Recepción
              </SecondaryButton>

              <SecondaryButton
                size="sm"
                onClick={handlePrintReceptionTicket}
                iconStart={<Icon name="Printer" size="xs" />}
                className="text-xs py-1.5 flex-1 sm:flex-initial justify-center"
                title="Imprimir ticket térmico de recepción (58mm/80mm)"
              >
                Ticket Recepción
              </SecondaryButton>

              <SecondaryButton
                size="sm"
                onClick={handlePrintInvoice}
                iconStart={<Icon name="FileText" size="xs" />}
                className="text-xs py-1.5 flex-1 sm:flex-initial justify-center bg-primary/5 border-primary/30 text-primary hover:bg-primary/10"
                title="Imprimir factura / remisión de cobro y servicio del taller"
              >
                Hoja de Servicio
              </SecondaryButton>

              {order.sale && (
                <SecondaryButton
                  size="sm"
                  onClick={handlePrintTicket}
                  iconStart={<Icon name="Receipt" size="xs" />}
                  className="text-xs py-1.5 flex-1 sm:flex-initial justify-center"
                  title="Imprimir ticket térmico de la venta"
                >
                  Ticket Venta
                </SecondaryButton>
              )}
            </div>

            <SecondaryButton size="sm" onClick={onClose} className="w-full sm:w-auto justify-center">
              Cerrar
            </SecondaryButton>
          </Box>

        </Box>
      </Box>

      {/* Printable Vehicle Service Reception Document */}
      <ServiceReceptionReceipt
        order={order}
        branchName={activeBranchName}
        receiverName={
          typeof order.assignedMechanic === 'string'
            ? order.assignedMechanic
            : (order.assignedMechanic?.name || (typeof order.mechanic === 'string' ? order.mechanic : order.mechanic?.name) || 'Taller')
        }
      />

      {/* Printable Service Invoice / Workshop Remisión */}
      <ServiceInvoiceReceipt
        sale={order.sale as unknown as Sale}
        order={order}
        branchName={activeBranchName}
        sellerName={
          typeof order.assignedMechanic === 'string'
            ? order.assignedMechanic
            : (order.assignedMechanic?.name || (typeof order.mechanic === 'string' ? order.mechanic : order.mechanic?.name) || 'Taller Nova FV')
        }
      />

      {/* Printable Thermal Receipt Ticket */}
      {order.sale && (
        <TicketReceipt
          sale={order.sale as unknown as Sale}
          branchName={activeBranchName}
          sellerName={
            typeof order.assignedMechanic === 'string'
              ? order.assignedMechanic
              : (order.assignedMechanic?.name || 'Taller')
          }
        />
      )}

      {/* Entity Audit Logs Modal (Admin Only) */}
      {isAdmin && (
        <EntityAuditLogsModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          entityId={order.id}
          entityType="Maintenance"
          title={`Auditoría - Orden ${order.vehicle.brand} ${order.vehicle.model}`}
        />
      )}

      {/* Unlink Sale Confirmation Modal */}
      {showUnlinkConfirmModal && (
        <Modal
          isOpen={showUnlinkConfirmModal}
          onClose={() => setShowUnlinkConfirmModal(false)}
          title="¿Desvincular ticket de venta?"
          maxWidth="440px"
          headerVariant="warning"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <SecondaryButton size="sm" onClick={() => setShowUnlinkConfirmModal(false)}>
                Cancelar
                <KbdBadge keys="Esc" className="ml-1.5" />
              </SecondaryButton>
              <PrimaryButton
                size="sm"
                color="error"
                onClick={handleConfirmUnlinkSale}
                loading={unlinkingSale}
                iconStart={<Icon name="Trash2" size="xs" />}
              >
                Desvincular ticket
              </PrimaryButton>
            </div>
          }
        >
          <div className="space-y-3 text-xs leading-relaxed text-base-content/80">
            <p>
              ¿Estás seguro de que deseas desvincular el ticket{' '}
              <strong className="text-base-content font-mono font-bold">
                {order.sale?.folio || order.sale?.id?.slice(-6) || ''}
              </strong>{' '}
              de esta orden de mantenimiento?
            </p>
            <div className="p-3 bg-base-200 rounded-lg text-[11px] text-base-content/70">
              El ticket de venta permanecerá en el sistema de Punto de Venta, pero se desvinculará de la ficha de este servicio.
            </div>
          </div>
        </Modal>
      )}
    </Box>
  );
};

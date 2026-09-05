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
} from '@/app/presentation/components';
import {
  ServiceStatus,
  SERVICE_STATUS_COLORS,
  SERVICE_STATUS_LABELS,
} from '@/core/enums';
import type { AdminMaintenanceOrder } from '@/app/domain';
import { formatDate, formatCurrency } from '@/core/utils';
import { cleanPhoneDigits } from '@/core/utils/formatters/formatPhoneNumber';

export interface MaintenanceDetailDrawerProps {
  isOpen: boolean;
  order: AdminMaintenanceOrder | null;
  assignableUsers: { value: string; label: string }[];
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
  onClose,
  onStatusChange,
  onAssignMechanic,
  onAddDiagnosticNote,
  onNotifyCustomer,
  onUpdateLaborCost,
  onLinkSale,
  onUnlinkSale,
}) => {
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [copiedFolio, setCopiedFolio] = useState(false);
  const [unlinkingSale, setUnlinkingSale] = useState(false);

  // Labor cost edit state
  const [editingLaborCost, setEditingLaborCost] = useState(false);
  const [laborCostValue, setLaborCostValue] = useState<number | string>('');
  const [savingLaborCost, setSavingLaborCost] = useState(false);

  useEffect(() => {
    if (order) {
      setLaborCostValue(order.laborCost ?? order.laborPrice ?? 0);
      setEditingLaborCost(false);
    }
  }, [order]);

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

  const handleUnlinkSale = async () => {
    if (!onUnlinkSale || !order) return;
    if (!window.confirm('¿Estás seguro de desvincular este ticket de venta del mantenimiento?')) return;
    setUnlinkingSale(true);
    try {
      await onUnlinkSale(order.id);
    } finally {
      setUnlinkingSale(false);
    }
  };

  const sColor = SERVICE_STATUS_COLORS[order.status] || SERVICE_STATUS_COLORS[ServiceStatus.NotStarted];
  const phoneDigits = cleanPhoneDigits(order.customer.phone || '');

  // WhatsApp quick link
  const waMessage = `Hola ${order.customer.name}, le saludamos de Taller Ferventa. Le informamos que su vehículo ${order.vehicle.brand} ${order.vehicle.model} (Serie: ${order.vehicle.serialNumberLastFour}) se encuentra en estatus: ${SERVICE_STATUS_LABELS[order.status] || order.status}.${order.status === ServiceStatus.Completed ? ' ¡Su vehículo ya está listo para ser recogido!' : ''}`;
  const waUrl = phoneDigits ? `https://wa.me/52${phoneDigits}?text=${encodeURIComponent(waMessage)}` : undefined;

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
                      <span className="text-[11px] font-bold leading-tight line-clamp-1">
                        {m.label}
                      </span>
                      <span className="text-[10px] text-base-content/60 mt-0.5 font-mono">
                        {m.date ? formatDate(m.date) : 'Pendiente'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Box>

            {/* QUICK CONTROLS: Status & Assigned Mechanic & Notification */}
            <Box bg="base-100" rounded="DEFAULT" className="p-4 border border-base-300 shadow-xs space-y-4">
              <Flex justify="between" align="center" className="flex-wrap gap-2">
                <Text size="xs" weight="bold" variant="muted" className="uppercase tracking-wider">
                  Control de Estado & Asignación
                </Text>

                {/* Notify Customer Button */}
                {(order.status === ServiceStatus.Completed || order.status === ServiceStatus.Delivered || order.notifiedAt) && (
                  <Flex align="center" gap="xs">
                    {order.notifiedAt && (
                      <Badge variant="soft" color="info" size="xs" className="gap-1">
                        <Icon name="Check" size="xs" />
                        Notificado ({formatDate(order.notifiedAt)})
                      </Badge>
                    )}
                    <PrimaryButton
                      size="xs"
                      color="info"
                      onClick={handleNotifyClick}
                      iconStart={<Icon name="Bell" size="xs" />}
                    >
                      {order.notifiedAt ? 'Re-notificar' : 'Avisar al Cliente'}
                    </PrimaryButton>
                  </Flex>
                )}
              </Flex>

              <Grid cols={{ base: 1, sm: 2 }} gap="md">
                <Box>
                  <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
                    Estado Actual
                  </Text>
                  <Select
                    size="sm"
                    value={order.status}
                    disabled={statusUpdating}
                    onChange={(e) => handleStatusSelectChange(e.target.value as AdminMaintenanceOrder['status'])}
                    options={[
                      { value: ServiceStatus.NotStarted, label: SERVICE_STATUS_LABELS[ServiceStatus.NotStarted] },
                      { value: ServiceStatus.InProgress, label: SERVICE_STATUS_LABELS[ServiceStatus.InProgress] },
                      { value: ServiceStatus.Completed, label: SERVICE_STATUS_LABELS[ServiceStatus.Completed] },
                      { value: ServiceStatus.Delivered, label: SERVICE_STATUS_LABELS[ServiceStatus.Delivered] },
                    ]}
                  />
                </Box>

                <Box>
                  <Text as="label" size="xs" weight="semibold" variant="muted" className="block mb-1">
                    Mecánico Asignado
                  </Text>
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
                </Box>
              </Grid>
            </Box>

            {/* CUSTOMER & VEHICLE INFO */}
            <Grid cols={{ base: 1, sm: 2 }} gap="md">
              {/* Customer */}
              <Box bg="base-200" rounded="DEFAULT" className="p-4 border border-base-300">
                <Flex align="center" gap="xs" className="mb-2 text-primary">
                  <Icon name="User" size="sm" />
                  <Text size="xs" weight="bold" className="uppercase tracking-wider text-base-content">
                    Cliente
                  </Text>
                </Flex>
                <Text size="sm" weight="bold" className="text-base-content">
                  {order.customer.name}
                </Text>
                {order.customer.phone && (
                  <Flex align="center" gap="xs" className="mt-1">
                    <Text size="xs" variant="muted" className="font-mono">
                      {order.customer.phone}
                    </Text>
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-xs btn-ghost text-success hover:bg-success/10 gap-1 px-1.5 h-6 min-h-6"
                        title="Enviar mensaje de WhatsApp"
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
                    {!editingLaborCost && onUpdateLaborCost && (
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

                    <Box className="text-right">
                      <Text size="md" weight="bold" className="text-primary font-mono text-base font-black">
                        {formatCurrency(order.sale.total || 0)}
                      </Text>
                      {onUnlinkSale && (
                        <TertiaryButton
                          size="xs"
                          className="h-6 min-h-6 px-1.5 text-error hover:bg-error/10 text-[10px] mt-1 gap-1"
                          disabled={unlinkingSale}
                          onClick={handleUnlinkSale}
                          title="Desvincular ticket de este mantenimiento"
                        >
                          <Icon name="Trash2" size="xs" />
                          <span>Desvincular</span>
                        </TertiaryButton>
                      )}
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
                              {item.quantity}x {item.name || (item as any).productName || 'Concepto'}
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
                  {onLinkSale && (
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
                          {formatDate(dNote.createdAt)}
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
          <Box className="px-6 py-3 bg-base-200 border-t border-base-300 flex justify-end gap-2">
            <SecondaryButton size="sm" onClick={onClose}>
              Cerrar
            </SecondaryButton>
          </Box>

        </Box>
      </Box>
    </Box>
  );
};

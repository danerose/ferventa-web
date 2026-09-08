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
  Icon,
  KbdBadge,
} from '@/app/presentation/components';
import {
  SpecialOrderStatus,
  SPECIAL_ORDER_STATUS_LABELS,
  SPECIAL_ORDER_STATUS_COLORS,
} from '@/core/enums';
import type { SpecialOrder } from '@/app/domain';
import { formatCurrency, formatDate, buildSpecialOrderWhatsAppMessage } from '@/core/utils';
import { useActiveBranch } from '@/app/presentation/hooks';

export interface SpecialOrderDetailDrawerProps {
  isOpen: boolean;
  order: SpecialOrder | null;
  onClose: () => void;
  onOpenPaymentModal: (order: SpecialOrder) => void;
  onOpenStatusModal: (order: SpecialOrder) => void;
  onOpenCancelModal: (order: SpecialOrder) => void;
}

export const SpecialOrderDetailDrawer: React.FC<SpecialOrderDetailDrawerProps> = ({
  isOpen,
  order,
  onClose,
  onOpenPaymentModal,
  onOpenStatusModal,
  onOpenCancelModal,
}) => {
  const [copiedFolio, setCopiedFolio] = useState(false);

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

  const { activeBranchName } = useActiveBranch();

  if (!isOpen || !order) return null;

  const handleCopyFolio = () => {
    navigator.clipboard.writeText(order.folio);
    setCopiedFolio(true);
    setTimeout(() => setCopiedFolio(false), 2000);
  };

  // WhatsApp link preparation
  const cleanPhone = order.customer.phone.replace(/\D/g, '');
  const waMessage = buildSpecialOrderWhatsAppMessage({
    customerName: order.customer.name,
    folio: order.folio,
    itemDescription: order.itemDescription,
    status: order.status,
    remainingBalance: order.remainingBalance,
    branchName: activeBranchName,
  });
  const waUrl = `https://wa.me/52${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

  const statusColor = SPECIAL_ORDER_STATUS_COLORS[order.status] || {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
  };

  const isCancelled = order.status === SpecialOrderStatus.CANCELLED;
  const isDelivered = order.status === SpecialOrderStatus.DELIVERED;

  return (
    <Box className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <Box
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over panel */}
      <Box className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <Box className="w-screen max-w-xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
          {/* HEADER */}
          <Box className="px-6 py-5 bg-[#091426] text-white flex items-center justify-between border-b border-white/10">
            <Stack spacing="xs">
              <Flex align="center" gap="sm">
                <Heading level={3} className="text-xl font-black text-white tracking-tight">
                  {order.folio}
                </Heading>
                <SecondaryButton
                  size="xs"
                  onClick={handleCopyFolio}
                  className="bg-white/10 hover:bg-white/20 text-white border-none py-0.5 px-2 text-xs flex items-center gap-1"
                  title="Copiar folio"
                >
                  <Icon name={copiedFolio ? 'Check' : 'Copy'} size="xs" />
                  {copiedFolio ? '¡Copiado!' : 'Copiar'}
                </SecondaryButton>
              </Flex>

              <Flex align="center" gap="xs">
                <Text size="xs" className="text-slate-300">
                  Creado el {formatDate(order.createdAt)}
                </Text>
              </Flex>
            </Stack>

            <Flex align="center" gap="sm">
              <Badge
                variant="soft"
                className={`font-semibold px-3 py-1 text-xs border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
              >
                {SPECIAL_ORDER_STATUS_LABELS[order.status] || order.status}
              </Badge>

              <Flex align="center" gap="xs">
                <KbdBadge keys="Esc" className="bg-white/10 text-white/80 border-white/20 text-[10px]" />
                <SecondaryButton
                  size="sm"
                  onClick={onClose}
                  className="bg-white/10 hover:bg-white/20 text-white border-none p-1.5 rounded-full"
                  title="Cerrar detalle (Esc)"
                >
                  <Icon name="X" size="sm" />
                </SecondaryButton>
              </Flex>
            </Flex>
          </Box>

          {/* SCROLLABLE BODY */}
          <Box className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* MOTIVO DE CANCELACIÓN (SI APLICA) */}
            {isCancelled && order.cancellationReason && (
              <Box className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl">
                <Flex align="start" gap="sm">
                  <Icon name="XCircle" size="sm" className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <Box>
                    <Text size="xs" weight="bold" className="text-rose-800 dark:text-rose-300">
                      Pedido Cancelado
                    </Text>
                    <Text size="xs" className="text-rose-700 dark:text-rose-400 mt-0.5">
                      Motivo: {order.cancellationReason}
                    </Text>
                  </Box>
                </Flex>
              </Box>
            )}

            {/* SECCIÓN CLIENTE */}
            <Box className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl">
              <Flex justify="between" align="start" className="mb-2">
                <Flex align="center" gap="xs">
                  <Icon name="User" size="sm" className="text-indigo-600 dark:text-indigo-400" />
                  <Heading level={4} className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Cliente Solicitante
                  </Heading>
                </Flex>

                {cleanPhone && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    <Icon name="MessageCircle" size="xs" />
                    Avisar por WhatsApp
                  </a>
                )}
              </Flex>

              <Stack spacing="xs" className="text-xs">
                <Flex justify="between">
                  <Text className="text-slate-500">Nombre:</Text>
                  <Text weight="semibold" className="text-slate-800 dark:text-slate-100">
                    {order.customer.name}
                  </Text>
                </Flex>
                <Flex justify="between">
                  <Text className="text-slate-500">Teléfono:</Text>
                  <Text weight="semibold" className="text-slate-800 dark:text-slate-100">
                    {order.customer.phone}
                  </Text>
                </Flex>
                {order.customer.email && (
                  <Flex justify="between">
                    <Text className="text-slate-500">Correo:</Text>
                    <Text weight="semibold" className="text-slate-800 dark:text-slate-100">
                      {order.customer.email}
                    </Text>
                  </Flex>
                )}
              </Stack>
            </Box>

            {/* SECCIÓN PIEZA Y FINANZAS */}
            <Box className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl">
              <Flex align="center" gap="xs" className="mb-3">
                <Icon name="Package" size="sm" className="text-indigo-600 dark:text-indigo-400" />
                <Heading level={4} className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Detalle de la Pieza & Finanzas
                </Heading>
              </Flex>

              <Box className="mb-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                <Text size="sm" weight="bold" className="text-slate-900 dark:text-slate-100 block mb-1">
                  {order.itemDescription}
                </Text>
                {order.estimatedArrivalDate && (
                  <Text size="xs" className="text-indigo-600 dark:text-indigo-400 font-medium">
                    📅 Llegada estimada: {formatDate(order.estimatedArrivalDate)}
                  </Text>
                )}
                {order.notes && (
                  <Text size="xs" className="text-slate-500 mt-1 italic block">
                    &quot;{order.notes}&quot;
                  </Text>
                )}
              </Box>

              {/* Financial Breakdown Cards */}
              <Box className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-center">
                <Box className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <Text size="xs" className="text-slate-500 block">Costo Lista</Text>
                  <Text size="xs" weight="bold" className="text-slate-700 dark:text-slate-300">
                    {formatCurrency(order.costPrice)}
                  </Text>
                </Box>
                <Box className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <Text size="xs" className="text-slate-500 block">Precio Venta</Text>
                  <Text size="xs" weight="bold" className="text-slate-900 dark:text-slate-100">
                    {formatCurrency(order.sellingPrice)}
                  </Text>
                </Box>
                <Box className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <Text size="xs" className="text-slate-500 block">Anticipo Total</Text>
                  <Text size="xs" weight="bold" className="text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(order.advancePayment)}
                  </Text>
                </Box>
                <Box className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <Text size="xs" className="text-slate-500 block">Saldo Restante</Text>
                  <Text size="xs" weight="bold" className="text-amber-600 dark:text-amber-400">
                    {formatCurrency(order.remainingBalance)}
                  </Text>
                </Box>
              </Box>

              {/* Progress bar */}
              <Box className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <Flex justify="between" align="center" className="mb-1.5 text-xs">
                  <Text weight="semibold" className="text-slate-700 dark:text-slate-300">
                    Avance de Pago ({order.advancePercentage.toFixed(1)}%)
                  </Text>
                  <Badge
                    variant="soft"
                    color={order.isFullyPaid ? 'success' : 'warning'}
                    size="xs"
                    className="font-bold"
                  >
                    {order.isFullyPaid ? 'Liquidado' : `Resta: ${formatCurrency(order.remainingBalance)}`}
                  </Badge>
                </Flex>

                <Box className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <Box
                    className={`h-full transition-all duration-500 rounded-full ${
                      order.isFullyPaid ? 'bg-emerald-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, order.advancePercentage))}%` }}
                  />
                </Box>
              </Box>
            </Box>

            {/* HISTORIAL DE PAGOS */}
            <Box className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl">
              <Flex justify="between" align="center" className="mb-3">
                <Flex align="center" gap="xs">
                  <Icon name="CreditCard" size="sm" className="text-indigo-600 dark:text-indigo-400" />
                  <Heading level={4} className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Historial de Pagos y Abonos ({order.payments?.length || 0})
                  </Heading>
                </Flex>

                {!order.isFullyPaid && !isCancelled && (
                  <PrimaryButton
                    size="xs"
                    onClick={() => onOpenPaymentModal(order)}
                    className="flex items-center gap-1 text-xs py-1"
                  >
                    <Icon name="Plus" size="xs" /> Abonar
                  </PrimaryButton>
                )}
              </Flex>

              <Stack spacing="xs">
                {(!order.payments || order.payments.length === 0) && (
                  <Text size="xs" className="text-slate-400 italic">
                    Sin abonos registrados aún.
                  </Text>
                )}

                {order.payments?.map((payment, idx) => (
                  <Box
                    key={payment.id || payment._id || idx}
                    className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between"
                  >
                    <Box>
                      <Flex align="center" gap="xs">
                        <Text size="xs" weight="bold" className="text-slate-800 dark:text-slate-100">
                          {formatCurrency(payment.amount)}
                        </Text>
                        <Badge variant="outline" size="xs" className="capitalize text-slate-600">
                          {payment.paymentMethod}
                        </Badge>
                        {payment.paymentReference && (
                          <Text size="xs" className="text-slate-400 font-mono">
                            Ref: {payment.paymentReference}
                          </Text>
                        )}
                      </Flex>
                      {payment.notes && (
                        <Text size="xs" className="text-slate-500 mt-0.5 block">
                          {payment.notes}
                        </Text>
                      )}
                    </Box>

                    <Text size="xs" className="text-slate-400 shrink-0">
                      {formatDate(payment.date)}
                    </Text>
                  </Box>
                ))}
              </Stack>
            </Box>

            {/* BITÁCORA DE ESTATUS */}
            <Box className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl">
              <Flex justify="between" align="center" className="mb-3">
                <Flex align="center" gap="xs">
                  <Icon name="History" size="sm" className="text-indigo-600 dark:text-indigo-400" />
                  <Heading level={4} className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Bitácora de Estatus ({order.statusHistory?.length || 0})
                  </Heading>
                </Flex>

                {!isCancelled && !isDelivered && (
                  <SecondaryButton
                    size="xs"
                    onClick={() => onOpenStatusModal(order)}
                    className="flex items-center gap-1 text-xs py-1"
                  >
                    <Icon name="ArrowRight" size="xs" /> Avanzar
                  </SecondaryButton>
                )}
              </Flex>

              <Stack spacing="xs">
                {order.statusHistory?.map((hist, idx) => {
                  const sColor = SPECIAL_ORDER_STATUS_COLORS[hist.status] || {
                    bg: 'bg-slate-100',
                    text: 'text-slate-700',
                    border: 'border-slate-300',
                  };

                  return (
                    <Box
                      key={idx}
                      className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-start justify-between"
                    >
                      <Box>
                        <Badge
                          variant="soft"
                          size="xs"
                          className={`font-semibold ${sColor.bg} ${sColor.text}`}
                        >
                          {SPECIAL_ORDER_STATUS_LABELS[hist.status] || hist.status}
                        </Badge>
                        {hist.notes && (
                          <Text size="xs" className="text-slate-600 dark:text-slate-400 mt-1 block">
                            {hist.notes}
                          </Text>
                        )}
                        {hist.changedBy?.name && (
                          <Text size="xs" className="text-slate-400 mt-0.5 block">
                            Por: {hist.changedBy.name}
                          </Text>
                        )}
                      </Box>

                      <Text size="xs" className="text-slate-400 shrink-0">
                        {formatDate(hist.changedAt)}
                      </Text>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          </Box>

          {/* ACTIONS FOOTER */}
          <Box className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            {!isCancelled && !isDelivered && (
              <SecondaryButton
                size="sm"
                onClick={() => onOpenCancelModal(order)}
                className="text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs flex items-center gap-1"
              >
                <Icon name="XCircle" size="xs" /> Cancelar Pedido
              </SecondaryButton>
            )}

            <Flex gap="sm" className="ml-auto">
              {!order.isFullyPaid && !isCancelled && (
                <PrimaryButton
                  size="sm"
                  onClick={() => onOpenPaymentModal(order)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white border-none text-xs flex items-center gap-1.5"
                >
                  <Icon name="CreditCard" size="xs" />
                  Abonar / Liquidar
                </PrimaryButton>
              )}

              {!isCancelled && !isDelivered && (
                <PrimaryButton
                  size="sm"
                  onClick={() => onOpenStatusModal(order)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white border-none text-xs flex items-center gap-1.5"
                >
                  <Icon name="ArrowRight" size="xs" />
                  Avanzar Estatus
                </PrimaryButton>
              )}
            </Flex>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

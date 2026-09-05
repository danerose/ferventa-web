import React, { useState, useEffect, useId } from 'react';
import {
  Modal,
  Box,
  Flex,
  Stack,
  Text,
  Heading,
  TextInput,
  PrimaryButton,
  SecondaryButton,
  Badge,
  Icon,
  KbdBadge,
} from '@/app/presentation/components';
import {
  SpecialOrderStatus,
  SPECIAL_ORDER_STATUS_LABELS,
  SPECIAL_ORDER_STATUS_COLORS,
} from '@/core/enums';
import type { SpecialOrder, UpdateSpecialOrderStatusPayload } from '@/app/domain';

export interface UpdateSpecialOrderStatusModalProps {
  isOpen: boolean;
  order: SpecialOrder | null;
  onClose: () => void;
  onSubmit: (orderId: string, payload: UpdateSpecialOrderStatusPayload) => Promise<void>;
}

const PIPELINE_ORDER: SpecialOrderStatus[] = [
  SpecialOrderStatus.ORDER_PLACED,
  SpecialOrderStatus.ORDERED,
  SpecialOrderStatus.IN_TRANSIT,
  SpecialOrderStatus.IN_BRANCH,
  SpecialOrderStatus.READY_FOR_PICKUP,
  SpecialOrderStatus.DELIVERED,
];

function getNextStatus(current: string): SpecialOrderStatus | null {
  const currentIndex = PIPELINE_ORDER.indexOf(current as SpecialOrderStatus);
  if (currentIndex >= 0 && currentIndex < PIPELINE_ORDER.length - 1) {
    return PIPELINE_ORDER[currentIndex + 1];
  }
  return null;
}

export const UpdateSpecialOrderStatusModal: React.FC<UpdateSpecialOrderStatusModalProps> = ({
  isOpen,
  order,
  onClose,
  onSubmit,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<SpecialOrderStatus | string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formId = useId();

  useEffect(() => {
    if (isOpen && order) {
      const next = getNextStatus(order.status) || order.status;
      setSelectedStatus(next);
      setNotes('');
      setErrorMessage(null);
    }
  }, [isOpen, order]);

  if (!order) return null;

  const currentStatus = order.status;
  const nextRecommended = getNextStatus(currentStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit(order.id, {
        status: selectedStatus,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al actualizar estatus');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Avanzar Estatus — ${order.folio}`}
      maxWidth="540px"
      footer={
        <Flex justify="between" align="center" className="w-full">
          <SecondaryButton type="button" onClick={onClose} disabled={isSubmitting}>
            Cancelar <KbdBadge keys="Esc" className="ml-1.5" />
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            form={formId}
            disabled={!selectedStatus || selectedStatus === currentStatus || isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <Icon name="Loader2" size="sm" className="animate-spin" />
            ) : (
              <Icon name="ArrowRight" size="sm" />
            )}
            Actualizar Estatus <KbdBadge keys="Enter ↵" className="ml-1.5" />
          </PrimaryButton>
        </Flex>
      }
    >
      <form id={formId} onSubmit={handleSubmit}>
        <Stack spacing="md" className="p-1">
          {errorMessage && (
            <Box className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-lg">
              <Flex align="center" gap="sm">
                <Icon name="AlertTriangle" size="sm" className="text-rose-600 dark:text-rose-400 shrink-0" />
                <Text size="sm" className="text-rose-700 dark:text-rose-300 font-medium">
                  {errorMessage}
                </Text>
              </Flex>
            </Box>
          )}

          {/* Información Actual */}
          <Box className="p-3.5 bg-base-200/50 border border-base-300 rounded-xl">
            <Flex justify="between" align="center">
              <Box>
                <Text size="xs" weight="bold" className="text-primary">
                  {order.folio}
                </Text>
                <Heading level={4} className="font-semibold text-base-content">
                  {order.itemDescription}
                </Heading>
              </Box>

              <Flex align="center" gap="xs">
                <Text size="xs" className="text-base-content/60">Actual:</Text>
                <Badge
                  variant="soft"
                  className={`font-semibold ${SPECIAL_ORDER_STATUS_COLORS[currentStatus]?.bg || ''} ${
                    SPECIAL_ORDER_STATUS_COLORS[currentStatus]?.text || ''
                  }`}
                >
                  {SPECIAL_ORDER_STATUS_LABELS[currentStatus] || currentStatus}
                </Badge>
              </Flex>
            </Flex>
          </Box>

          {/* Selector de Nuevo Estatus */}
          <Box className="p-4 bg-base-200/50 border border-base-300 rounded-xl">
            <Text size="xs" weight="semibold" className="text-base-content/70 mb-2.5 block">
              Seleccionar Nuevo Estatus del Pedido *
            </Text>

            <Stack spacing="xs">
              {PIPELINE_ORDER.map((statusKey) => {
                const isSelected = selectedStatus === statusKey;
                const isCurrent = currentStatus === statusKey;
                const isNext = nextRecommended === statusKey;

                return (
                  <Box
                    key={statusKey}
                    onClick={() => setSelectedStatus(statusKey)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-xs'
                        : 'border-base-300 bg-base-100 hover:bg-base-200'
                    }`}
                  >
                    <Flex align="center" gap="sm">
                      <Box
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-primary bg-primary text-primary-content'
                            : 'border-base-300'
                        }`}
                      >
                        {isSelected && <Box className="w-1.5 h-1.5 rounded-full bg-primary-content" />}
                      </Box>

                      <Text
                        size="sm"
                        weight={isSelected ? 'bold' : 'normal'}
                        className={isSelected ? 'text-primary font-bold' : 'text-base-content'}
                      >
                        {SPECIAL_ORDER_STATUS_LABELS[statusKey]}
                      </Text>
                    </Flex>

                    <Flex gap="xs">
                      {isCurrent && (
                        <Badge variant="outline" size="xs" className="text-base-content/60">
                          Actual
                        </Badge>
                      )}
                      {isNext && (
                        <Badge variant="soft" color="primary" size="xs" className="font-semibold">
                          Siguiente Paso
                        </Badge>
                      )}
                    </Flex>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          {/* Notas / Guía de Paquetería */}
          <Box className="p-4 bg-base-200/50 border border-base-300 rounded-xl">
            <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
              Notas o No. de Guía de Rastreo (Opcional)
            </Text>
            <TextInput
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Guía FedEx #99882211 / Llegó en paquete #3"
              className="w-full"
            />
          </Box>
        </Stack>
      </form>
    </Modal>
  );
};

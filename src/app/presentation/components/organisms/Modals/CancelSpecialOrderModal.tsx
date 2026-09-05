import React, { useState, useEffect, useId } from 'react';
import {
  Modal,
  Box,
  Flex,
  Stack,
  Text,
  Heading,
  Textarea,
  PrimaryButton,
  SecondaryButton,
  Icon,
} from '@/app/presentation/components';
import type { SpecialOrder, CancelSpecialOrderPayload } from '@/app/domain';

export interface CancelSpecialOrderModalProps {
  isOpen: boolean;
  order: SpecialOrder | null;
  onClose: () => void;
  onSubmit: (orderId: string, payload: CancelSpecialOrderPayload) => Promise<void>;
}

export const CancelSpecialOrderModal: React.FC<CancelSpecialOrderModalProps> = ({
  isOpen,
  order,
  onClose,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formId = useId();

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!order) return null;

  const canSubmit = reason.trim().length >= 4 && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit(order.id, {
        reason: reason.trim(),
      });
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al cancelar pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cancelar Pedido — ${order.folio}`}
      maxWidth="500px"
      footer={
        <Flex justify="between" align="center" className="w-full">
          <SecondaryButton type="button" onClick={onClose} disabled={isSubmitting}>
            Volver
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            form={formId}
            disabled={!canSubmit}
            className="bg-rose-600 hover:bg-rose-700 text-white border-rose-600 flex items-center gap-2"
          >
            {isSubmitting ? (
              <Icon name="Loader2" size="sm" className="animate-spin" />
            ) : (
              <Icon name="XCircle" size="sm" />
            )}
            Confirmar Cancelación
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

          {/* Warning Banner */}
          <Box className="p-3.5 bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-xl">
            <Flex align="start" gap="sm">
              <Icon name="AlertTriangle" size="md" className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <Box>
                <Heading level={4} className="font-bold text-rose-800 dark:text-rose-300">
                  ¿Estás seguro de cancelar este pedido?
                </Heading>
                <Text size="xs" className="text-rose-700 dark:text-rose-400 mt-1">
                  El pedido <strong>{order.folio}</strong> ({order.itemDescription}) pasará a estatus Cancelado. Esta acción quedará registrada en la bitácora del sistema.
                </Text>
              </Box>
            </Flex>
          </Box>

          {/* Motivo de Cancelación */}
          <Box className="p-4 bg-base-200/50 border border-base-300 rounded-xl">
            <Text size="xs" weight="semibold" className="text-base-content/70 mb-1.5 block">
              Motivo de la Cancelación * (Mínimo 4 caracteres)
            </Text>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. El proveedor informó que la pieza se encuentra descontinuada; el cliente solicitó reembolso..."
              rows={3}
              className="w-full text-xs"
            />
          </Box>
        </Stack>
      </form>
    </Modal>
  );
};

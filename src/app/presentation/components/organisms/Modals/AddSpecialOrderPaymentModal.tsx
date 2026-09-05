import React, { useState, useEffect, useId } from 'react';
import {
  Modal,
  Box,
  Flex,
  Grid,
  Stack,
  Text,
  Heading,
  TextInput,
  PrimaryButton,
  SecondaryButton,
  Badge,
  Icon,
} from '@/app/presentation/components';
import type { SpecialOrder, AddSpecialOrderPaymentPayload } from '@/app/domain';
import { formatCurrency } from '@/core/utils';

export interface AddSpecialOrderPaymentModalProps {
  isOpen: boolean;
  order: SpecialOrder | null;
  onClose: () => void;
  onSubmit: (orderId: string, payload: AddSpecialOrderPaymentPayload) => Promise<void>;
}

export const AddSpecialOrderPaymentModal: React.FC<AddSpecialOrderPaymentModalProps> = ({
  isOpen,
  order,
  onClose,
  onSubmit,
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formId = useId();

  const remainingBalance = order?.remainingBalance ?? 0;
  const sellingPrice = order?.sellingPrice ?? 0;
  const currentPaid = sellingPrice - remainingBalance;

  useEffect(() => {
    if (isOpen && order) {
      setAmount(remainingBalance > 0 ? remainingBalance : '');
      setPaymentMethod('cash');
      setPaymentReference('');
      setNotes(remainingBalance > 0 ? 'Liquidación al recoger pieza' : '');
      setErrorMessage(null);
    }
  }, [isOpen, order, remainingBalance]);

  if (!order) return null;

  const numAmount = typeof amount === 'number' ? amount : 0;
  const isAmountValid = numAmount > 0 && numAmount <= remainingBalance;
  const willFullyPay = numAmount >= remainingBalance;
  const newRemaining = Math.max(0, remainingBalance - numAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAmountValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit(order.id, {
        amount: numAmount,
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al registrar abono');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Registrar Abono / Liquidación — ${order.folio}`}
      maxWidth="580px"
      footer={
        <Flex justify="between" align="center" className="w-full">
          <SecondaryButton type="button" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            form={formId}
            disabled={!isAmountValid || isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <Icon name="Loader2" size="sm" className="animate-spin" />
            ) : (
              <Icon name="CreditCard" size="sm" />
            )}
            {willFullyPay
              ? `Liquidar Pedido (${formatCurrency(numAmount)})`
              : `Registrar Abono (${formatCurrency(numAmount)})`}
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

          {/* Resumen del Pedido */}
          <Box className="p-3 bg-base-200/50 border border-base-300 rounded-xl">
            <Flex justify="between" align="start" className="mb-2">
              <Box>
                <Text size="xs" weight="bold" className="text-primary">
                  {order.folio}
                </Text>
                <Heading level={4} className="font-semibold text-base-content">
                  {order.itemDescription}
                </Heading>
                <Text size="xs" className="text-base-content/60">
                  Cliente: {order.customer.name} ({order.customer.phone})
                </Text>
              </Box>

              <Badge
                variant="soft"
                color={remainingBalance <= 0 ? 'success' : 'warning'}
                size="sm"
                className="font-semibold"
              >
                {remainingBalance <= 0 ? 'Liquidado' : `Resta: ${formatCurrency(remainingBalance)}`}
              </Badge>
            </Flex>

            {/* Financial indicators */}
            <Grid cols={{ base: 3 }} gap="sm" className="pt-2 border-t border-base-300 text-center">
              <Box>
                <Text size="xs" className="text-base-content/60 block">Total Venta</Text>
                <Text size="sm" weight="bold" className="text-base-content">
                  {formatCurrency(sellingPrice)}
                </Text>
              </Box>
              <Box>
                <Text size="xs" className="text-base-content/60 block">Abonado Previo</Text>
                <Text size="sm" weight="bold" className="text-success">
                  {formatCurrency(currentPaid)}
                </Text>
              </Box>
              <Box>
                <Text size="xs" className="text-base-content/60 block">Saldo Actual</Text>
                <Text size="sm" weight="bold" className="text-warning">
                  {formatCurrency(remainingBalance)}
                </Text>
              </Box>
            </Grid>
          </Box>

          {/* Monto del Abono */}
          <Box className="p-4 bg-base-200/50 border border-base-300 rounded-xl">
            <Flex justify="between" align="center" className="mb-2">
              <Text size="xs" weight="semibold" className="text-base-content/70">
                Monto del Abono ($) *
              </Text>

              {remainingBalance > 0 && (
                <SecondaryButton
                  type="button"
                  size="xs"
                  onClick={() => setAmount(remainingBalance)}
                  className="text-xs py-1 px-2 font-semibold btn-success btn-soft"
                >
                  ⚡ Liquidar Todo ({formatCurrency(remainingBalance)})
                </SecondaryButton>
              )}
            </Flex>

            <TextInput
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
              placeholder="0.00"
              type="number"
              min={0.01}
              max={remainingBalance}
              step={0.01}
              inputMode="decimal"
              className="w-full text-lg font-bold text-base-content"
            />

            {numAmount > remainingBalance && (
              <Text size="xs" className="text-error font-medium mt-1.5 block">
                ⛔ El abono no puede exceder el saldo pendiente ({formatCurrency(remainingBalance)}).
              </Text>
            )}

            {isAmountValid && (
              <Box className="mt-3 p-2.5 bg-success/10 border border-success/30 rounded-lg">
                <Flex justify="between" align="center">
                  <Text size="xs" className="text-success font-medium">
                    {willFullyPay ? '🎉 Con este pago el pedido quedará 100% Liquidado' : '✅ Nuevo saldo restante:'}
                  </Text>
                  <Text size="xs" weight="bold" className="text-success">
                    {willFullyPay ? 'Completado ($0.00)' : formatCurrency(newRemaining)}
                  </Text>
                </Flex>
              </Box>
            )}
          </Box>

          {/* Método de Pago */}
          <Box className="p-4 bg-base-200/50 border border-base-300 rounded-xl">
            <Text size="xs" weight="semibold" className="text-base-content/70 mb-2 block">
              Método de Pago *
            </Text>
            <Flex gap="xs" className="w-full mb-3">
              <SecondaryButton
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 ${
                  paymentMethod === 'cash'
                    ? 'btn-primary font-semibold'
                    : ''
                }`}
              >
                <Icon name="Banknote" size="xs" /> Efectivo
              </SecondaryButton>

              <SecondaryButton
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 ${
                  paymentMethod === 'card'
                    ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 font-semibold'
                    : ''
                }`}
              >
                <Icon name="CreditCard" size="xs" /> Tarjeta
              </SecondaryButton>

              <SecondaryButton
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 ${
                  paymentMethod === 'transfer'
                    ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 font-semibold'
                    : ''
                }`}
              >
                <Icon name="ArrowLeftRight" size="xs" /> Transferencia
              </SecondaryButton>
            </Flex>

            <Grid cols={{ base: 1, md: 2 }} gap="md">
              <Box>
                <Text size="xs" weight="medium" className="text-slate-600 dark:text-slate-300 mb-1.5 block">
                  Referencia / Voucher
                </Text>
                <TextInput
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Ej. AUT-998822"
                  className="w-full"
                />
              </Box>

              <Box>
                <Text size="xs" weight="medium" className="text-slate-600 dark:text-slate-300 mb-1.5 block">
                  Notas de este Abono
                </Text>
                <TextInput
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Pago en mostrador"
                  className="w-full"
                />
              </Box>
            </Grid>
          </Box>
        </Stack>
      </form>
    </Modal>
  );
};

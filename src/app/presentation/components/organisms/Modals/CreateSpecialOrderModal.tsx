import React, { useState, useEffect, useRef, useId } from 'react';
import {
  Modal,
  Box,
  Flex,
  Grid,
  Stack,
  Text,
  Heading,
  TextInput,
  Textarea,
  PrimaryButton,
  SecondaryButton,
  Badge,
  Icon,
  KbdBadge,
} from '@/app/presentation/components';
import { useAuthStore } from '@/app/presentation/stores';
import { customerUseCases } from '@/core/di/container';
import type { SpecialOrder, CreateSpecialOrderPayload, CustomerLookupResult } from '@/app/domain';
import { formatCurrency, cn, cleanPhoneDigits, formatPhoneInput } from '@/core/utils';


export interface CreateSpecialOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateSpecialOrderPayload) => Promise<SpecialOrder | void>;
}

export const CreateSpecialOrderModal: React.FC<CreateSpecialOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const accessToken = useAuthStore((s) => s.accessToken);

  // Step 1: Customer fields
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [existingCustomerId, setExistingCustomerId] = useState<string | undefined>();
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<CustomerLookupResult | null>(null);

  // Step 2: Item & Pricing
  const [itemDescription, setItemDescription] = useState('');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [estimatedArrivalDate, setEstimatedArrivalDate] = useState('');

  // Step 3: Advance Calculator
  const [advancePayment, setAdvancePayment] = useState<number | ''>('');

  // Step 4: Payment Method & Notes
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formId = useId();

  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setCustomerPhone('');
      setCustomerName('');
      setCustomerEmail('');
      setExistingCustomerId(undefined);
      setFoundCustomer(null);
      setItemDescription('');
      setCostPrice('');
      setSellingPrice('');
      setEstimatedArrivalDate('');
      setAdvancePayment('');
      setPaymentMethod('cash');
      setPaymentReference('');
      setNotes('');
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Phone lookup with debounce
  const handlePhoneChange = (val: string) => {
    const formatted = formatPhoneInput(val);
    const numericOnly = cleanPhoneDigits(val);
    setCustomerPhone(formatted);
    setErrorMessage(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (numericOnly.length < 7) {
      setFoundCustomer(null);
      setExistingCustomerId(undefined);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (!accessToken) return;
      setIsSearchingPhone(true);
      try {
        const customer = await customerUseCases.getCustomerByPhone(numericOnly);
        if (customer) {
          setFoundCustomer(customer);
          setExistingCustomerId(customer.id);
          if (customer.name) setCustomerName(customer.name);
          if (customer.email) setCustomerEmail(customer.email);
        } else {
          setFoundCustomer(null);
          setExistingCustomerId(undefined);
        }
      } catch {
        setFoundCustomer(null);
      } finally {
        setIsSearchingPhone(false);
      }
    }, 400);
  };

  // Financial calculations
  const numSelling = typeof sellingPrice === 'number' ? sellingPrice : 0;
  const numCost = typeof costPrice === 'number' ? costPrice : 0;
  const numAdvance = typeof advancePayment === 'number' ? advancePayment : 0;

  const minAdvanceRequired = numSelling > 0 ? numSelling * 0.5 : 0;
  const isAdvanceValid = numSelling > 0 && numAdvance >= minAdvanceRequired;
  const advancePercentage = numSelling > 0 ? Math.min(100, (numAdvance / numSelling) * 100) : 0;
  const remainingBalance = Math.max(0, numSelling - numAdvance);
  const shortfall = Math.max(0, minAdvanceRequired - numAdvance);
  const isFullyPaid = numSelling > 0 && numAdvance >= numSelling;

  // Validation
  const rawDigits = cleanPhoneDigits(customerPhone);
  const canSubmit =
    customerName.trim().length > 0 &&
    rawDigits.length === 10 &&
    itemDescription.trim().length > 0 &&
    numSelling > 0 &&
    numCost >= 0 &&
    isAdvanceValid &&
    !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit({
        customerId: existingCustomerId,
        customerName: customerName.trim(),
        customerPhone: rawDigits,
        customerEmail: customerEmail.trim() || undefined,
        itemDescription: itemDescription.trim(),
        costPrice: numCost,
        sellingPrice: numSelling,
        advancePayment: numAdvance,
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
        notes: notes.trim() || undefined,
        estimatedArrivalDate: estimatedArrivalDate || undefined,
      });
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al levantar el pedido especial');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Levantar Nuevo Pedido Especial"
      maxWidth="720px"
      footer={
        <Flex justify="between" align="center" className="w-full">
          <SecondaryButton type="button" onClick={onClose} disabled={isSubmitting}>
            Cancelar <KbdBadge keys="Esc" className="ml-1.5" />
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            form={formId}
            disabled={!canSubmit || isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <Icon name="Loader2" size="sm" className="animate-spin" />
            ) : (
              <Icon name="PackagePlus" size="sm" />
            )}
            Crear Pedido ({formatCurrency(numAdvance)}) <KbdBadge keys="Enter ↵" className="ml-1.5" />
          </PrimaryButton>
        </Flex>
      }
    >
      <form id={formId} onSubmit={handleSubmit}>
        <Stack spacing="lg" className="p-1">
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

          {/* PASO 1: CLIENTE */}
          <Box className="p-4 bg-base-200/50 border border-base-300 rounded-xl">
            <Flex align="center" justify="between" className="mb-3">
              <Flex align="center" gap="sm">
                <Box className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold">
                  1
                </Box>
                <Heading level={4} className="font-semibold text-base-content">
                  Datos del Cliente
                </Heading>
              </Flex>
              {foundCustomer && (
                <Badge variant="soft" color="success" size="sm" className="flex items-center gap-1">
                  <Icon name="Check" size="xs" /> Cliente Registrado
                </Badge>
              )}
            </Flex>

            <Grid cols={{ base: 1, md: 3 }} gap="md">
              <Box>
                <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                  Teléfono (10 dígitos) *
                </Text>
                <Box className="relative">
                  <TextInput
                    value={customerPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="99 1234 5678"
                    inputMode="tel"
                    maxLength={12}
                    className="w-full font-mono"
                  />
                  {isSearchingPhone && (
                    <Box className="absolute right-3 top-2.5">
                      <Icon name="Loader2" size="sm" className="animate-spin text-base-content/50" />
                    </Box>
                  )}
                </Box>
                {customerPhone && cleanPhoneDigits(customerPhone).length > 0 && cleanPhoneDigits(customerPhone).length < 10 && (
                  <span className="text-[11px] text-error mt-1 block font-medium">
                    Faltan {10 - cleanPhoneDigits(customerPhone).length} dígitos para los 10 requeridos.
                  </span>
                )}
              </Box>

              <Box>
                <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                  Nombre Completo *
                </Text>
                <TextInput
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full"
                />
              </Box>

              <Box>
                <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                  Correo Electrónico (Opcional)
                </Text>
                <TextInput
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  type="email"
                  className="w-full"
                />
              </Box>
            </Grid>
          </Box>

          {/* PASO 2: PIEZA Y PRECIOS */}
          <Box className="p-4 bg-base-200/50 border border-base-300 rounded-xl">
            <Flex align="center" gap="sm" className="mb-3">
              <Box className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold">
                2
              </Box>
              <Heading level={4} className="font-semibold text-base-content">
                Pieza y Precios
              </Heading>
            </Flex>

            <Stack spacing="md">
              <Box>
                <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                  Descripción de la Pieza Solicitada *
                </Text>
                <TextInput
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Ej. Tablero digital FT 150 Italika, Amortiguador trasero..."
                  className="w-full font-medium"
                />
              </Box>

              <Grid cols={{ base: 1, md: 3 }} gap="md">
                <Box>
                  <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                    Precio Lista / Costo Taller ($) *
                  </Text>
                  <TextInput
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0.00"
                    type="number"
                    min={0}
                    step={0.01}
                    inputMode="decimal"
                    className="w-full"
                  />
                  <Text size="xs" className="text-base-content/50 mt-1 block">
                    Costo compra a proveedor
                  </Text>
                </Box>

                <Box>
                  <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                    Precio de Venta al Cliente ($) *
                  </Text>
                  <TextInput
                    value={sellingPrice}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : '';
                      setSellingPrice(val);
                      if (typeof val === 'number' && val > 0 && advancePayment === '') {
                        setAdvancePayment(val * 0.5);
                      }
                    }}
                    placeholder="0.00"
                    type="number"
                    min={1}
                    step={0.01}
                    inputMode="decimal"
                    className="w-full font-bold text-base-content"
                  />
                  <Text size="xs" className="text-primary font-medium mt-1 block">
                    {numSelling > 0
                      ? `Ganancia est.: ${formatCurrency(Math.max(0, numSelling - numCost))}`
                      : 'Precio total a cobrar'}
                  </Text>
                </Box>

                <Box>
                  <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                    Llegada Estimada (Opcional)
                  </Text>
                  <TextInput
                    value={estimatedArrivalDate}
                    onChange={(e) => setEstimatedArrivalDate(e.target.value)}
                    type="date"
                    className="w-full"
                  />
                  <Text size="xs" className="text-base-content/50 mt-1 block">
                    Fecha tentativa del taller
                  </Text>
                </Box>
              </Grid>
            </Stack>
          </Box>

          {/* PASO 3: CALCULADORA DE ANTICIPO REACTIVA */}
          <Box className="p-4 bg-base-200/50 border border-base-300 rounded-xl">
            <Flex align="center" justify="between" className="mb-3">
              <Flex align="center" gap="sm">
                <Box className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold">
                  3
                </Box>
                <Heading level={4} className="font-semibold text-base-content">
                  Calculadora Inteligente de Anticipo
                </Heading>
              </Flex>

              {numSelling > 0 && (
                <Badge variant="soft" color="warning" size="sm" className="font-semibold">
                  Mínimo 50%: {formatCurrency(minAdvanceRequired)}
                </Badge>
              )}
            </Flex>

            <Stack spacing="md">
              <Box>
                <Flex justify="between" align="center" className="mb-1.5">
                  <Text size="xs" weight="medium" className="text-base-content/70">
                    Monto de Anticipo a Dejar ($) *
                  </Text>

                  {numSelling > 0 && (
                    <Flex gap="xs">
                      <SecondaryButton
                        type="button"
                        size="xs"
                        onClick={() => setAdvancePayment(minAdvanceRequired)}
                        className="text-xs py-1 px-2 font-medium"
                      >
                        ⚡ Anticipo 50% ({formatCurrency(minAdvanceRequired)})
                      </SecondaryButton>
                      <SecondaryButton
                        type="button"
                        size="xs"
                        onClick={() => setAdvancePayment(numSelling)}
                        className="text-xs py-1 px-2 font-medium"
                      >
                        ⭐ Liquidar 100% ({formatCurrency(numSelling)})
                      </SecondaryButton>
                    </Flex>
                  )}
                </Flex>

                <TextInput
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0.00"
                  type="number"
                  min={0}
                  step={0.01}
                  inputMode="decimal"
                  className="w-full text-base font-bold transition-colors"
                />
              </Box>

              {/* FEEDBACK VISUAL REACTIVO */}
              {numSelling > 0 && (
                <Box
                  className={`p-3 rounded-xl border transition-all ${
                    isAdvanceValid
                      ? 'bg-success/10 border-success/30'
                      : 'bg-error/10 border-error/30'
                  }`}
                >
                  <Flex justify="between" align="center" className="mb-2">
                    <Flex align="center" gap="xs">
                      <Icon
                        name={isAdvanceValid ? 'CheckCircle2' : 'AlertCircle'}
                        size="sm"
                        className={isAdvanceValid ? 'text-success' : 'text-error'}
                      />
                      <Text
                        size="xs"
                        weight="semibold"
                        className={isAdvanceValid ? 'text-success' : 'text-error'}
                      >
                        {isAdvanceValid
                          ? isFullyPaid
                            ? '✅ Pedido 100% Liquidado al momento'
                            : `✅ Cubierto ${advancePercentage.toFixed(1)}% del total`
                          : `⛔ Faltan ${formatCurrency(shortfall)} para cubrir el 50% mínimo`}
                      </Text>
                    </Flex>

                    <Text
                      size="xs"
                      weight="bold"
                      className={isAdvanceValid ? 'text-success' : 'text-error'}
                    >
                      {isFullyPaid
                        ? 'Sin saldo restante'
                        : `Resta a pagar: ${formatCurrency(remainingBalance)}`}
                    </Text>
                  </Flex>

                  {/* Animated Progress Bar */}
                  <Box className="w-full bg-base-300 h-2 rounded-full overflow-hidden">
                    <Box
                      className={`h-full transition-all duration-500 rounded-full ${
                        isAdvanceValid
                          ? advancePercentage >= 100
                            ? 'bg-success'
                            : 'bg-primary'
                          : 'bg-error'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, advancePercentage))}%` }}
                    />
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>

          {/* PASO 4: MÉTODO DE PAGO Y NOTAS */}
          <Box className="p-4 bg-base-200/50 border border-base-300 rounded-xl">
            <Flex align="center" gap="sm" className="mb-3">
              <Box className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold">
                4
              </Box>
              <Heading level={4} className="font-semibold text-base-content">
                Método de Pago y Observaciones
              </Heading>
            </Flex>

            <Stack spacing="md">
              <Box>
                <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                  Método de Pago Inicial *
                </Text>
                <div className="grid grid-cols-3 gap-2 w-full">
                  {(
                    [
                      { value: 'cash' as const, label: 'Efectivo', icon: 'Banknote' as const },
                      { value: 'card' as const, label: 'Tarjeta', icon: 'CreditCard' as const },
                      { value: 'transfer' as const, label: 'Transferencia', icon: 'ArrowLeftRight' as const },
                    ]
                  ).map((opt) => {
                    const isSelected = paymentMethod === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setPaymentMethod(opt.value)}
                        className={cn(
                          'flex items-center justify-center gap-1.5 text-xs py-2 px-3 h-auto min-h-[38px] rounded-DEFAULT border transition-all duration-150 cursor-pointer font-medium select-none',
                          isSelected
                            ? 'bg-primary text-primary-content border-primary font-semibold shadow-xs ring-2 ring-primary/20'
                            : 'bg-base-100 border-base-300 text-base-content/70 hover:bg-base-200 hover:text-base-content hover:border-base-content/20'
                        )}
                      >
                        <Icon name={opt.icon} size="xs" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </Box>

              <Box>
                <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                  Folio o Referencia de Pago (Opcional)
                </Text>
                <TextInput
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Ej. REF-88229 / Autorización voucher"
                  className="w-full"
                />
              </Box>

              <Box>
                <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                  Notas y Condiciones Especiales
                </Text>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. El cliente lo requiere antes del sábado; especificación de color o modelo exacto..."
                  rows={2}
                  className="w-full text-xs"
                />
              </Box>
            </Stack>
          </Box>
        </Stack>
      </form>
    </Modal>
  );
};

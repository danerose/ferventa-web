import React, { useEffect, useState, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useClientPortalStore, useAuthStore } from '@/app/presentation/stores';
import {
  Box,
  Flex,
  Grid,
  Stack,
  Text,
  Badge,
  TextInput,
  Select,
  Textarea,
  PrimaryButton,
  SecondaryButton,
  Icon,
  DateTimePicker,
  KbdBadge,
  CustomerVehicleSelector,
} from '@/app/presentation/components';
import { cleanPhoneDigits, formatPhoneInput } from '@/core/utils';
import { PREDEFINED_SERVICE_OPTIONS } from '@/core/constants';
import { customerUseCases } from '@/core/di/container';
import type { CustomerLookupResult, CustomerLookupVehicle } from '@/app/domain';

export interface AppointmentFormProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  isStaff?: boolean;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  onCancel,
  onSuccess,
  isStaff,
}) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isStaffMode = isStaff !== undefined ? isStaff : Boolean(accessToken);

  const {
    bookingLoading,
    bookingSuccess,
    bookingError,
    loadOccupiedSlots,
    occupiedSlots,
    occupiedSlotsLoading,

    // Form state from store
    formCustomerName,
    formCustomerPhone,
    formCustomerEmail,
    formBrand,
    formModel,
    formYear,
    formSerialNumberLastFour,
    formServiceRequested,
    formSelectedDate,
    formSelectedTime,
    formNotes,
    formBranchId,
    formValidationError,
    branches,

    // Store Actions
    setFormField,
    submitBooking,
    resetForm,
    loadBranches,
  } = useClientPortalStore(
    useShallow((s) => ({
      bookingLoading: s.bookingLoading,
      bookingSuccess: s.bookingSuccess,
      bookingError: s.bookingError,
      loadOccupiedSlots: s.loadOccupiedSlots,
      occupiedSlots: s.occupiedSlots,
      occupiedSlotsLoading: s.occupiedSlotsLoading,
      formCustomerName: s.formCustomerName,
      formCustomerPhone: s.formCustomerPhone,
      formCustomerEmail: s.formCustomerEmail,
      formBrand: s.formBrand,
      formModel: s.formModel,
      formYear: s.formYear,
      formSerialNumberLastFour: s.formSerialNumberLastFour,
      formServiceRequested: s.formServiceRequested,
      formSelectedDate: s.formSelectedDate,
      formSelectedTime: s.formSelectedTime,
      formNotes: s.formNotes,
      formBranchId: s.formBranchId,
      formValidationError: s.formValidationError,
      branches: s.branches,
      setFormField: s.setFormField,
      submitBooking: s.submitBooking,
      resetForm: s.resetForm,
      loadBranches: s.loadBranches,
    }))
  );

  // Phone lookup states (Staff mode)
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<CustomerLookupResult | null>(null);
  const [selectedExistingVehicleId, setSelectedExistingVehicleId] = useState<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const lastFoundCustomerIdRef = useRef<string | undefined>(undefined);

  // Auto-focus customerName input when search completes for a new customer in staff mode
  useEffect(() => {
    if (!isStaffMode) return;
    const rawDigits = cleanPhoneDigits(formCustomerPhone);
    if (rawDigits.length === 10 && !isSearchingPhone && !foundCustomer) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [formCustomerPhone, isSearchingPhone, foundCustomer, isStaffMode]);

  // Load branches on mount
  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  // Set default branch if only one or first branch available
  useEffect(() => {
    if (!formBranchId && branches.length > 0) {
      const defaultB = branches[0];
      setFormField('formBranchId', defaultB.id || defaultB._id || '');
    }
  }, [branches, formBranchId, setFormField]);

  // Load occupied slots whenever formBranchId changes
  useEffect(() => {
    if (!formBranchId) return;

    const today = new Date();
    const futureLimit = new Date();
    futureLimit.setDate(today.getDate() + 30);

    const formatDateStr = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    loadOccupiedSlots(formatDateStr(today), formatDateStr(futureLimit));
  }, [formBranchId, loadOccupiedSlots]);

  // Clean booking state on unmount
  useEffect(() => {
    return () => {
      resetForm();
    };
  }, [resetForm]);

  const handlePhoneChange = (val: string) => {
    const formatted = formatPhoneInput(val);
    const numericOnly = cleanPhoneDigits(val);
    setFormField('formCustomerPhone', formatted);

    if (!isStaffMode) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (numericOnly.length < 10) {
      setIsSearchingPhone(false);
      setFoundCustomer(null);
      if (lastFoundCustomerIdRef.current) {
        setFormField('formCustomerName', '');
        setFormField('formCustomerEmail', '');
        handleSelectNewVehicle();
        lastFoundCustomerIdRef.current = undefined;
      }
      return;
    }

    setIsSearchingPhone(true);
    debounceTimerRef.current = setTimeout(async () => {
      if (!accessToken) {
        setIsSearchingPhone(false);
        return;
      }
      try {
        const customer = await customerUseCases.getCustomerByPhone(numericOnly);
        if (customer) {
          setFoundCustomer(customer);
          lastFoundCustomerIdRef.current = customer.id;
          if (customer.name) setFormField('formCustomerName', customer.name);
          if (customer.email) setFormField('formCustomerEmail', customer.email);

          // If customer has vehicles, select the latest one by default
          if (customer.vehicles && customer.vehicles.length > 0) {
            handleSelectExistingVehicle(customer.vehicles[0]);
          } else {
            handleSelectNewVehicle();
          }
        } else {
          setFoundCustomer(null);
          if (lastFoundCustomerIdRef.current) {
            setFormField('formCustomerName', '');
            setFormField('formCustomerEmail', '');
            handleSelectNewVehicle();
            lastFoundCustomerIdRef.current = undefined;
          }
        }
      } catch {
        setFoundCustomer(null);
      } finally {
        setIsSearchingPhone(false);
      }
    }, 200);
  };

  const handleSelectExistingVehicle = (veh: CustomerLookupVehicle) => {
    const vId = veh.id || veh._id || null;
    setSelectedExistingVehicleId(vId);
    setFormField('formBrand', veh.brand || '');
    setFormField('formModel', veh.model || '');
    setFormField('formYear', veh.year ? String(veh.year) : '');
    setFormField('formSerialNumberLastFour', (veh.serialNumberLastFour || '').slice(0, 4).toUpperCase());
  };

  const handleSelectNewVehicle = () => {
    setSelectedExistingVehicleId(null);
    setFormField('formBrand', '');
    setFormField('formModel', '');
    setFormField('formYear', '');
    setFormField('formSerialNumberLastFour', '');
  };

  const handleReset = () => {
    resetForm();
    setFoundCustomer(null);
    setSelectedExistingVehicleId(null);
    lastFoundCustomerIdRef.current = undefined;

    const today = new Date();
    const futureLimit = new Date();
    futureLimit.setDate(today.getDate() + 30);
    const formatDateStr = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    loadOccupiedSlots(formatDateStr(today), formatDateStr(futureLimit));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitBooking();
      if (useClientPortalStore.getState().bookingSuccess) {
        onSuccess?.();
      }
    } catch {
      // Handled by store
    }
  };

  const rawPhoneDigits = cleanPhoneDigits(formCustomerPhone);
  const isPhoneComplete = rawPhoneDigits.length === 10;

  if (bookingSuccess) {
    const format12h = (t: string) => {
      if (!t) return '';
      const [hStr, mStr] = t.split(':');
      const h = parseInt(hStr, 10);
      const ampm = h >= 12 ? 'p.m.' : 'a.m.';
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      return `${displayHour}:${mStr} ${ampm}`;
    };

    const formattedDate = () => {
      if (!formSelectedDate) return '';
      const dateObj = new Date(formSelectedDate + 'T00:00:00Z');
      return dateObj.toLocaleDateString('es-MX', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      });
    };

    return (
      <Box className="p-6 bg-base-100 border border-base-300 rounded-xl text-center space-y-4 shadow-sm animate-in fade-in duration-200">
        <div className="w-14 h-14 rounded-full bg-success/15 border border-success/30 text-success flex items-center justify-center mx-auto">
          <Icon name="CheckCircle2" size="lg" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-base-content m-0">¡Cita Solicitada con Éxito!</h3>
          <p className="text-xs text-base-content/60 mt-1">
            Tu solicitud ha sido recibida y se encuentra en estado de revisión.
          </p>
        </div>

        <div className="bg-base-200/60 border border-base-300 rounded-xl p-4 text-left space-y-2 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-base-300/50">
            <span className="text-base-content/60 font-medium">Fecha y Hora</span>
            <span className="font-bold text-base-content capitalize">
              {formattedDate()} {formSelectedTime ? `• ${format12h(formSelectedTime)}` : ''}
            </span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-base-300/50">
            <span className="text-base-content/60 font-medium">Cliente</span>
            <span className="font-semibold text-base-content">{formCustomerName || 'No especificado'}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-base-300/50">
            <span className="text-base-content/60 font-medium">Vehículo</span>
            <span className="font-semibold text-base-content">
              {formBrand || 'Genérico'} {formModel} ({formSerialNumberLastFour})
            </span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-base-content/60 font-medium">Servicio Solicitado</span>
            <span className="font-semibold text-primary">{formServiceRequested}</span>
          </div>
        </div>

        <Flex gap="sm">
          {onCancel && (
            <SecondaryButton onClick={onCancel} size="md" className="flex-1">
              Cerrar
            </SecondaryButton>
          )}
          <PrimaryButton onClick={handleReset} size="md" className={onCancel ? "flex-1" : "w-full"}>
            Agendar Otra Cita
          </PrimaryButton>
        </Flex>
      </Box>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 py-1">
      {formValidationError && (
        <Box className="p-3 bg-error/10 border border-error/30 rounded-lg">
          <Flex align="center" gap="xs">
            <Icon name="AlertTriangle" size="xs" className="text-error shrink-0" />
            <span className="text-xs font-medium text-error">{formValidationError}</span>
          </Flex>
        </Box>
      )}

      {bookingError && (
        <Box className="p-3 bg-error/10 border border-error/30 rounded-lg">
          <Flex align="center" gap="xs">
            <Icon name="AlertCircle" size="xs" className="text-error shrink-0" />
            <span className="text-xs font-medium text-error">{bookingError}</span>
          </Flex>
        </Box>
      )}

      {/* SECTION 1: Cliente y Sucursal */}
      <Box className="p-4 bg-base-200/50 border border-base-300 rounded-xl space-y-3">
        <Flex justify="between" align="center">
          <Flex align="center" gap="sm">
            <Box className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold shrink-0">
              1
            </Box>
            <span className="text-sm font-semibold text-base-content">
              Datos del Cliente y Sucursal
            </span>
          </Flex>
          {isStaffMode && (
            <>
              {isSearchingPhone && (
                <Flex align="center" gap="xs">
                  <Icon name="RefreshCw" size="xs" className="animate-spin text-primary" />
                  <Text size="xs" className="text-primary font-medium">Buscando...</Text>
                </Flex>
              )}
              {isPhoneComplete && !isSearchingPhone && foundCustomer && (
                <Badge color="success" size="sm" variant="soft">
                  <Icon name="CheckCircle" size="xs" className="mr-1" />
                  Cliente frecuente
                </Badge>
              )}
              {isPhoneComplete && !isSearchingPhone && !foundCustomer && (
                <Badge color="info" size="sm" variant="soft">
                  <Icon name="UserPlus" size="xs" className="mr-1" />
                  Nuevo cliente
                </Badge>
              )}
            </>
          )}
        </Flex>

        {/* Sucursal selection */}
        <div>
          <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Sucursal *</label>
          <Select
            size="md"
            value={formBranchId}
            onChange={(e) => setFormField('formBranchId', e.target.value)}
            disabled={bookingLoading || branches.length === 0}
            className="w-full"
            options={
              branches.length > 0
                ? branches.map((b) => ({
                    value: b.id || b._id || '',
                    label: b.name,
                  }))
                : [{ value: '', label: 'Cargando sucursales...' }]
            }
          />
        </div>

        {/* STAFF MODE: Phone-First Gating */}
        {isStaffMode ? (
          <>
            {/* Phone Input */}
            <div>
              <label className="text-xs font-medium text-base-content/70 mb-1.5 block">
                Teléfono Celular (10 dígitos) *
              </label>
              <Box className="relative">
                <TextInput
                  value={formCustomerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="99 1234 5678"
                  type="tel"
                  maxLength={12}
                  disabled={bookingLoading}
                  className="w-full font-mono text-sm"
                />
                {isSearchingPhone && (
                  <Box className="absolute right-3 top-2.5">
                    <Icon name="RefreshCw" size="sm" className="animate-spin text-primary" />
                  </Box>
                )}
              </Box>
              {formCustomerPhone && rawPhoneDigits.length > 0 && rawPhoneDigits.length < 10 && (
                <span className="text-[11px] text-warning mt-1 block font-medium">
                  Faltan {10 - rawPhoneDigits.length} dígitos para completar el número celular (10 requeridos).
                </span>
              )}
            </div>

            {/* Waiting State */}
            {!isPhoneComplete && !isSearchingPhone && (
              <Box className="p-5 bg-base-100/60 border border-dashed border-base-300 rounded-xl text-center">
                <Flex direction="col" align="center" justify="center" gap="xs">
                  <Box className="w-9 h-9 rounded-full bg-base-200 flex items-center justify-center text-base-content/40 mb-1">
                    <Icon name="Phone" size="sm" />
                  </Box>
                  <Text size="sm" weight="semibold" className="text-base-content/80">
                    En espera de número de teléfono
                  </Text>
                  <Text size="xs" className="text-base-content/50 max-w-sm">
                    Ingresa los 10 dígitos del teléfono para consultar si el cliente ya cuenta con historial o agendar una nueva cita.
                  </Text>
                </Flex>
              </Box>
            )}

            {/* Searching State */}
            {isSearchingPhone && (
              <Box className="p-5 bg-base-100/60 border border-base-300 rounded-xl text-center animate-pulse">
                <Flex direction="col" align="center" justify="center" gap="xs">
                  <Box className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
                    <Icon name="RefreshCw" size="sm" className="animate-spin" />
                  </Box>
                  <Text size="sm" weight="semibold" className="text-base-content">
                    Buscando cliente...
                  </Text>
                  <Text size="xs" className="text-base-content/50 max-w-sm">
                    Consultando registros y vehículos asociados a {formCustomerPhone}...
                  </Text>
                </Flex>
              </Box>
            )}

            {/* Phone Complete & Verified -> Show Customer inputs */}
            {isPhoneComplete && !isSearchingPhone && (
              <Stack gap="md" className="animate-in fade-in duration-200">
                {foundCustomer ? (
                  <Box className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
                    <Flex justify="between" align="center">
                      <Flex align="center" gap="sm">
                        <Box className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                          <Icon name="CheckCircle" size="xs" />
                        </Box>
                        <Box>
                          <Text size="xs" weight="bold" className="text-emerald-800 dark:text-emerald-200">
                            Cliente frecuente encontrado: {foundCustomer.name}
                          </Text>
                          <Text size="xs" className="text-emerald-700/80 dark:text-emerald-300/80">
                            Se cargaron automáticamente sus datos {foundCustomer.vehicles?.length ? `y ${foundCustomer.vehicles.length} vehículo(s) registrado(s)` : ''}.
                          </Text>
                        </Box>
                      </Flex>
                      <Badge color="success" size="sm" variant="soft">
                        Registrado
                      </Badge>
                    </Flex>
                  </Box>
                ) : (
                  <Box className="p-3 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 rounded-xl">
                    <Flex justify="between" align="center">
                      <Flex align="center" gap="sm">
                        <Box className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
                          <Icon name="UserPlus" size="xs" />
                        </Box>
                        <Box>
                          <Text size="xs" weight="bold" className="text-sky-800 dark:text-sky-200">
                            Nuevo cliente (Sin registro previo)
                          </Text>
                          <Text size="xs" className="text-sky-700/80 dark:text-sky-300/80">
                            Ingresa los datos para registrar la cita del cliente.
                          </Text>
                        </Box>
                      </Flex>
                      <Badge color="info" size="sm" variant="soft">
                        Nuevo
                      </Badge>
                    </Flex>
                  </Box>
                )}

                <Grid cols={{ base: 1, sm: 2 }} gap="md">
                  <div>
                    <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Nombre Completo *</label>
                    <TextInput
                      ref={nameInputRef}
                      value={formCustomerName}
                      onChange={(e) => setFormField('formCustomerName', e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      disabled={bookingLoading}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Correo Electrónico (Opcional)</label>
                    <TextInput
                      value={formCustomerEmail}
                      onChange={(e) => setFormField('formCustomerEmail', e.target.value)}
                      placeholder="juan@ejemplo.com"
                      type="email"
                      disabled={bookingLoading}
                      className="w-full"
                    />
                  </div>
                </Grid>
              </Stack>
            )}
          </>
        ) : (
          /* PUBLIC MODE: Open fields as usual */
          <>
            <div>
              <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Nombre Completo *</label>
              <TextInput
                value={formCustomerName}
                onChange={(e) => setFormField('formCustomerName', e.target.value)}
                placeholder="Ej. Juan Pérez"
                disabled={bookingLoading}
                className="w-full"
              />
            </div>

            <Grid cols={{ base: 1, sm: 2 }} gap="md">
              <div>
                <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Teléfono (10 dígitos) *</label>
                <TextInput
                  value={formCustomerPhone}
                  onChange={(e) => setFormField('formCustomerPhone', formatPhoneInput(e.target.value))}
                  placeholder="99 1234 5678"
                  type="tel"
                  maxLength={12}
                  disabled={bookingLoading}
                  className="w-full font-mono"
                />
                {formCustomerPhone && cleanPhoneDigits(formCustomerPhone).length > 0 && cleanPhoneDigits(formCustomerPhone).length < 10 && (
                  <span className="text-[11px] text-error mt-1 block font-medium">
                    Faltan {10 - cleanPhoneDigits(formCustomerPhone).length} dígitos para completar los 10 dígitos.
                  </span>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Correo Electrónico (Opcional)</label>
                <TextInput
                  value={formCustomerEmail}
                  onChange={(e) => setFormField('formCustomerEmail', e.target.value)}
                  placeholder="juan@ejemplo.com"
                  type="email"
                  disabled={bookingLoading}
                  className="w-full"
                />
              </div>
            </Grid>
          </>
        )}
      </Box>

      {/* SECTIONS 2 & 3: Revealed in staff mode only when phone is complete, or always in public mode */}
      {(!isStaffMode || (isPhoneComplete && !isSearchingPhone)) && (
        <Stack gap="md" className="animate-in fade-in duration-200">
          {/* SECTION 2: Datos del Vehículo */}
          <Box className="p-4 bg-base-200/50 border border-base-300 rounded-xl space-y-3">
            <Flex align="center" gap="sm">
              <Box className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold shrink-0">
                2
              </Box>
              <span className="text-sm font-semibold text-base-content">
                Datos del Vehículo
              </span>
            </Flex>

            {/* Quick select existing customer vehicles in staff mode */}
            {isStaffMode && foundCustomer && foundCustomer.vehicles && foundCustomer.vehicles.length > 0 && (
              <CustomerVehicleSelector
                customerName={foundCustomer.name}
                vehicles={foundCustomer.vehicles}
                selectedVehicleId={selectedExistingVehicleId}
                onSelectVehicle={handleSelectExistingVehicle}
                onSelectNewVehicle={handleSelectNewVehicle}
                disabled={bookingLoading}
              />
            )}

            <div>
              <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Placas o Serie (Últimos 4 - Opcional)</label>
              <TextInput
                value={formSerialNumberLastFour}
                onChange={(e) => setFormField('formSerialNumberLastFour', e.target.value.toUpperCase().slice(0, 4))}
                placeholder="Ej. 1234 (Opcional)"
                maxLength={4}
                disabled={bookingLoading}
                className="w-full font-mono"
              />
            </div>

            <Grid cols={{ base: 1, sm: 3 }} gap="sm">
              <div>
                <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Marca</label>
                <TextInput
                  value={formBrand}
                  onChange={(e) => setFormField('formBrand', e.target.value)}
                  placeholder="Ej. Italika, Honda"
                  disabled={bookingLoading}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Modelo (Opcional)</label>
                <TextInput
                  value={formModel}
                  onChange={(e) => setFormField('formModel', e.target.value)}
                  placeholder="Ej. DM250"
                  disabled={bookingLoading}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Año (Opcional)</label>
                <TextInput
                  value={formYear}
                  onChange={(e) => setFormField('formYear', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Ej. 2024"
                  disabled={bookingLoading}
                  className="w-full"
                />
              </div>
            </Grid>
          </Box>

          {/* SECTION 3: Detalle del Servicio y Horario */}
          <Box className="p-4 bg-base-200/50 border border-base-300 rounded-xl space-y-3">
            <Flex align="center" gap="sm">
              <Box className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold shrink-0">
                3
              </Box>
              <span className="text-sm font-semibold text-base-content">
                Detalle del Servicio y Fecha
              </span>
            </Flex>

            <div>
              <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Servicio *</label>
              <Select
                size="md"
                value={formServiceRequested}
                onChange={(e) => setFormField('formServiceRequested', e.target.value)}
                disabled={bookingLoading}
                className="w-full"
                options={PREDEFINED_SERVICE_OPTIONS}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Fecha y Horario de la Cita *</label>
              <DateTimePicker
                selectedDate={formSelectedDate}
                selectedTime={formSelectedTime}
                onChangeDate={(date) => {
                  setFormField('formSelectedDate', date);
                  setFormField('formSelectedTime', '');
                }}
                onChangeTime={(time) => setFormField('formSelectedTime', time)}
                occupiedSlots={occupiedSlots}
                occupiedSlotsLoading={occupiedSlotsLoading}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-base-content/70 mb-1.5 block">Notas de la Cita / Motivo o Síntomas</label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormField('formNotes', e.target.value)}
                placeholder="Ej. Mi vehículo hace un ruido al frenar... Siento que pierde potencia"
                disabled={bookingLoading}
                rows={2}
                className="w-full text-xs"
              />
              <span className="text-[11px] text-base-content/50 mt-1 block">
                Describe el motivo de la cita, peticiones o síntomas que presenta el vehículo.
              </span>
            </div>
          </Box>
        </Stack>
      )}

      <Flex justify="end" gap="sm" className="mt-4 pt-2 border-t border-base-300">
        {onCancel && (
          <SecondaryButton
            type="button"
            size="md"
            onClick={onCancel}
            disabled={bookingLoading}
            className="flex-1"
          >
            Cancelar <KbdBadge keys="Esc" className="ml-1.5" />
          </SecondaryButton>
        )}
        <PrimaryButton
          type="submit"
          size="md"
          loading={bookingLoading}
          disabled={
            bookingLoading ||
            occupiedSlotsLoading ||
            !formSelectedTime ||
            (isStaffMode && (!isPhoneComplete || isSearchingPhone || !formCustomerName.trim()))
          }
          className={onCancel ? "flex-1 font-bold" : "w-full font-bold"}
        >
          {isStaffMode && !isPhoneComplete ? (
            'Esperando Teléfono (10 dígitos)...'
          ) : isStaffMode && isSearchingPhone ? (
            'Buscando Cliente...'
          ) : !formSelectedTime ? (
            'Selecciona Fecha y Horario...'
          ) : (
            <>
              Confirmar Cita <KbdBadge keys="Enter ↵" className="ml-1.5" />
            </>
          )}
        </PrimaryButton>
      </Flex>
    </form>
  );
};


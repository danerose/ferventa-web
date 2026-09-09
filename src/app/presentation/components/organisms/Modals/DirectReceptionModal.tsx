import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Box,
  Flex,
  Grid,
  Stack,
  Text,
  Heading,
  TextInput,
  Select,
  PrimaryButton,
  SecondaryButton,
  Badge,
  Icon,
  KbdBadge,
  CustomerVehicleSelector,
} from '@/app/presentation/components';
import { useAuthStore } from '@/app/presentation/stores';
import { maintenanceUseCases, userUseCases, customerUseCases } from '@/core/di/container';
import { cleanPhoneDigits, formatPhoneInput } from '@/core/utils';
import { PREDEFINED_SERVICE_OPTIONS } from '@/core/constants';


import type {
  AdminMaintenanceOrder,
  CustomerLookupResult,
  CustomerLookupVehicle,
  User,
} from '@/app/domain';

export interface DirectReceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (order: AdminMaintenanceOrder) => void;
}

export const DirectReceptionModal: React.FC<DirectReceptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const accessToken = useAuthStore((s) => s.accessToken);

  // Form states - Customer
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [existingCustomerId, setExistingCustomerId] = useState<string | undefined>(undefined);

  // Phone lookup states
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<CustomerLookupResult | null>(null);
  const [selectedExistingVehicleId, setSelectedExistingVehicleId] = useState<string | null>(null);

  // Form states - Vehicle
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState<number | ''>(new Date().getFullYear());
  const [vehicleSerial, setVehicleSerial] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');

  // Form states - Service Intake
  const [serviceRequested, setServiceRequested] = useState('Frenos y Suspensión');
  const [customService, setCustomService] = useState('');
  const [notes, setNotes] = useState('');
  const [laborCost, setLaborCost] = useState<number | ''>(0);
  const [assignedMechanic, setAssignedMechanic] = useState('');

  // Mechanics list
  const [mechanics, setMechanics] = useState<User[]>([]);

  // Submission & Error states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const lastFoundCustomerIdRef = useRef<string | undefined>(undefined);

  // Auto-focus customerName input when search completes for a new customer
  useEffect(() => {
    const rawDigits = cleanPhoneDigits(customerPhone);
    if (rawDigits.length === 10 && !isSearchingPhone && !foundCustomer && isOpen) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [customerPhone, isSearchingPhone, foundCustomer, isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCustomerPhone('');
      setCustomerName('');
      setCustomerEmail('');
      setExistingCustomerId(undefined);
      setFoundCustomer(null);
      setSelectedExistingVehicleId(null);
      setVehicleBrand('');
      setVehicleModel('');
      setVehicleYear(new Date().getFullYear());
      setVehicleSerial('');
      setVehicleColor('');
      setServiceRequested('Frenos y Suspensión');
      setCustomService('');
      setNotes('');
      setLaborCost(0);
      setAssignedMechanic('');
      setErrorMessage(null);
      lastFoundCustomerIdRef.current = undefined;

      // Fetch mechanics
      if (accessToken) {
        userUseCases
          .getUsers(accessToken)
          .then((users: User[]) => {
            const mechList = users.filter((u: User) => {
              const roleStr = typeof u.role === 'string' ? u.role : u.role?.name || '';
              return roleStr.toLowerCase() === 'mechanic' || roleStr.toLowerCase() === 'mecanico';
            });
            setMechanics(mechList);
          })
          .catch(() => {});
      }
    }
  }, [isOpen, accessToken]);

  // Handle phone change: only trigger search when 10 digits are complete
  const handlePhoneChange = (val: string) => {
    const formatted = formatPhoneInput(val);
    const numericOnly = cleanPhoneDigits(val);
    setCustomerPhone(formatted);
    setErrorMessage(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (numericOnly.length < 10) {
      setIsSearchingPhone(false);
      setFoundCustomer(null);
      if (existingCustomerId) {
        setExistingCustomerId(undefined);
        setCustomerName('');
        setCustomerEmail('');
        handleSelectNewVehicle();
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
          setExistingCustomerId(customer.id);
          lastFoundCustomerIdRef.current = customer.id;
          if (customer.name) setCustomerName(customer.name);
          if (customer.email) setCustomerEmail(customer.email);

          // If customer has vehicles, select the latest one by default
          if (customer.vehicles && customer.vehicles.length > 0) {
            handleSelectExistingVehicle(customer.vehicles[0]);
          } else {
            handleSelectNewVehicle();
          }
        } else {
          setFoundCustomer(null);
          setExistingCustomerId(undefined);
          if (lastFoundCustomerIdRef.current) {
            setCustomerName('');
            setCustomerEmail('');
            handleSelectNewVehicle();
            lastFoundCustomerIdRef.current = undefined;
          }
        }
      } catch {
        setFoundCustomer(null);
        setExistingCustomerId(undefined);
      } finally {
        setIsSearchingPhone(false);
      }
    }, 200);
  };

  const handleSelectExistingVehicle = (veh: CustomerLookupVehicle) => {
    const vId = veh.id || veh._id || null;
    setSelectedExistingVehicleId(vId);
    setVehicleBrand(veh.brand || '');
    setVehicleModel(veh.model || '');
    setVehicleYear(veh.year ? Number(veh.year) : '');
    setVehicleSerial((veh.serialNumberLastFour || '').slice(0, 4).toUpperCase());
    setVehicleColor(veh.color || '');
  };

  const handleSelectNewVehicle = () => {
    setSelectedExistingVehicleId(null);
    setVehicleBrand('');
    setVehicleModel('');
    setVehicleYear(new Date().getFullYear());
    setVehicleSerial('');
    setVehicleColor('');
  };

  const rawPhoneDigits = cleanPhoneDigits(customerPhone);
  const isPhoneComplete = rawPhoneDigits.length === 10;
  const trimmedSerial = vehicleSerial.trim().toUpperCase().slice(0, 4);
  const finalService =
    serviceRequested === 'Otro'
      ? (customService.trim() || 'Otro')
      : serviceRequested;

  const canSubmit =
    isPhoneComplete &&
    !isSearchingPhone &&
    customerName.trim().length > 0 &&
    vehicleBrand.trim().length > 0 &&
    vehicleModel.trim().length > 0 &&
    trimmedSerial.length > 0 &&
    finalService.trim().length > 0 &&
    !submitting;

  const handleSubmit = async () => {
    if (!rawPhoneDigits || rawPhoneDigits.length < 10) {
      setErrorMessage('Ingresa un teléfono celular válido de 10 dígitos.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMessage('El nombre del cliente es obligatorio.');
      return;
    }
    if (!vehicleBrand.trim() || !vehicleModel.trim()) {
      setErrorMessage('Marca y modelo del vehículo son obligatorios.');
      return;
    }
    if (!trimmedSerial) {
      setErrorMessage('Los últimos 4 dígitos de la serie o placa son obligatorios.');
      return;
    }

    if (!finalService.trim()) {
      setErrorMessage('El motivo de ingreso o servicio solicitado es obligatorio.');
      return;
    }

    if (!accessToken) {
      setErrorMessage('Sesión no válida o expirada.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const order = await maintenanceUseCases.directReception({
        customerName: customerName.trim(),
        customerPhone: rawPhoneDigits,
        customerEmail: customerEmail.trim() || undefined,
        customerId: existingCustomerId,
        vehicleId: selectedExistingVehicleId || undefined,
        vehicle: {
          brand: vehicleBrand.trim(),
          model: vehicleModel.trim(),
          year: vehicleYear || new Date().getFullYear(),
          serialNumberLastFour: trimmedSerial,
          color: vehicleColor.trim() || undefined,
        },
        serviceRequested: finalService,
        notes: notes.trim() || undefined,
        laborCost: typeof laborCost === 'number' ? laborCost : 0,
        assignedMechanic: assignedMechanic || undefined,
      });

      onSuccess(order);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar recepción';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const modalFooter = (
    <Flex justify="between" align="center" className="w-full">
      <SecondaryButton onClick={onClose} disabled={submitting}>
        Cancelar <KbdBadge keys="Esc" className="ml-1.5" />
      </SecondaryButton>
      <PrimaryButton
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="flex items-center gap-2"
      >
        {submitting ? (
          <>
            <Icon name="RefreshCw" size="xs" className="animate-spin" />
            <span>Generando Orden...</span>
          </>
        ) : isSearchingPhone ? (
          <>
            <Icon name="RefreshCw" size="xs" className="animate-spin" />
            <span>Buscando Cliente...</span>
          </>
        ) : !isPhoneComplete ? (
          <>
            <Icon name="Phone" size="xs" />
            <span>Esperando Teléfono (10 dígitos)...</span>
          </>
        ) : (
          <>
            <Icon name="CheckCircle" size="xs" />
            <span>Recibir Vehículo y Abrir Orden</span>
            <KbdBadge keys="Enter ↵" className="ml-1.5" />
          </>
        )}
      </PrimaryButton>
    </Flex>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={canSubmit ? handleSubmit : undefined}
      title="Recepción Directa en Taller (Walk-in)"
      maxWidth="720px"
      footer={modalFooter}
    >
      <Stack gap="md" className="py-1">
        {/* Context Notice Banner */}
        <Box className="p-3 bg-base-200/60 border border-base-300 rounded-xl">
          <Flex align="center" gap="sm">
            <Icon name="Wrench" className="text-primary shrink-0" size="sm" />
            <Box>
              <Text size="xs" weight="bold" className="text-base-content mb-0.5">
                Ingreso directo de vehículo al taller sin cita previa
              </Text>
              <Text size="xs" className="text-base-content/70 leading-relaxed">
                Registra o asocia el cliente, vincula el vehículo y genera la orden de servicio activa.
              </Text>
            </Box>
          </Flex>
        </Box>

        {/* Error Alert */}
        {errorMessage && (
          <Box className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-lg">
            <Flex align="center" gap="xs">
              <Icon name="AlertCircle" className="text-rose-600 dark:text-rose-400" size="xs" />
              <Text size="xs" weight="medium" className="text-rose-700 dark:text-rose-300">
                {errorMessage}
              </Text>
            </Flex>
          </Box>
        )}

        {/* SECTION 1: Customer Identification */}
        <Box className="p-4 bg-base-200/50 border border-base-300 rounded-xl space-y-3">
          <Flex justify="between" align="center">
            <Flex align="center" gap="sm">
              <Box className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold shrink-0">
                1
              </Box>
              <Heading level={4} className="font-semibold text-base-content">
                Datos del Cliente
              </Heading>
            </Flex>
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
          </Flex>

          {/* Phone */}
          <Box>
            <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
              Teléfono Celular (10 dígitos) *
            </Text>
            <Box className="relative">
              <TextInput
                value={customerPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="Ej. 99 1234 5678"
                type="tel"
                maxLength={12}
                className="w-full font-mono text-sm"
              />
              {isSearchingPhone && (
                <Box className="absolute right-3 top-2.5">
                  <Icon name="RefreshCw" size="sm" className="animate-spin text-primary" />
                </Box>
              )}
            </Box>
            {customerPhone && rawPhoneDigits.length > 0 && rawPhoneDigits.length < 10 && (
              <span className="text-[11px] text-warning mt-1 block font-medium">
                Faltan {10 - rawPhoneDigits.length} dígitos para completar el número celular (10 requeridos).
              </span>
            )}
          </Box>

          {/* State: Waiting for 10 digits */}
          {!isPhoneComplete && !isSearchingPhone && (
            <Box className="p-5 bg-base-100/60 border border-dashed border-base-300 rounded-xl text-center">
              <Flex direction="col" align="center" justify="center" gap="xs">
                <Box className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center text-base-content/40 mb-1">
                  <Icon name="Phone" size="sm" />
                </Box>
                <Text size="sm" weight="semibold" className="text-base-content/80">
                  En espera de número de teléfono
                </Text>
                <Text size="xs" className="text-base-content/50 max-w-sm">
                  Ingresa los 10 dígitos del teléfono para consultar si el cliente ya cuenta con historial o darlo de alta como nuevo.
                </Text>
              </Flex>
            </Box>
          )}

          {/* State: Searching phone */}
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
                  Consultando registros y vehículos asociados a {customerPhone}...
                </Text>
              </Flex>
            </Box>
          )}

          {/* State: Phone complete & verified -> Show Customer inputs */}
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
                          Ingresa los datos para registrar al cliente y dar de alta su vehículo.
                        </Text>
                      </Box>
                    </Flex>
                    <Badge color="info" size="sm" variant="soft">
                      Nuevo
                    </Badge>
                  </Flex>
                </Box>
              )}

              <Grid cols={{ base: 1, md: 2 }} gap="md">
                <Box>
                  <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                    Nombre Completo *
                  </Text>
                  <TextInput
                    ref={nameInputRef}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nombre y apellidos del cliente"
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
            </Stack>
          )}
        </Box>

        {/* SECTION 2 & 3: Revealed when phone is complete and verified */}
        {isPhoneComplete && !isSearchingPhone && (
          <Stack gap="md" className="animate-in fade-in duration-200">
            {/* SECTION 2: Vehicle Selection & Data */}
            <Box className="p-4 bg-base-200/50 border border-base-300 rounded-xl space-y-3">
              <Flex justify="between" align="center">
                <Flex align="center" gap="sm">
                  <Box className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold shrink-0">
                    2
                  </Box>
                  <Heading level={4} className="font-semibold text-base-content">
                    Vehículo
                  </Heading>
                </Flex>
              </Flex>

          {/* Quick select existing customer vehicles */}
          {foundCustomer && foundCustomer.vehicles && foundCustomer.vehicles.length > 0 && (
            <CustomerVehicleSelector
              customerName={foundCustomer.name}
              vehicles={foundCustomer.vehicles}
              selectedVehicleId={selectedExistingVehicleId}
              onSelectVehicle={handleSelectExistingVehicle}
              onSelectNewVehicle={handleSelectNewVehicle}
              disabled={submitting}
            />
          )}

          <Grid cols={{ base: 1, md: 3 }} gap="md">
            {/* Brand */}
            <Box>
              <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                Marca *
              </Text>
              <TextInput
                value={vehicleBrand}
                onChange={(e) => setVehicleBrand(e.target.value)}
                placeholder="Ej. Italika, Honda, Ford"
                className="w-full"
              />
            </Box>

            {/* Model */}
            <Box>
              <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                Modelo *
              </Text>
              <TextInput
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="Ej. DM250, Versa, Civic"
                className="w-full"
              />
            </Box>

            {/* Year */}
            <Box>
              <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                Año
              </Text>
              <TextInput
                value={vehicleYear}
                onChange={(e) => setVehicleYear(e.target.value ? Number(e.target.value) : '')}
                placeholder="Ej. 2022"
                type="number"
                className="w-full"
              />
            </Box>

            {/* Serial / Plates */}
            <Box>
              <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                Placas o Serie (Últimos 4) *
              </Text>
              <TextInput
                value={vehicleSerial}
                onChange={(e) => setVehicleSerial(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="Ej. 1234"
                maxLength={4}
                className="w-full font-mono"
              />
            </Box>

            {/* Color */}
            <Box>
              <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                Color (Opcional)
              </Text>
              <TextInput
                value={vehicleColor}
                onChange={(e) => setVehicleColor(e.target.value)}
                placeholder="Ej. Rojo, Negro mate"
                className="w-full"
              />
            </Box>

            {/* Mechanic Assigned */}
            <Box>
              <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                Mecánico Asignado (Opcional)
              </Text>
              <Select
                value={assignedMechanic}
                onChange={(e) => setAssignedMechanic(e.target.value)}
                className="w-full"
              >
                <option value="">Sin asignar (Asignar después)</option>
                {mechanics.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Box>
          </Grid>
        </Box>

        {/* SECTION 3: Service Requested & Initial Work */}
        <Box className="p-4 bg-base-200/50 border border-base-300 rounded-xl space-y-3">
          <Flex align="center" gap="sm">
            <Box className="w-6 h-6 rounded-full bg-primary text-primary-content flex items-center justify-center text-xs font-bold shrink-0">
              3
            </Box>
            <Heading level={4} className="font-semibold text-base-content">
              Motivo de Ingreso y Servicio
            </Heading>
          </Flex>

          <Stack gap="md">
            <Box>
              <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                Servicio *
              </Text>
              <Select
                size="md"
                value={serviceRequested}
                onChange={(e) => setServiceRequested(e.target.value)}
                options={PREDEFINED_SERVICE_OPTIONS}
                className="w-full"
              />
            </Box>

            {serviceRequested === 'Otro' && (
              <Box>
                <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                  Especificar Servicio / Falla reportada *
                </Text>
                <TextInput
                  value={customService}
                  onChange={(e) => setCustomService(e.target.value)}
                  placeholder="Ej. Cambio de clutch, ajuste de cadena, revisión especial..."
                  className="w-full text-xs"
                />
              </Box>
            )}

            <Grid cols={{ base: 1, md: 2 }} gap="md">
              <Box>
                <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                  Mano de Obra Estimada ($ MXN)
                </Text>
                <TextInput
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0.00"
                  type="number"
                  className="w-full"
                />
              </Box>

              <Box>
                <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                  Notas de Recepción / Inventario Físico y Pertenencias
                </Text>
                <TextInput
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Deja llaves, 1/2 tanque de gasolina, gato hidráulico, rayón leve en puerta..."
                  className="w-full text-xs"
                />
                <span className="text-[11px] text-base-content/50 mt-1 block">
                  Registra pertenencias, inventario y estado físico del vehículo al recibirlo en taller.
                </span>
              </Box>
            </Grid>
          </Stack>
        </Box>
      </Stack>
    )}
  </Stack>
</Modal>
);
};

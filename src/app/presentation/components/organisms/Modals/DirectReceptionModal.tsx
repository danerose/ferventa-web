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
  Textarea,
  Select,
  PrimaryButton,
  SecondaryButton,
  Badge,
  Icon,
  KbdBadge,
} from '@/app/presentation/components';
import { useAuthStore } from '@/app/presentation/stores';
import { APIAdminRepository, APIUserRepository } from '@/app/data';
import { cleanPhoneDigits, formatPhoneInput } from '@/core/utils';


import type {
  AdminMaintenanceOrder,
  CustomerLookupResult,
  CustomerLookupVehicle,
  User,
} from '@/app/domain';

const adminRepo = new APIAdminRepository();
const userRepo = new APIUserRepository();

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
  const { accessToken } = useAuthStore();

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
  const [serviceRequested, setServiceRequested] = useState('');
  const [notes, setNotes] = useState('');
  const [laborCost, setLaborCost] = useState<number | ''>(0);
  const [assignedMechanic, setAssignedMechanic] = useState('');

  // Mechanics list
  const [mechanics, setMechanics] = useState<User[]>([]);

  // Submission & Error states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setServiceRequested('');
      setNotes('');
      setLaborCost(0);
      setAssignedMechanic('');
      setErrorMessage(null);

      // Fetch mechanics
      if (accessToken) {
        userRepo
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

  // Handle phone change with debounce search
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
        const customer = await adminRepo.getCustomerByPhone(accessToken, numericOnly);
        if (customer) {
          setFoundCustomer(customer);
          setExistingCustomerId(customer.id);
          if (customer.name) setCustomerName(customer.name);
          if (customer.email) setCustomerEmail(customer.email);

          // If customer has vehicles, select the latest one by default
          if (customer.vehicles && customer.vehicles.length > 0) {
            handleSelectExistingVehicle(customer.vehicles[0]);
          }
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

  const handleSelectExistingVehicle = (veh: CustomerLookupVehicle) => {
    const vId = veh.id || veh._id || null;
    setSelectedExistingVehicleId(vId);
    setVehicleBrand(veh.brand || '');
    setVehicleModel(veh.model || '');
    setVehicleYear(veh.year ? Number(veh.year) : '');
    setVehicleSerial(veh.serialNumberLastFour || '');
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

  const handleSubmit = async () => {
    const rawPhoneDigits = cleanPhoneDigits(customerPhone);
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
    if (!vehicleSerial.trim()) {
      setErrorMessage('Los últimos 4 dígitos de la serie o placa son obligatorios.');
      return;
    }
    if (!serviceRequested.trim()) {
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
      const order = await adminRepo.directReception(accessToken, {
        customerName: customerName.trim(),
        customerPhone: rawPhoneDigits,
        customerEmail: customerEmail.trim() || undefined,
        customerId: existingCustomerId,
        vehicle: {
          brand: vehicleBrand.trim(),
          model: vehicleModel.trim(),
          year: vehicleYear || new Date().getFullYear(),
          serialNumberLastFour: vehicleSerial.trim(),
          color: vehicleColor.trim() || undefined,
        },
        serviceRequested: serviceRequested.trim(),
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
      <PrimaryButton onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2">
        {submitting ? (
          <>
            <Icon name="RefreshCw" size="xs" className="animate-spin" />
            <span>Generando Orden...</span>
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
                <Icon name="RefreshCw" size="xs" className="animate-spin text-base-content/50" />
                <Text size="xs" className="text-base-content/60">Buscando...</Text>
              </Flex>
            )}
            {foundCustomer && !isSearchingPhone && (
              <Badge color="success" size="sm" variant="soft">
                <Icon name="CheckCircle" size="xs" className="mr-1" />
                Cliente frecuente
              </Badge>
            )}
          </Flex>

          <Grid cols={{ base: 1, md: 3 }} gap="md">
            {/* Phone */}
            <Box>
              <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                Teléfono (10 dígitos) *
              </Text>
              <TextInput
                value={customerPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="99 1234 5678"
                type="tel"
                maxLength={12}
                className="w-full font-mono"
              />
              {customerPhone && cleanPhoneDigits(customerPhone).length > 0 && cleanPhoneDigits(customerPhone).length < 10 && (
                <span className="text-[11px] text-error mt-1 block font-medium">
                  Faltan {10 - cleanPhoneDigits(customerPhone).length} dígitos para los 10 requeridos.
                </span>
              )}
            </Box>

            {/* Name */}
            <Box>
              <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                Nombre Completo *
              </Text>
              <TextInput
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nombre del cliente"
                className="w-full"
              />
            </Box>

            {/* Email */}
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
            <Box className="p-2.5 bg-base-100 rounded-lg border border-base-300">
              <Text size="xs" weight="medium" className="text-base-content/70 mb-1.5 block">
                Autos registrados de {foundCustomer.name}:
              </Text>
              <Flex gap="xs" wrap="wrap">
                {foundCustomer.vehicles.map((veh, idx) => {
                  const vId = veh.id || veh._id || `v-${idx}`;
                  const isSelected = selectedExistingVehicleId === vId;
                  return (
                    <button
                      key={vId}
                      type="button"
                      onClick={() => handleSelectExistingVehicle(veh)}
                      className={`btn btn-xs ${
                        isSelected
                          ? 'btn-primary font-bold'
                          : 'btn-outline border-base-300 text-base-content hover:bg-base-200'
                      }`}
                    >
                      <Icon name="CheckCircle" size="xs" className="mr-1" />
                      {veh.brand} {veh.model} ({veh.serialNumberLastFour || veh.year})
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={handleSelectNewVehicle}
                  className={`btn btn-xs ${
                    selectedExistingVehicleId === null
                      ? 'btn-neutral font-bold'
                      : 'btn-ghost border border-dashed border-base-300 text-base-content/70'
                  }`}
                >
                  <Icon name="Plus" size="xs" className="mr-1" />
                  Otro vehículo
                </button>
              </Flex>
            </Box>
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
                onChange={(e) => setVehicleSerial(e.target.value.toUpperCase())}
                placeholder="Ej. 1234 o PLACAS"
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
                Servicio Solicitado / Falla reportada *
              </Text>
              <Textarea
                value={serviceRequested}
                onChange={(e) => setServiceRequested(e.target.value)}
                placeholder="Ej. Revisión de frenos, afinación completa y cambio de balatas delanteras"
                rows={2}
                className="w-full text-xs"
              />
            </Box>

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
    </Modal>
  );
};

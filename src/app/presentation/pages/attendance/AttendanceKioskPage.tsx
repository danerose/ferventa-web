import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Icon,
  Modal,
  Badge,
  Box,
  Flex,
  Grid,
  Stack,
  Heading,
  Text,
  SecondaryButton,
  PrimaryButton,
} from '@/app/presentation/components';
import { useKioskStore } from '@/app/presentation/stores';
import { branchUseCases } from '@/core/di/container';
import type { Branch, KioskEmployee, KioskClockAction } from '@/app/domain';

export const AttendanceKioskPage: React.FC = () => {
  const navigate = useNavigate();

  // Branch state
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    return localStorage.getItem('ferventa_active_branch') || '';
  });

  // Time state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Kiosk Store
  const employees = useKioskStore((s) => s.employees);
  const loading = useKioskStore((s) => s.loading);
  const error = useKioskStore((s) => s.error);
  const selectedEmployee = useKioskStore((s) => s.selectedEmployee);
  const pin = useKioskStore((s) => s.pin);
  const clocking = useKioskStore((s) => s.clocking);
  const actionSuccess = useKioskStore((s) => s.actionSuccess);
  const fetchEmployees = useKioskStore((s) => s.fetchEmployees);
  const selectEmployee = useKioskStore((s) => s.selectEmployee);
  const appendPinDigit = useKioskStore((s) => s.appendPinDigit);
  const deletePinDigit = useKioskStore((s) => s.deletePinDigit);
  const clearPin = useKioskStore((s) => s.clearPin);
  const submitClock = useKioskStore((s) => s.submitClock);
  const clearSuccess = useKioskStore((s) => s.clearSuccess);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch branches on mount
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await branchUseCases.getPublicBranches();
        if (data && data.length > 0) {
          setBranches(data);
          if (!selectedBranchId) {
            setSelectedBranchId(data[0].id);
            localStorage.setItem('ferventa_active_branch', data[0].id);
          }
        }
      } catch {
        // ignore
      }
    };
    loadBranches();
  }, [selectedBranchId]);

  // Fetch employees for active branch
  useEffect(() => {
    if (selectedBranchId) {
      fetchEmployees(selectedBranchId);
    }
  }, [selectedBranchId, fetchEmployees]);

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    localStorage.setItem('ferventa_active_branch', branchId);
  };

  const handleClockAction = async (action: KioskClockAction) => {
    if (!selectedBranchId) return;
    const success = await submitClock(action, selectedBranchId);
    if (success) {
      setTimeout(() => {
        clearSuccess();
      }, 3500);
    }
  };

  const getStatusBadge = (emp: KioskEmployee) => {
    const rawStatus = String(emp.status || emp.shiftStatus || '').toLowerCase();
    if (rawStatus === 'working' || rawStatus === 'clocked-in' || (emp.hasActiveShift && !emp.isOnBreak && !emp.activeBreak)) {
      return <Badge variant="success" size="sm">Trabajando</Badge>;
    }
    if (rawStatus === 'break' || rawStatus === 'onbreak' || rawStatus === 'on-break' || emp.isOnBreak || Boolean(emp.activeBreak)) {
      return <Badge variant="warning" size="sm">En Descanso</Badge>;
    }
    return <Badge variant="neutral" size="sm">Fuera de Turno</Badge>;
  };

  return (
    <Box className="min-h-screen bg-base-200 dark:bg-base-300 flex flex-col p-4 md:p-8 select-none font-sans">
      {/* Kiosk Header */}
      <Flex
        as="header"
        justify="between"
        align="center"
        gap="md"
        className="flex-col sm:flex-row bg-base-100 p-6 rounded-3xl border border-base-300 shadow-md mb-6"
      >
        <Flex align="center" gap="md">
          <Box className="w-12 h-12 rounded-2xl bg-primary text-primary-content flex items-center justify-center shadow-md">
            <Icon name="Clock" size="lg" />
          </Box>
          <Box>
            <Heading level={1} className="text-2xl font-black tracking-tight text-base-content m-0">
              Kiosco de Asistencia
            </Heading>
            <Text size="xs" color="muted" weight="bold" className="uppercase tracking-wider">
              Control de Asistencia del Personal
            </Text>
          </Box>
        </Flex>

        {/* Live Clock & Branch Select */}
        <Flex align="center" gap="lg">
          <Box className="text-right">
            <Text className="text-3xl font-black font-mono tracking-tight text-base-content">
              {currentTime.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </Text>
            <Text size="xs" color="muted" weight="semibold" className="capitalize">
              {currentTime.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </Box>

          {branches.length > 0 && (
            <Box className="border-l border-base-300 pl-6 hidden md:block">
              <Text size="xs" weight="bold" color="muted" className="uppercase tracking-wider block mb-1">
                Sucursal
              </Text>
              <select
                className="select select-sm select-bordered font-semibold text-xs"
                value={selectedBranchId}
                onChange={(e) => handleBranchChange(e.target.value)}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Box>
          )}

          <SecondaryButton
            size="sm"
            color="secondary"
            onClick={() => navigate('/admin/operaciones')}
            title="Salir al panel administrativo"
            iconStart={<Icon name="LogOut" size="sm" />}
          />
        </Flex>
      </Flex>

      {/* Employees Grid */}
      <Box as="main" className="flex-1 max-w-7xl w-full mx-auto space-y-4">
        <Flex justify="between" align="center" className="px-2">
          <Heading level={2} className="text-sm font-bold uppercase tracking-wider text-base-content/70 m-0">
            Selecciona tu tarjeta para marcar asistencia
          </Heading>
          <SecondaryButton
            size="xs"
            color="secondary"
            onClick={() => fetchEmployees(selectedBranchId)}
            disabled={loading}
            iconStart={<Icon name="RefreshCw" size="xs" className={loading ? 'animate-spin' : ''} />}
          >
            Actualizar lista
          </SecondaryButton>
        </Flex>

        {loading && (
          <Flex direction="col" align="center" justify="center" className="py-24 text-base-content/60">
            <Icon name="Loader2" size="xl" className="animate-spin text-primary mb-3" />
            <Text size="sm" weight="semibold">
              Cargando colaboradores de la sucursal...
            </Text>
          </Flex>
        )}

        {error && (
          <Flex align="center" gap="sm" className="alert alert-error max-w-xl mx-auto">
            <Icon name="AlertCircle" size="sm" />
            <Text size="sm">{error}</Text>
          </Flex>
        )}

        {!loading && !error && employees.length === 0 && (
          <Box className="text-center py-24 bg-base-100 rounded-3xl border border-base-300 max-w-xl mx-auto p-8">
            <Icon name="Users" size="xl" className="mx-auto mb-3 opacity-30 text-base-content" />
            <Heading level={3} className="text-lg font-bold text-base-content">
              No se encontraron colaboradores
            </Heading>
            <Text size="xs" color="muted" className="mt-1">
              Verifica que haya usuarios asignados a esta sucursal o cambia de sucursal.
            </Text>
          </Box>
        )}

        {!loading && !error && employees.length > 0 && (
          <Grid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} gap="md">
            {employees.map((emp) => (
              <Box
                key={emp.id}
                role="button"
                tabIndex={0}
                onClick={() => selectEmployee(emp)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') selectEmployee(emp);
                }}
                className="bg-base-100 hover:bg-base-200/60 active:scale-95 transition-all p-5 rounded-3xl border border-base-300 shadow-sm hover:shadow-md hover:border-primary/40 flex flex-col items-center text-center cursor-pointer group"
              >
                <Box className="w-16 h-16 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-content transition-all flex items-center justify-center text-2xl font-black mb-3 shadow-xs">
                  {(emp.name || 'U').charAt(0).toUpperCase()}
                </Box>
                <Heading level={3} className="text-base font-bold text-base-content leading-tight line-clamp-1 m-0">
                  {emp.name || 'Colaborador'}
                </Heading>
                <Text size="xs" color="muted" weight="semibold" className="capitalize mt-0.5 mb-3">
                  {emp.role || 'Personal'}
                </Text>
                <Box className="mt-auto">
                  {getStatusBadge(emp)}
                </Box>
              </Box>
            ))}
          </Grid>
        )}
      </Box>

      {/* PIN & Clock Action Modal */}
      {selectedEmployee && (
        <Modal
          isOpen={Boolean(selectedEmployee)}
          onClose={() => {
            if (!clocking) {
              selectEmployee(null);
            }
          }}
          title={`Marcar Asistencia: ${selectedEmployee.name}`}
          maxWidth="max-w-md"
        >
          <Box className="space-y-5">
            {actionSuccess ? (
              <Box className="py-8 text-center space-y-3">
                <Box className="w-16 h-16 rounded-full bg-success/20 text-success flex items-center justify-center mx-auto shadow-sm">
                  <Icon name="CheckCheck" size="xl" />
                </Box>
                <Heading level={3} className="text-xl font-black text-base-content">
                  ¡Turno Registrado con Éxito!
                </Heading>
                <Text size="sm" weight="semibold" className="text-base-content/70">
                  {actionSuccess.message || `Acción: ${actionSuccess.action}`}
                </Text>
                <Text size="xs" color="muted" className="font-mono block">
                  {new Date(actionSuccess.recordedAt).toLocaleString('es-MX')}
                </Text>
              </Box>
            ) : (
              <>
                {/* Employee Card Preview */}
                <Flex align="center" gap="md" className="bg-base-200/60 p-3.5 rounded-2xl border border-base-300">
                  <Box className="w-12 h-12 rounded-xl bg-primary text-primary-content flex items-center justify-center font-bold text-lg">
                    {selectedEmployee.name.charAt(0).toUpperCase()}
                  </Box>
                  <Box>
                    <Heading level={4} className="font-bold text-base-content text-sm m-0">
                      {selectedEmployee.name}
                    </Heading>
                    <Text size="xs" color="muted" className="capitalize">
                      {selectedEmployee.role}
                    </Text>
                  </Box>
                  <Box className="ml-auto">
                    {getStatusBadge(selectedEmployee)}
                  </Box>
                </Flex>

                {/* PIN Display (4 Dots) */}
                <Box className="text-center">
                  <Text size="xs" weight="bold" color="muted" className="uppercase tracking-wider block mb-2">
                    Ingresa tu PIN de 4 dígitos
                  </Text>
                  <Flex justify="center" gap="sm">
                    {[0, 1, 2, 3].map((idx) => (
                      <Box
                        key={idx}
                        className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-mono font-bold transition-all ${
                          pin.length > idx
                            ? 'border-primary bg-primary/10 text-primary scale-105'
                            : 'border-base-300 bg-base-200/40 text-base-content/30'
                        }`}
                      >
                        {pin.length > idx ? '●' : ''}
                      </Box>
                    ))}
                  </Flex>
                </Box>

                {error && (
                  <Flex align="center" gap="xs" className="alert alert-error text-xs py-2">
                    <Icon name="AlertCircle" size="xs" />
                    <Text size="xs">{error}</Text>
                  </Flex>
                )}

                {/* Numeric Virtual Keypad (0-9) */}
                <Box className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <SecondaryButton
                      key={digit}
                      size="lg"
                      disabled={clocking}
                      onClick={() => appendPinDigit(digit)}
                      className="text-xl font-bold font-mono h-14 rounded-2xl active:scale-90"
                    >
                      {digit}
                    </SecondaryButton>
                  ))}
                  <SecondaryButton
                    size="lg"
                    disabled={clocking || pin.length === 0}
                    onClick={clearPin}
                    className="text-xs font-bold uppercase h-14 rounded-2xl"
                  >
                    Borrar
                  </SecondaryButton>
                  <SecondaryButton
                    size="lg"
                    disabled={clocking}
                    onClick={() => appendPinDigit('0')}
                    className="text-xl font-bold font-mono h-14 rounded-2xl active:scale-90"
                  >
                    0
                  </SecondaryButton>
                  <SecondaryButton
                    size="lg"
                    disabled={clocking || pin.length === 0}
                    onClick={deletePinDigit}
                    className="h-14 rounded-2xl"
                    iconStart={<Icon name="Delete" size="sm" />}
                  />
                </Box>

                {/* Action Buttons */}
                <Stack gap="xs" className="pt-2">
                  <Grid cols={2} gap="xs">
                    <PrimaryButton
                      color="success"
                      disabled={clocking || pin.length !== 4}
                      onClick={() => handleClockAction('clock-in')}
                      iconStart={<Icon name="LogIn" size="sm" />}
                      className="font-bold py-3 rounded-xl shadow-xs"
                    >
                      Entrada
                    </PrimaryButton>

                    <PrimaryButton
                      color="error"
                      disabled={clocking || pin.length !== 4}
                      onClick={() => handleClockAction('clock-out')}
                      iconStart={<Icon name="LogOut" size="sm" />}
                      className="font-bold py-3 rounded-xl shadow-xs"
                    >
                      Salida
                    </PrimaryButton>
                  </Grid>

                  <Grid cols={2} gap="xs">
                    <PrimaryButton
                      color="warning"
                      disabled={clocking || pin.length !== 4}
                      onClick={() => handleClockAction('break-start')}
                      iconStart={<Icon name="Coffee" size="xs" />}
                      className="font-bold text-xs rounded-xl shadow-xs"
                    >
                      Iniciar Comida
                    </PrimaryButton>

                    <PrimaryButton
                      color="info"
                      disabled={clocking || pin.length !== 4}
                      onClick={() => handleClockAction('break-end')}
                      iconStart={<Icon name="Play" size="xs" />}
                      className="font-bold text-xs rounded-xl shadow-xs"
                    >
                      Fin Comida
                    </PrimaryButton>
                  </Grid>
                </Stack>
              </>
            )}
          </Box>
        </Modal>
      )}
    </Box>
  );
};

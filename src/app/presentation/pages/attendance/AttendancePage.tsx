import React, { useState, useEffect, useMemo } from 'react';
import {
  Icon,
  PageLayout,
  PrimaryButton,
  SecondaryButton,
  TertiaryButton,
  TextInput,
  Select,
  Box,
  Flex,
  Grid,
  Stack,
  Heading,
  Text,
  Badge,
} from '@/app/presentation/components';
import { useAuthStore } from '@/app/presentation/stores';
import { userRepository, adminRepository, attendanceRepository } from '@/core/di/container';
import { AttendanceWidget } from '@/app/presentation/components';
import { UserBreakdownModal } from '@/app/presentation/components';
import { EditAttendanceModal } from '@/app/presentation/components';
import type { Branch } from '@/app/domain';
import type { User } from '@/app/domain';
import type {
  AttendanceRecord,
  AttendancePeriodSummary,
  AttendanceUserSummary,
  BranchTodayStatus,
  BranchTodayUserStatus,
} from '@/app/domain';
import { MODULE_THEMES } from '@/core';

const ROLE_TRANSLATIONS: Record<string, string> = {
  admin: 'Administrador',
  administrator: 'Administrador',
  mechanic: 'Mecánico',
  warehouse: 'Almacén',
  receptionist: 'Recepción',
  reception: 'Recepción',
  cashier: 'Cajero',
  seller: 'Vendedor',
  vendor: 'Vendedor',
  salesperson: 'Vendedor',
  sales: 'Ventas',
  customer: 'Cliente',
  user: 'Usuario',
};

const translateRoleName = (rawRole?: unknown): string => {
  if (!rawRole) return 'Colaborador';
  let rawName = '';
  if (typeof rawRole === 'string') rawName = rawRole;
  else if (typeof rawRole === 'object' && rawRole !== null && 'name' in rawRole) {
    rawName = String((rawRole as { name?: unknown }).name || '');
  }

  if (!rawName) return 'Colaborador';
  const lower = rawName.toLowerCase().trim();
  if (ROLE_TRANSLATIONS[lower]) return ROLE_TRANSLATIONS[lower];
  if (/^[0-9a-fA-F]{24}$/.test(lower)) return 'Colaborador';
  return rawName;
};

interface AttendanceLiveHeaderCardProps {
  activeBranchName: string;
}

const AttendanceLiveHeaderCard: React.FC<AttendanceLiveHeaderCardProps> = React.memo(({ activeBranchName }) => {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDate = (date: Date) => {
    const formatted = date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  return (
    <Box className="bg-base-100 rounded-DEFAULT border border-base-300 p-5">
      <Flex justify="between" align="center" wrap="wrap" gap="md">
        <Box>
          <Flex align="center" gap="sm" className="mb-1">
            <Flex align="center" justify="center" className="w-8 h-8 rounded-DEFAULT bg-warning/10 border border-warning/20">
              <Icon name={MODULE_THEMES.attendance.icon as 'Clock'} size="sm" color={MODULE_THEMES.attendance.badgeColor} />
            </Flex>
            <Heading level={5} className="font-bold">
              Estación de Asistencia - {activeBranchName}
            </Heading>
          </Flex>
          <Text size="sm" color="muted">{formatDate(now)}</Text>
        </Box>

        <Box className="bg-base-200 px-4 py-2 rounded-DEFAULT border border-base-300 text-right">
          <Text weight="bold" className="font-mono text-xl block">
            {formatTime(now)}
          </Text>
          <Text size="xs" color="muted" className="uppercase tracking-wider">Hora Servidor</Text>
        </Box>
      </Flex>
    </Box>
  );
});

export const AttendancePage: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const activeBranchId = useAuthStore((s) => s.activeBranchId);

  // Role check for current logged-in user
  const isAdmin = useMemo(() => {
    if (!user) return false;
    const roleVal = typeof user.role === 'string' ? user.role : (user.role as { name?: string })?.name;
    if (typeof roleVal === 'string') {
      const r = roleVal.toLowerCase();
      return r === 'admin' || r === 'administrator';
    }
    return false;
  }, [user]);

  // Navigation tab: 'my-clock' | 'admin-dashboard'
  const [activeTab, setActiveTab] = useState<'my-clock' | 'admin-dashboard'>('my-clock');

  // Branch list for filtering
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  // Active Branch Users for Kiosk Mode
  const [branchUsers, setBranchUsers] = useState<User[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState<boolean>(true);

  // Helper for YYYY-MM-DD date string
  const toLocalYYYYMMDD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Unified Period & Employee Filter state (default is 'today')
  const [adminPeriod, setAdminPeriod] = useState<'today' | 'yesterday' | 'weekly' | 'biweekly' | 'monthly' | 'custom'>('today');
  const [selectedUserIdFilter, setSelectedUserIdFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [summaryData, setSummaryData] = useState<AttendancePeriodSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);

  // Admin branch status state for single day queries (today / yesterday)
  const [todayBranchStatus, setTodayBranchStatus] = useState<BranchTodayStatus | null>(null);
  const [isTodayBranchLoading, setIsTodayBranchLoading] = useState<boolean>(false);

  // Admin global records log state
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isRecordsLoading, setIsRecordsLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [selectedUserForBreakdown, setSelectedUserForBreakdown] = useState<{ id: string; name: string } | null>(null);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState<boolean>(false);
  const [selectedRecordForEdit, setSelectedRecordForEdit] = useState<AttendanceRecord | null>(null);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);

  // Global Error state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch all users & filter for active branch (excluding soft-deleted / inactive users)
  useEffect(() => {
    const loadUsersAndBranch = async () => {
      setIsUsersLoading(true);
      try {
        if (!accessToken) return;
        const rawUsers = await userRepository.getUsers(accessToken);
        const allBranches = await adminRepository.getBranches();
        setBranches(allBranches || []);

        const activeUsersOnly = (rawUsers || []).filter((u: User) => u.isActive !== false);

        if (activeBranchId && activeBranchId !== '000000000000000000000000') {
          const filtered = activeUsersOnly.filter((u: User) => {
            if (!u.branches || u.branches.length === 0) return true;
            const bIds = u.branches.map((b: unknown) => (typeof b === 'object' && b !== null ? (b as { id?: string; _id?: string }).id || (b as { id?: string; _id?: string })._id : b));
            return bIds.includes(activeBranchId);
          });
          setBranchUsers(filtered.length > 0 ? filtered : activeUsersOnly);
        } else {
          setBranchUsers(activeUsersOnly);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsUsersLoading(false);
      }
    };

    loadUsersAndBranch();
  }, [accessToken, activeBranchId]);

  // Load Admin Data based on unified period filter
  const loadAdminDashboardData = async () => {
    if (!isAdmin) return;
    setIsTodayBranchLoading(true);
    setIsSummaryLoading(true);
    setIsRecordsLoading(true);
    setErrorMsg(null);

    let queryDate: string | undefined = undefined;
    if (adminPeriod === 'today') {
      queryDate = toLocalYYYYMMDD(new Date());
    } else if (adminPeriod === 'yesterday') {
      const yd = new Date();
      yd.setDate(yd.getDate() - 1);
      queryDate = toLocalYYYYMMDD(yd);
    }

    // 1. Fetch Single-Day Status (for today or yesterday)
    if (adminPeriod === 'today' || adminPeriod === 'yesterday') {
      try {
        const bStatus = await attendanceRepository.getBranchTodayStatus(
          selectedBranchId !== 'all' ? selectedBranchId : (activeBranchId || undefined),
          queryDate
        );
        setTodayBranchStatus(bStatus);
      } catch (err) {
        console.error('Error al obtener la asistencia del día:', err);
        setTodayBranchStatus(null);
      } finally {
        setIsTodayBranchLoading(false);
      }
    }

    // 2. Fetch Multi-day Period Summary & Records
    if (adminPeriod !== 'today' && adminPeriod !== 'yesterday') {
      try {
        const summary = await attendanceRepository.getAdminSummary({
          branchId: selectedBranchId !== 'all' ? selectedBranchId : undefined,
          period: adminPeriod,
          startDate: adminPeriod === 'custom' ? startDate : undefined,
          endDate: adminPeriod === 'custom' ? endDate : undefined,
        });
        setSummaryData(summary || { period: 'weekly', range: { startDate: '', endDate: '' }, usersSummary: [] });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al obtener el resumen de asistencia';
        setErrorMsg(msg);
        setSummaryData({ period: 'weekly', range: { startDate: '', endDate: '' }, usersSummary: [] });
      } finally {
        setIsSummaryLoading(false);
      }

      try {
        const globalRecs = await attendanceRepository.getAdminRecords({
          branchId: selectedBranchId !== 'all' ? selectedBranchId : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          startDate: adminPeriod === 'custom' ? startDate : undefined,
          endDate: adminPeriod === 'custom' ? endDate : undefined,
        });
        setRecords(globalRecs || []);
      } catch (err) {
        console.error(err);
        setRecords([]);
      } finally {
        setIsRecordsLoading(false);
      }
    } else {
      setIsSummaryLoading(false);
      setIsRecordsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && activeTab === 'admin-dashboard') {
      loadAdminDashboardData();
    }
    // eslint-disable-next-line
  }, [isAdmin, activeTab, selectedBranchId, adminPeriod, statusFilter]);

  const handleCustomFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPeriod === 'custom') {
      loadAdminDashboardData();
    }
  };

  const handleOpenBreakdown = (userRef: { userId: string; userName: string }) => {
    setSelectedUserForBreakdown({ id: userRef.userId, name: userRef.userName });
    setIsBreakdownOpen(true);
  };

  const handleOpenEdit = (rec: AttendanceRecord) => {
    setSelectedRecordForEdit(rec);
    setIsEditOpen(true);
  };

  const formatMinutes = (totalMin: number = 0) => {
    const mins = Math.max(0, Math.floor(totalMin));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m < 10 ? '0' : ''}${m}m`;
  };

  const activeBranchName = useMemo(() => {
    if (!activeBranchId || branches.length === 0) return 'Sucursal Activa';
    const found = branches.find(b => (b.id === activeBranchId || (b as { _id?: string })._id === activeBranchId));
    return found ? found.name : 'Sucursal Activa';
  }, [activeBranchId, branches]);

  // Filter out ADMIN users & inactive users from checador cards
  const nonAdminBranchUsers = useMemo(() => {
    return branchUsers.filter((u) => {
      if (u.isActive === false) return false;
      const roleVal = typeof u.role === 'string' ? u.role : (u.role as { name?: string })?.name;
      if (typeof roleVal === 'string') {
        const r = roleVal.toLowerCase();
        return r !== 'admin' && r !== 'administrator';
      }
      return true;
    });
  }, [branchUsers]);

  // Safe arrays for mapping
  const safeUserSummary = useMemo(() => {
    return Array.isArray(summaryData?.usersSummary)
      ? summaryData.usersSummary.filter((u: AttendanceUserSummary) => (u as unknown as { isActive?: boolean }).isActive !== false)
      : [];
  }, [summaryData]);

  const safeRecords = Array.isArray(records) ? records : [];

  // Filtered single-day users list (excluding admins when 'all' is selected)
  const filteredTodayUsers = useMemo(() => {
    if (!todayBranchStatus?.users) return [];
    return todayBranchStatus.users.filter((uItem: BranchTodayUserStatus) => {
      const uObj = (typeof uItem.user === 'object' && uItem.user !== null) ? uItem.user : null;
      if (uObj?.isActive === false) return false;

      const uId = uObj?._id || uObj?.id || (typeof uItem.user === 'string' ? uItem.user : '') || uItem.userId || '';

      const matchedLocal = branchUsers.find(b => (b as { _id?: string })._id === uId || b.id === uId);
      const rawRoleVal = (uObj as { role?: string | { name?: string } })?.role || matchedLocal?.role;
      const rName = (typeof rawRoleVal === 'string' ? rawRoleVal : String((rawRoleVal as { name?: string })?.name || '')).toLowerCase().trim();
      const isAdminRole = rName === 'admin' || rName === 'administrator';

      if (selectedUserIdFilter !== 'all') {
        return uId === selectedUserIdFilter;
      }

      if (isAdminRole) return false;

      return true;
    });
  }, [todayBranchStatus, branchUsers, selectedUserIdFilter]);

  const todayWorkingCount = useMemo(() => {
    return filteredTodayUsers.filter((u) => u.status === 'working' || u.status === 'completed').length;
  }, [filteredTodayUsers]);

  const todayOnBreakCount = useMemo(() => {
    return filteredTodayUsers.filter((u) => u.status === 'onBreak').length;
  }, [filteredTodayUsers]);

  const todayOffShiftCount = useMemo(() => {
    return filteredTodayUsers.filter((u) => u.status !== 'working' && u.status !== 'completed' && u.status !== 'onBreak').length;
  }, [filteredTodayUsers]);

  // Filtered multi-day period summary list (excluding admins when 'all' is selected)
  const filteredUserSummary = useMemo(() => {
    return safeUserSummary.filter((u: AttendanceUserSummary) => {
      if (selectedUserIdFilter !== 'all') {
        return u.userId === selectedUserIdFilter;
      }
      const matchedLocal = branchUsers.find(b => (b as { _id?: string })._id === u.userId || b.id === u.userId);
      const rawRoleVal = matchedLocal?.role;
      const rName = (typeof rawRoleVal === 'string' ? rawRoleVal : String((rawRoleVal as { name?: string })?.name || '')).toLowerCase().trim();
      if (rName === 'admin' || rName === 'administrator') return false;
      return true;
    });
  }, [safeUserSummary, selectedUserIdFilter, branchUsers]);

  return (
    <PageLayout userName={user?.name || 'Usuario'}>

        {/* Top Header */}
        <Box as="header" className="bg-base-100 px-7 py-4 border-b border-base-300">
          <Flex justify="between" align="center">
            <Heading level={4} className="font-bold">Control de Asistencia y Horarios</Heading>
            <Badge variant={isAdmin ? 'primary' : 'info'} size="md">
              {isAdmin ? 'Administrador' : 'Colaborador'}
            </Badge>
          </Flex>
        </Box>

        {/* Global Error Alert Banner */}
        {errorMsg && (
          <Box className="mx-7 mt-5 p-4 bg-error/15 border border-error/30 rounded-DEFAULT">
            <Flex justify="between" align="center">
              <Flex align="center" gap="sm">
                <Icon name="AlertCircle" size="sm" className="text-error" />
                <Text size="sm" className="text-error font-medium">{errorMsg}</Text>
              </Flex>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-error hover:opacity-75 cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            </Flex>
          </Box>
        )}

        {/* Tabs Bar (Only visible to Admin) */}
        {isAdmin && (
          <Box className="bg-base-100 border-b border-base-300 px-7">
            <Flex gap="lg">
              <button
                type="button"
                onClick={() => setActiveTab('my-clock')}
                className={`py-4 border-b-2 font-semibold text-sm cursor-pointer transition-colors ${
                  activeTab === 'my-clock'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-base-content/60 hover:text-base-content'
                }`}
              >
                <Flex align="center" gap="xs">
                  <Icon name="Clock" size="sm" />
                  Terminal de Asistencia (Kiosco)
                </Flex>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('admin-dashboard')}
                className={`py-4 border-b-2 font-semibold text-sm cursor-pointer transition-colors ${
                  activeTab === 'admin-dashboard'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-base-content/60 hover:text-base-content'
                }`}
              >
                <Flex align="center" gap="xs">
                  <Icon name="Shield" size="sm" />
                  Panel de Gestión y Registros
                </Flex>
              </button>
            </Flex>
          </Box>
        )}

        <Box className="p-7 max-w-7xl mx-auto w-full">

          {/* TAB 1: Checador por Colaborador */}
          {(activeTab === 'my-clock' || !isAdmin) && (
            <Stack spacing="lg">

              {/* Header Card con Reloj Aislado */}
              <AttendanceLiveHeaderCard activeBranchName={activeBranchName} />

              {/* Employee Cards List */}
              {isUsersLoading ? (
                <Box className="py-10 text-center">
                  <Text color="muted">Cargando personal de la sucursal...</Text>
                </Box>
              ) : nonAdminBranchUsers.length === 0 ? (
                <Box className="py-10 text-center bg-base-100 rounded-DEFAULT border border-base-300">
                  <Text color="muted" size="sm">No hay colaboradores activos registrados para marcar en esta sucursal.</Text>
                </Box>
              ) : (
                <Stack spacing="md">
                  {nonAdminBranchUsers.map((emp) => {
                    const empId = String(emp.id || (emp as { _id?: string })._id || '');
                    return (
                      <AttendanceWidget
                        key={empId}
                        userId={empId}
                        userName={emp.name}
                        userRole={translateRoleName(typeof emp.role === 'object' ? emp.role?.name : emp.role)}
                        showWorkHours={isAdmin}
                      />
                    );
                  })}
                </Stack>
              )}

            </Stack>
          )}

          {/* TAB 2: Dashboard Administrativo (Strictly Admin Only) */}
          {isAdmin && activeTab === 'admin-dashboard' && (
            <Stack spacing="lg">

              {/* Unified Admin Toolbar */}
              <Box className="bg-base-100 rounded-DEFAULT border border-base-300 p-5">
                <Flex wrap="wrap" align="end" justify="between" gap="md">
                  <Flex wrap="wrap" align="end" gap="md">

                    {/* 1. Branch selector */}
                    <Box>
                      <Text size="xs" weight="bold" color="muted" className="uppercase mb-1.5 block">Sucursal</Text>
                      <Select
                        size="sm"
                        fullWidth={false}
                        className="min-w-[180px] font-medium"
                        value={selectedBranchId}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        options={[
                          { value: 'all', label: 'Todas las Sucursales' },
                          ...branches.map((b) => ({
                            value: b.id || (b as { _id?: string })._id || '',
                            label: b.name,
                          })),
                        ]}
                      />
                    </Box>

                    {/* 2. Unified Period Filter */}
                    <Box>
                      <Text size="xs" weight="bold" color="muted" className="uppercase mb-1.5 block">Periodo de Consulta</Text>
                      <Select
                        size="sm"
                        fullWidth={false}
                        className="min-w-[170px] font-semibold"
                        value={adminPeriod}
                        onChange={(e) => setAdminPeriod(e.target.value as 'today' | 'yesterday' | 'weekly' | 'biweekly' | 'monthly' | 'custom')}
                        options={[
                          { value: 'today', label: '📅 Hoy' },
                          { value: 'yesterday', label: '⏪ Ayer' },
                          { value: 'weekly', label: '📊 Semanal (7 días)' },
                          { value: 'biweekly', label: '📆 Quincenal (15 días)' },
                          { value: 'monthly', label: '🗓️ Mensual (Este mes)' },
                          { value: 'custom', label: '⚙️ Personalizado' },
                        ]}
                      />
                    </Box>

                    {/* Custom dates if period === 'custom' */}
                    {adminPeriod === 'custom' && (
                      <Box as="form" onSubmit={handleCustomFilterSubmit} className="flex items-end gap-2">
                        <Box>
                          <Text size="xs" color="muted" className="mb-1 block">Desde</Text>
                          <TextInput
                            type="date"
                            size="sm"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                          />
                        </Box>
                        <Box>
                          <Text size="xs" color="muted" className="mb-1 block">Hasta</Text>
                          <TextInput
                            type="date"
                            size="sm"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                          />
                        </Box>
                        <PrimaryButton type="submit" size="sm">Filtrar</PrimaryButton>
                      </Box>
                    )}

                    {/* 3. Colaborador Filter */}
                    <Box>
                      <Text size="xs" weight="bold" color="muted" className="uppercase mb-1.5 block">Colaborador</Text>
                      <Select
                        size="sm"
                        fullWidth={false}
                        className="min-w-[210px] font-medium"
                        value={selectedUserIdFilter}
                        onChange={(e) => setSelectedUserIdFilter(e.target.value)}
                        options={[
                          { value: 'all', label: '👤 Todos los colaboradores' },
                          ...branchUsers.map((u) => {
                            const uId = u.id || (u as { _id?: string })._id || '';
                            return {
                              value: uId,
                              label: `${u.name} (${translateRoleName(u.role)})`,
                            };
                          }),
                        ]}
                      />
                    </Box>
                  </Flex>

                  <SecondaryButton onClick={loadAdminDashboardData} size="sm" iconStart={<Icon name="RefreshCw" size="xs" />}>
                    Actualizar
                  </SecondaryButton>
                </Flex>
              </Box>

              {errorMsg && (
                <Box className="p-3 bg-error/10 border border-error/20 rounded-DEFAULT">
                  <Text size="sm" color="error">{errorMsg}</Text>
                </Box>
              )}

              {/* SINGLE DAY VIEW: Hoy / Ayer */}
              {(adminPeriod === 'today' || adminPeriod === 'yesterday') && (
                <Box className="bg-base-100 rounded-DEFAULT border border-base-300 p-5">
                  <Flex justify="between" align="center" className="mb-4" wrap="wrap" gap="sm">
                    <Box>
                      <Heading level={5} className="font-bold">
                        Estado del Personal ({adminPeriod === 'today' ? 'Hoy' : 'Ayer'})
                      </Heading>
                      <Text size="xs" color="muted">
                        {adminPeriod === 'today' ? 'Monitoreo en tiempo real de asistencia del día' : 'Registro de asistencias y faltas del día de ayer'}
                      </Text>
                    </Box>
                  </Flex>

                  {isTodayBranchLoading ? (
                    <Box className="py-8 text-center">
                      <Text color="muted">Cargando estado de asistencia...</Text>
                    </Box>
                  ) : (
                    <>
                      {/* Single day KPI summary */}
                      <Grid cols={3} gap="sm" className="mb-5">
                        <Box className="bg-success/10 border border-success/20 rounded-DEFAULT p-3">
                          <Text size="xs" weight="bold" color="success" className="uppercase block">Trabajando / Asistió</Text>
                          <Text weight="bold" className="text-2xl text-success font-mono">
                            {todayWorkingCount}
                          </Text>
                        </Box>
                        <Box className="bg-warning/10 border border-warning/20 rounded-DEFAULT p-3">
                          <Text size="xs" weight="bold" color="warning" className="uppercase block">En Descanso</Text>
                          <Text weight="bold" className="text-2xl text-warning font-mono">{todayOnBreakCount}</Text>
                        </Box>
                        <Box className={adminPeriod === 'today' ? 'bg-base-200 border border-base-300 rounded-DEFAULT p-3' : 'bg-error/10 border border-error/20 rounded-DEFAULT p-3'}>
                          <Text size="xs" weight="bold" color={adminPeriod === 'today' ? 'muted' : 'error'} className="uppercase block">
                            {adminPeriod === 'today' ? 'Sin Iniciar' : 'Faltas / Ausencias'}
                          </Text>
                          <Text weight="bold" className={adminPeriod === 'today' ? 'text-2xl text-base-content font-mono' : 'text-2xl text-error font-mono'}>
                            {todayOffShiftCount}
                          </Text>
                        </Box>
                      </Grid>

                      <Text size="xs" color="muted" className="mb-3 italic block">
                        💡 Haz clic en cualquier colaborador para desplegar sus detalles completos y desglose de horas.
                      </Text>

                      {/* Single day user table */}
                      {filteredTodayUsers.length > 0 ? (
                        <Box className="overflow-x-auto">
                          <Box as="table" className="table w-full border-collapse">
                            <Box as="thead" className="bg-base-200/50 border-b border-base-300">
                              <Box as="tr">
                                <Box as="th" className="py-2.5 px-3.5 text-left text-xs font-semibold text-base-content/60 uppercase">Colaborador</Box>
                                <Box as="th" className="py-2.5 px-3.5 text-left text-xs font-semibold text-base-content/60 uppercase">Estado de Asistencia</Box>
                                <Box as="th" className="py-2.5 px-3.5 text-left text-xs font-semibold text-base-content/60 uppercase">Hora Entrada</Box>
                                <Box as="th" className="py-2.5 px-3.5 text-left text-xs font-semibold text-base-content/60 uppercase">Hora Salida</Box>
                                <Box as="th" className="py-2.5 px-3.5 text-left text-xs font-semibold text-base-content/60 uppercase">Tiempo Trabajado</Box>
                                <Box as="th" className="py-2.5 px-3.5 text-left text-xs font-semibold text-base-content/60 uppercase">Descanso Acumulado</Box>
                                <Box as="th" className="py-2.5 px-3.5 text-right text-xs font-semibold text-base-content/60 uppercase">Acción</Box>
                              </Box>
                            </Box>
                            <Box as="tbody">
                              {filteredTodayUsers.map((uItem, index) => {
                                const uObj = (typeof uItem.user === 'object' && uItem.user !== null) ? uItem.user : null;
                                const uId = uObj?._id || uObj?.id || (typeof uItem.user === 'string' ? uItem.user : '') || uItem.userId || '';

                                const matchedLocal = branchUsers.find(b => (b as { _id?: string })._id === uId || b.id === uId);
                                const uName = uObj?.name || (uObj as { username?: string })?.username || matchedLocal?.name || 'Colaborador';
                                const rawRoleVal = (uObj as { role?: string | { name?: string } })?.role || matchedLocal?.role;
                                const roleTitle = translateRoleName(rawRoleVal);

                                let statusVariant: 'neutral' | 'success' | 'warning' | 'info' | 'error' = 'neutral';
                                let statusLabel = '⚪ Sin Iniciar';

                                if (uItem.status === 'working') {
                                  statusVariant = 'success';
                                  statusLabel = '🟢 Trabajando';
                                } else if (uItem.status === 'onBreak') {
                                  statusVariant = 'warning';
                                  statusLabel = '⏸️ En Descanso';
                                } else if (uItem.status === 'completed') {
                                  statusVariant = 'info';
                                  statusLabel = '🏁 Turno Concluido';
                                } else if (adminPeriod === 'yesterday') {
                                  statusVariant = 'error';
                                  statusLabel = '🔴 Faltó / Ausente';
                                }

                                const clockInTime = uItem.attendance?.clockIn
                                  ? new Date(uItem.attendance.clockIn).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })
                                  : '-';

                                const clockOutTime = uItem.attendance?.clockOut
                                  ? new Date(uItem.attendance.clockOut).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true })
                                  : uItem.attendance?.clockIn
                                  ? 'En Turno'
                                  : '-';

                                return (
                                  <Box
                                    as="tr"
                                    key={uId || `today-user-${index}`}
                                    onClick={() => {
                                      if (uId) {
                                        handleOpenBreakdown({ userId: uId, userName: uName });
                                      }
                                    }}
                                    className="border-b border-base-200 hover:bg-base-200/40 cursor-pointer transition-colors"
                                  >
                                    <Box as="td" className="py-3 px-3.5">
                                      <Text weight="semibold" className="text-sm block">{uName}</Text>
                                      <Text size="xs" color="muted">{roleTitle}</Text>
                                    </Box>
                                    <Box as="td" className="py-3 px-3.5">
                                      <Badge variant={statusVariant} size="sm">
                                        {statusLabel}
                                      </Badge>
                                    </Box>
                                    <Box as="td" className="py-3 px-3.5 font-mono text-sm">
                                      {clockInTime}
                                    </Box>
                                    <Box as="td" className="py-3 px-3.5 font-mono text-sm">
                                      {clockOutTime}
                                    </Box>
                                    <Box as="td" className="py-3 px-3.5 font-mono text-sm font-bold text-success">
                                      {formatMinutes(uItem.netWorkMinutes || uItem.currentWorkMinutes || 0)}
                                    </Box>
                                    <Box as="td" className="py-3 px-3.5 font-mono text-sm text-warning font-semibold">
                                      {formatMinutes(uItem.totalBreakMinutes || 0)}
                                    </Box>
                                    <Box as="td" className="py-3 px-3.5 text-right">
                                      <TertiaryButton size="xs" color="primary">
                                        Ver detalles →
                                      </TertiaryButton>
                                    </Box>
                                  </Box>
                                );
                              })}
                            </Box>
                          </Box>
                        </Box>
                      ) : (
                        <Box className="p-4 text-center">
                          <Text color="muted" size="sm">No hay colaboradores activos registrados para este día.</Text>
                        </Box>
                      )}
                    </>
                  )}
                </Box>
              )}

              {/* MULTI-DAY PERIOD REPORT VIEW: Semanal, Quincenal, Mensual, Custom */}
              {adminPeriod !== 'today' && adminPeriod !== 'yesterday' && (
                <Stack spacing="lg">
                  {/* KPI Cards Grid for Period */}
                  <Grid cols={4} gap="md">
                    <Box className="bg-base-100 rounded-DEFAULT border border-base-300 p-5">
                      <Text size="xs" weight="semibold" color="muted" className="uppercase block mb-2">Horas Netas Trabajadas</Text>
                      <Text weight="bold" className="text-2xl text-success font-mono">
                        {formatMinutes(
                          filteredUserSummary.reduce((acc, u) => acc + (u.netWorkMinutes || 0), 0)
                        )}
                      </Text>
                    </Box>

                    <Box className="bg-base-100 rounded-DEFAULT border border-base-300 p-5">
                      <Text size="xs" weight="semibold" color="muted" className="uppercase block mb-2">Tiempo de Comida</Text>
                      <Text weight="bold" className="text-2xl text-warning font-mono">
                        {formatMinutes(
                          filteredUserSummary.reduce((acc, u) => acc + (u.totalBreakMinutes || 0), 0)
                        )}
                      </Text>
                    </Box>

                    <Box className="bg-base-100 rounded-DEFAULT border border-base-300 p-5">
                      <Text size="xs" weight="semibold" color="muted" className="uppercase block mb-2">Turnos Laborados</Text>
                      <Text weight="bold" className="text-2xl font-mono">
                        {filteredUserSummary.reduce((acc, u) => acc + (u.completedShifts || 0), 0)}
                      </Text>
                    </Box>

                    <Box className="bg-base-100 rounded-DEFAULT border border-base-300 p-5">
                      <Text size="xs" weight="semibold" color="muted" className="uppercase block mb-2">Colaboradores Incluidos</Text>
                      <Text weight="bold" className="text-2xl text-primary font-mono">
                        {filteredUserSummary.length}
                      </Text>
                    </Box>
                  </Grid>

                  {/* Users Performance & Payroll Summary Table */}
                  <Box className="bg-base-100 rounded-DEFAULT border border-base-300 overflow-hidden">
                    <Box className="p-4 border-b border-base-300">
                      <Flex justify="between" align="center" wrap="wrap" gap="xs">
                        <Box>
                          <Heading level={5} className="font-bold">
                            Resumen de Asistencia y Rendimiento para Nómina
                          </Heading>
                          {summaryData?.range && (
                            <Text size="xs" color="muted">
                              Periodo: {summaryData.range.startDate} al {summaryData.range.endDate}
                            </Text>
                          )}
                        </Box>
                      </Flex>
                    </Box>

                    {isSummaryLoading ? (
                      <Box className="py-10 text-center">
                        <Text color="muted">Cargando resumen de personal...</Text>
                      </Box>
                    ) : filteredUserSummary.length === 0 ? (
                      <Box className="py-10 text-center">
                        <Text color="muted" size="sm">No se encontraron datos de asistencia para el filtro seleccionado.</Text>
                      </Box>
                    ) : (
                      <Box className="overflow-x-auto">
                        <Box as="table" className="table w-full border-collapse">
                          <Box as="thead" className="bg-base-200/50 border-b border-base-300">
                            <Box as="tr">
                              <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Colaborador</Box>
                              <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Sucursal</Box>
                              <Box as="th" className="py-3 px-4 text-center text-xs font-semibold text-base-content/60 uppercase">Días Trabajados</Box>
                              <Box as="th" className="py-3 px-4 text-center text-xs font-semibold text-base-content/60 uppercase">Ausencias / Faltas</Box>
                              <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Tiempo Comida</Box>
                              <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Horas Netas</Box>
                              <Box as="th" className="py-3 px-4 text-center text-xs font-semibold text-base-content/60 uppercase">Estatus Nómina</Box>
                              <Box as="th" className="py-3 px-4 text-right text-xs font-semibold text-base-content/60 uppercase">Acción</Box>
                            </Box>
                          </Box>
                          <Box as="tbody">
                            {filteredUserSummary.map((uSum) => {
                              const totalPeriodShifts = uSum.totalShifts || 5;
                              const workedShifts = uSum.completedShifts || 0;
                              const absentShifts = Math.max(0, totalPeriodShifts - workedShifts);

                              let payrollVariant: 'success' | 'error' | 'warning' = 'success';
                              let payrollStatusLabel = '🟢 Completo';

                              if (workedShifts === 0) {
                                payrollVariant = 'error';
                                payrollStatusLabel = '🔴 Sin Asistencias';
                              } else if (absentShifts > 0) {
                                payrollVariant = 'warning';
                                payrollStatusLabel = `🟡 ${absentShifts} ${absentShifts === 1 ? 'falta' : 'faltas'}`;
                              }

                              return (
                                <Box
                                  as="tr"
                                  key={uSum.userId}
                                  onClick={() => handleOpenBreakdown({ userId: uSum.userId, userName: uSum.userName })}
                                  className="border-b border-base-200 hover:bg-base-200/40 cursor-pointer transition-colors"
                                >
                                  <Box as="td" className="py-3.5 px-4">
                                    <Text weight="semibold" className="text-sm block">{uSum.userName}</Text>
                                    {uSum.userEmail && <Text size="xs" color="muted">{uSum.userEmail}</Text>}
                                  </Box>
                                  <Box as="td" className="py-3.5 px-4 text-sm text-base-content/80">
                                    {uSum.branchName || 'Matriz'}
                                  </Box>
                                  <Box as="td" className="py-3.5 px-4 text-center font-mono text-sm font-bold text-success">
                                    {workedShifts} / {totalPeriodShifts}
                                  </Box>
                                  <Box as="td" className={`py-3.5 px-4 text-center font-mono text-sm font-bold ${absentShifts > 0 ? 'text-error' : 'text-base-content/60'}`}>
                                    {absentShifts}
                                  </Box>
                                  <Box as="td" className="py-3.5 px-4 font-mono text-sm text-warning font-semibold">
                                    {formatMinutes(uSum.totalBreakMinutes)}
                                  </Box>
                                  <Box as="td" className="py-3.5 px-4 font-mono text-sm font-bold text-success">
                                    {formatMinutes(uSum.netWorkMinutes)}
                                  </Box>
                                  <Box as="td" className="py-3.5 px-4 text-center">
                                    <Badge variant={payrollVariant} size="sm">
                                      {payrollStatusLabel}
                                    </Badge>
                                  </Box>
                                  <Box as="td" className="py-3.5 px-4 text-right">
                                    <SecondaryButton
                                      size="xs"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenBreakdown({ userId: uSum.userId, userName: uSum.userName });
                                      }}
                                      iconStart={<Icon name="Eye" size="xs" />}
                                    >
                                      Desglose
                                    </SecondaryButton>
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Box>

                  {/* Global Records Log */}
                  <Box className="bg-base-100 rounded-DEFAULT border border-base-300 overflow-hidden">
                    <Box className="p-4 border-b border-base-300">
                      <Flex justify="between" align="center" wrap="wrap" gap="sm">
                        <Heading level={5} className="font-bold">
                          Bitácora Global de Turnos y Ajustes
                        </Heading>

                        <Flex align="center" gap="xs">
                          <Text size="xs" color="muted">Estatus:</Text>
                          <Select
                            size="sm"
                            fullWidth={false}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={[
                              { value: 'all', label: 'Todos los Estatus' },
                              { value: 'working', label: 'En Turno' },
                              { value: 'on_break', label: 'En Descanso' },
                              { value: 'completed', label: 'Completado' },
                            ]}
                          />
                        </Flex>
                      </Flex>
                    </Box>

                    {isRecordsLoading ? (
                      <Box className="py-10 text-center">
                        <Text color="muted">Cargando registros del sistema...</Text>
                      </Box>
                    ) : safeRecords.filter(r => {
                      if (selectedUserIdFilter === 'all') return true;
                      const rUid = typeof r.user === 'object' ? r.user?._id || r.user?.id : r.user;
                      return rUid === selectedUserIdFilter;
                    }).length === 0 ? (
                      <Box className="py-10 text-center">
                        <Text color="muted" size="sm">No hay registros de asistencia en la bitácora.</Text>
                      </Box>
                    ) : (
                      <Box className="overflow-x-auto">
                        <Box as="table" className="table w-full border-collapse">
                          <Box as="thead" className="bg-base-200/50 border-b border-base-300">
                            <Box as="tr">
                              <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Fecha</Box>
                              <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Usuario</Box>
                              <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Entrada</Box>
                              <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Salida</Box>
                              <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Tiempo Comida</Box>
                              <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Horas Netas</Box>
                              <Box as="th" className="py-3 px-4 text-left text-xs font-semibold text-base-content/60 uppercase">Estatus</Box>
                              <Box as="th" className="py-3 px-4 text-right text-xs font-semibold text-base-content/60 uppercase">Acción</Box>
                            </Box>
                          </Box>
                          <Box as="tbody">
                            {safeRecords
                              .filter(r => {
                                if (selectedUserIdFilter === 'all') return true;
                                const rUid = typeof r.user === 'object' ? r.user?._id || r.user?.id : r.user;
                                return rUid === selectedUserIdFilter;
                              })
                              .map((rec) => {
                                const userName = typeof rec.user === 'object' ? rec.user?.name : 'Usuario';
                                const recStatusVariant = rec.status === 'working' ? 'success' : rec.status === 'on_break' ? 'warning' : 'info';
                                const recStatusLabel = rec.status === 'working' ? 'En Turno' : rec.status === 'on_break' ? 'En Comida' : 'Completado';

                                return (
                                  <Box as="tr" key={rec._id || rec.id} className="border-b border-base-200 hover:bg-base-200/40">
                                    <Box as="td" className="py-3.5 px-4 font-mono text-sm font-semibold text-warning">
                                      {rec.date}
                                    </Box>
                                    <Box as="td" className="py-3.5 px-4 text-sm font-semibold">
                                      {userName}
                                    </Box>
                                    <Box as="td" className="py-3.5 px-4 font-mono text-sm">
                                      {new Date(rec.clockIn).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                    </Box>
                                    <Box as="td" className="py-3.5 px-4 font-mono text-sm">
                                      {rec.clockOut
                                        ? new Date(rec.clockOut).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                                        : 'En Turno'}
                                    </Box>
                                    <Box as="td" className="py-3.5 px-4 font-mono text-sm text-warning font-semibold">
                                      {formatMinutes(rec.totalBreakMinutes)}
                                    </Box>
                                    <Box as="td" className="py-3.5 px-4 font-mono text-sm font-bold text-success">
                                      {formatMinutes(rec.netWorkMinutes)}
                                    </Box>
                                    <Box as="td" className="py-3.5 px-4">
                                      <Badge variant={recStatusVariant} size="sm">
                                        {recStatusLabel}
                                      </Badge>
                                    </Box>
                                    <Box as="td" className="py-3.5 px-4 text-right">
                                      <TertiaryButton
                                        size="xs"
                                        color="primary"
                                        onClick={() => handleOpenEdit(rec)}
                                        title="Ajuste manual de horas (Admin)"
                                      >
                                        <Icon name="Edit3" size="sm" />
                                      </TertiaryButton>
                                    </Box>
                                  </Box>
                                );
                              })}
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Stack>
              )}

            </Stack>
          )}
        </Box>

        {/* User Breakdown Modal */}
        {selectedUserForBreakdown && (
          <UserBreakdownModal
            isOpen={isBreakdownOpen}
            onClose={() => {
              setIsBreakdownOpen(false);
              setSelectedUserForBreakdown(null);
            }}
            userId={selectedUserForBreakdown.id}
            userName={selectedUserForBreakdown.name}
          />
        )}

        {/* Edit Attendance Modal */}
        {selectedRecordForEdit && (
          <EditAttendanceModal
            isOpen={isEditOpen}
            onClose={() => {
              setIsEditOpen(false);
              setSelectedRecordForEdit(null);
            }}
            record={selectedRecordForEdit}
            onSuccess={loadAdminDashboardData}
          />
        )}
    </PageLayout>
  );
};

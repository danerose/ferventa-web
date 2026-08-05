import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, Sidebar, PrimaryButton, SecondaryButton } from '../components';
import { useAuthStore } from '../../../core/stores/useAuthStore';
import { APIUserRepository } from '../../data/repositories/APIUserRepository';
import { APIAdminRepository } from '../../data/repositories/APIAdminRepository';
import { APIAttendanceRepository } from '../../data/repositories/APIAttendanceRepository';
import { AttendanceWidget } from '../components/organisms/AttendanceWidget/AttendanceWidget';
import { UserBreakdownModal } from '../components/organisms/Modals/UserBreakdownModal';
import { EditAttendanceModal } from '../components/organisms/Modals/EditAttendanceModal';
import type { Branch } from '../../domain/entities/AdminEntities';
import type { User } from '../../domain/entities/UserEntities';
import type {
  AttendanceRecord,
  AttendancePeriodSummary,
} from '../../domain/entities/AttendanceEntities';

const userRepo = new APIUserRepository();
const adminRepo = new APIAdminRepository();
const attendanceRepo = new APIAttendanceRepository();

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

const translateRoleName = (rawRole?: any): string => {
  if (!rawRole) return 'Colaborador';
  let rawName = '';
  if (typeof rawRole === 'string') rawName = rawRole;
  else if (typeof rawRole === 'object' && rawRole.name) rawName = String(rawRole.name);

  if (!rawName) return 'Colaborador';
  const lower = rawName.toLowerCase().trim();
  if (ROLE_TRANSLATIONS[lower]) return ROLE_TRANSLATIONS[lower];
  if (/^[0-9a-fA-F]{24}$/.test(lower)) return 'Colaborador';
  return rawName;
};

export const AttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, accessToken, clearAuth, activeBranchId } = useAuthStore();

  // Role check for current logged-in user
  const isAdmin = (() => {
    if (!user) return false;
    const roleVal = (user as any).role;
    if (typeof roleVal === 'string') {
      const r = roleVal.toLowerCase();
      return r === 'admin' || r === 'administrator';
    }
    if (roleVal && typeof roleVal === 'object' && roleVal.name) {
      const r = String(roleVal.name).toLowerCase();
      return r === 'admin' || r === 'administrator';
    }
    return false;
  })();

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
  const [todayBranchStatus, setTodayBranchStatus] = useState<any>(null);
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

  // Real-time clock tick
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUnauthorized = () => {
    clearAuth();
    navigate('/login');
  };

  // Fetch all users & filter for active branch (excluding soft-deleted / inactive users)
  useEffect(() => {
    const loadUsersAndBranch = async () => {
      setIsUsersLoading(true);
      try {
        if (!accessToken) return;
        const rawUsers = await userRepo.getUsers(accessToken);
        const allBranches = await adminRepo.getBranches();
        setBranches(allBranches || []);

        const activeUsersOnly = (rawUsers || []).filter((u: any) => u.isActive !== false);

        if (activeBranchId && activeBranchId !== '000000000000000000000000') {
          const filtered = activeUsersOnly.filter((u: any) => {
            if (!u.branches || u.branches.length === 0) return true;
            const bIds = u.branches.map((b: any) => (typeof b === 'object' ? b.id || b._id : b));
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
        const bStatus = await attendanceRepo.getBranchTodayStatus(
          selectedBranchId !== 'all' ? selectedBranchId : (activeBranchId || undefined),
          queryDate
        );
        setTodayBranchStatus(bStatus);
      } catch (err: any) {
        console.error('Error al obtener la asistencia del día:', err);
        setTodayBranchStatus(null);
      } finally {
        setIsTodayBranchLoading(false);
      }
    }

    // 2. Fetch Multi-day Period Summary & Records
    if (adminPeriod !== 'today' && adminPeriod !== 'yesterday') {
      try {
        const summary = await attendanceRepo.getAdminSummary({
          branchId: selectedBranchId !== 'all' ? selectedBranchId : undefined,
          period: adminPeriod,
          startDate: adminPeriod === 'custom' ? startDate : undefined,
          endDate: adminPeriod === 'custom' ? endDate : undefined,
        });
        setSummaryData(summary || { period: 'weekly', range: { startDate: '', endDate: '' }, usersSummary: [] });
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al obtener el resumen de asistencia');
        setSummaryData({ period: 'weekly', range: { startDate: '', endDate: '' }, usersSummary: [] });
      } finally {
        setIsSummaryLoading(false);
      }

      try {
        const globalRecs = await attendanceRepo.getAdminRecords({
          branchId: selectedBranchId !== 'all' ? selectedBranchId : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          startDate: adminPeriod === 'custom' ? startDate : undefined,
          endDate: adminPeriod === 'custom' ? endDate : undefined,
        });
        setRecords(globalRecs || []);
      } catch (err: any) {
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

  const activeBranchName = (() => {
    if (!activeBranchId || branches.length === 0) return 'Sucursal Activa';
    const found = branches.find(b => (b.id === activeBranchId || (b as any)._id === activeBranchId));
    return found ? found.name : 'Sucursal Activa';
  })();

  // Filter out ADMIN users & inactive users from checador cards
  const nonAdminBranchUsers = branchUsers.filter((u) => {
    if (u.isActive === false) return false;
    const roleVal = (u as any).role;
    if (typeof roleVal === 'string') {
      const r = roleVal.toLowerCase();
      return r !== 'admin' && r !== 'administrator';
    }
    if (roleVal && typeof roleVal === 'object' && roleVal.name) {
      const r = String(roleVal.name).toLowerCase();
      return r !== 'admin' && r !== 'administrator';
    }
    return true;
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDate = (date: Date) => {
    const formatted = date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  // Safe arrays for mapping
  const safeUserSummary = Array.isArray(summaryData?.usersSummary)
    ? summaryData!.usersSummary.filter((u: any) => u.isActive !== false)
    : [];
  const safeRecords = Array.isArray(records) ? records : [];

  // Filtered single-day users list (excluding admins when 'all' is selected)
  const filteredTodayUsers = (() => {
    if (!todayBranchStatus?.users) return [];
    return todayBranchStatus.users.filter((uItem: any) => {
      if (uItem.user?.isActive === false) return false;

      const uObj = typeof uItem.user === 'object' ? uItem.user : {};
      const uId = uObj._id || uObj.id || (typeof uItem.user === 'string' ? uItem.user : '') || uItem.userId || '';

      const matchedLocal = branchUsers.find(b => (b as any)._id === uId || b.id === uId);
      const rawRoleVal = uObj.role?.name || uObj.role || matchedLocal?.role;
      const rName = (typeof rawRoleVal === 'string' ? rawRoleVal : String((rawRoleVal as any)?.name || '')).toLowerCase().trim();
      const isAdminRole = rName === 'admin' || rName === 'administrator';

      if (selectedUserIdFilter !== 'all') {
        return uId === selectedUserIdFilter;
      }

      if (isAdminRole) return false;

      return true;
    });
  })();

  const todayWorkingCount = filteredTodayUsers.filter((u: any) => u.status === 'working' || u.status === 'completed').length;
  const todayOnBreakCount = filteredTodayUsers.filter((u: any) => u.status === 'onBreak').length;
  const todayOffShiftCount = filteredTodayUsers.filter((u: any) => u.status !== 'working' && u.status !== 'completed' && u.status !== 'onBreak').length;

  // Filtered multi-day period summary list (excluding admins when 'all' is selected)
  const filteredUserSummary = safeUserSummary.filter((u: any) => {
    if (selectedUserIdFilter !== 'all') {
      return u.userId === selectedUserIdFilter;
    }
    const matchedLocal = branchUsers.find(b => (b as any)._id === u.userId || b.id === u.userId);
    const rawRoleVal = matchedLocal?.role;
    const rName = (typeof rawRoleVal === 'string' ? rawRoleVal : String((rawRoleVal as any)?.name || '')).toLowerCase().trim();
    if (rName === 'admin' || rName === 'administrator') return false;
    return true;
  });


  return (
    <div style={{ background: '#f8f9ff', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <Sidebar onLogout={handleUnauthorized} userName={user?.name || 'Usuario'} />

      {/* Main Layout Container */}
      <div style={{ marginLeft: '240px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Top Header */}
        <header style={{ background: 'white', padding: '16px 28px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#091426' }}>Control de Asistencia y Horarios</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              padding: '4px 12px',
              borderRadius: '9999px',
              background: isAdmin ? '#f3e8ff' : '#dbeafe',
              color: isAdmin ? '#6b21a8' : '#1e40af',
              border: `1px solid ${isAdmin ? '#d8b4fe' : '#bfdbfe'}`
            }}>
              {isAdmin ? 'Administrador' : 'Colaborador'}
            </span>
          </div>
        </header>

        {/* Content Body */}
        <main style={{ flex: 1, padding: '28px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>

          {/* Navigation Tabs (Admin only) */}
          {isAdmin && (
            <div style={{ display: 'flex', gap: '8px', background: 'white', padding: '4px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px', width: 'fit-content' }}>
              <button
                onClick={() => setActiveTab('my-clock')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: activeTab === 'my-clock' ? '#091426' : 'transparent',
                  color: activeTab === 'my-clock' ? 'white' : '#64748b'
                }}
              >
                Mi Checador
              </button>
              <button
                onClick={() => setActiveTab('admin-dashboard')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: activeTab === 'admin-dashboard' ? '#091426' : 'transparent',
                  color: activeTab === 'admin-dashboard' ? 'white' : '#64748b'
                }}
              >
                Dashboard Administrativo
              </button>
            </div>
          )}

          {/* TAB 1: Checador por Colaborador */}
          {(activeTab === 'my-clock' || !isAdmin) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Header Card */}
              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff8f0', border: '1px solid #ffddb8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="MapPin" size="sm" color="#855300" />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#091426', margin: 0 }}>
                      Estación de Asistencia - {activeBranchName}
                    </h2>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{formatDate(now)}</p>
                </div>

                <div style={{ background: '#f8fafc', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: '20px', fontWeight: '800', color: '#091426', fontFamily: 'monospace' }}>
                    {formatTime(now)}
                  </span>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hora Servidor</span>
                </div>
              </div>

              {/* Employee Cards List */}
              {isUsersLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando personal de la sucursal...</div>
              ) : nonAdminBranchUsers.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '14px' }}>
                  No hay colaboradores activos registrados para marcar en esta sucursal.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {nonAdminBranchUsers.map((emp) => {
                    const empId = String(emp.id || (emp as any)._id || '');
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
                </div>
              )}

            </div>
          )}

          {/* TAB 2: Dashboard Administrativo (Strictly Admin Only) */}
          {isAdmin && activeTab === 'admin-dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Unified Admin Toolbar */}
              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '16px' }}>

                  {/* 1. Branch selector */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Sucursal</label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: 'white', cursor: 'pointer', minWidth: '180px', fontWeight: '500' }}
                    >
                      <option value="all">Todas las Sucursales</option>
                      {branches.map((b) => (
                        <option key={b.id || (b as any)._id} value={b.id || (b as any)._id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Unified Period Filter */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Periodo de Consulta</label>
                    <select
                      value={adminPeriod}
                      onChange={(e) => setAdminPeriod(e.target.value as any)}
                      style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: 'white', cursor: 'pointer', minWidth: '170px', fontWeight: '600', color: '#0f172a' }}
                    >
                      <option value="today">📅 Hoy</option>
                      <option value="yesterday">⏪ Ayer</option>
                      <option value="weekly">📊 Semanal (7 días)</option>
                      <option value="biweekly">📆 Quincenal (15 días)</option>
                      <option value="monthly">🗓️ Mensual (Este mes)</option>
                      <option value="custom">⚙️ Personalizado</option>
                    </select>
                  </div>

                  {/* Custom dates if period === 'custom' */}
                  {adminPeriod === 'custom' && (
                    <form onSubmit={handleCustomFilterSubmit} style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Desde</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Hasta</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                          required
                        />
                      </div>
                      <PrimaryButton type="submit" size="sm">Filtrar</PrimaryButton>
                    </form>
                  )}

                  {/* 3. Colaborador Filter */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Colaborador</label>
                    <select
                      value={selectedUserIdFilter}
                      onChange={(e) => setSelectedUserIdFilter(e.target.value)}
                      style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: 'white', cursor: 'pointer', minWidth: '210px', fontWeight: '500' }}
                    >
                      <option value="all">👤 Todos los colaboradores</option>
                      {branchUsers.map((u) => {
                        const uId = u.id || (u as any)._id;
                        return (
                          <option key={uId} value={uId}>
                            {u.name} ({translateRoleName(u.role)})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <SecondaryButton onClick={loadAdminDashboardData} size="sm" style={{ height: '38px' }}>
                  <Icon name="RefreshCw" size="xs" className="mr-2" /> Actualizar
                </SecondaryButton>
              </div>

              {errorMsg && (
                <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '14px' }}>
                  {errorMsg}
                </div>
              )}

              {/* SINGLE DAY VIEW: Hoy / Ayer */}
              {(adminPeriod === 'today' || adminPeriod === 'yesterday') && (
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                        Estado del Personal ({adminPeriod === 'today' ? 'Hoy' : 'Ayer'})
                      </h3>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {adminPeriod === 'today' ? 'Monitoreo en tiempo real de asistencia del día' : 'Registro de asistencias y faltas del día de ayer'}
                      </span>
                    </div>
                  </div>

                  {isTodayBranchLoading ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Cargando estado de asistencia...</div>
                  ) : (
                    <>
                      {/* Single day KPI summary */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', display: 'block' }}>Trabajando / Asistió</span>
                          <span style={{ fontSize: '22px', fontWeight: '800', color: '#14532d' }}>
                            {todayWorkingCount}
                          </span>
                        </div>
                        <div style={{ background: '#fef9c3', border: '1px solid #fef08a', borderRadius: '8px', padding: '12px 16px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#854d0e', textTransform: 'uppercase', display: 'block' }}>En Descanso</span>
                          <span style={{ fontSize: '22px', fontWeight: '800', color: '#713f12' }}>{todayOnBreakCount}</span>
                        </div>
                        <div style={{ background: adminPeriod === 'today' ? '#f8fafc' : '#fef2f2', border: `1px solid ${adminPeriod === 'today' ? '#e2e8f0' : '#fecaca'}`, borderRadius: '8px', padding: '12px 16px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: adminPeriod === 'today' ? '#64748b' : '#dc2626', textTransform: 'uppercase', display: 'block' }}>
                            {adminPeriod === 'today' ? 'Sin Iniciar' : 'Faltas / Ausencias'}
                          </span>
                          <span style={{ fontSize: '22px', fontWeight: '800', color: adminPeriod === 'today' ? '#334155' : '#991b1b' }}>
                            {todayOffShiftCount}
                          </span>
                        </div>
                      </div>

                      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', fontStyle: 'italic' }}>
                        💡 Haz clic en cualquier colaborador para desplegar sus detalles completos y desglose de horas.
                      </p>

                      {/* Single day user table */}
                      {filteredTodayUsers.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Colaborador</th>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Estado de Asistencia</th>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Hora Entrada</th>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Hora Salida</th>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Tiempo Trabajado</th>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Descanso Acumulado</th>
                              <th style={{ padding: '10px 14px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTodayUsers
                              .map((uItem: any) => {
                                const uObj = typeof uItem.user === 'object' ? uItem.user : {};
                                const uId = uObj._id || uObj.id || (typeof uItem.user === 'string' ? uItem.user : '') || uItem.userId || '';

                                const matchedLocal = branchUsers.find(b => (b as any)._id === uId || b.id === uId);
                                const uName = uObj.name || uObj.username || matchedLocal?.name || 'Colaborador';
                                const rawRoleVal = uObj.role?.name || uObj.role || matchedLocal?.role;
                                const roleTitle = translateRoleName(rawRoleVal);

                                let statusBg = '#f1f5f9';
                                let statusColor = '#64748b';
                                let statusLabel = '⚪ Sin Iniciar';

                                if (uItem.status === 'working') {
                                  statusBg = '#dcfce7'; statusColor = '#15803d'; statusLabel = '🟢 Trabajando';
                                } else if (uItem.status === 'onBreak') {
                                  statusBg = '#fef9c3'; statusColor = '#a16207'; statusLabel = '⏸️ En Descanso';
                                } else if (uItem.status === 'completed') {
                                  statusBg = '#dbeafe'; statusColor = '#1d4ed8'; statusLabel = '🏁 Turno Concluido';
                                } else if (adminPeriod === 'yesterday') {
                                  statusBg = '#fef2f2'; statusColor = '#dc2626'; statusLabel = '🔴 Faltó / Ausente';
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
                                  <tr
                                    key={uId || Math.random()}
                                    onClick={() => {
                                      if (uId) {
                                        handleOpenBreakdown({ userId: uId, userName: uName });
                                      }
                                    }}
                                    style={{ borderBottom: '1px solid #f1f5f9', cursor: uId ? 'pointer' : 'default', transition: 'background 0.15s' }}
                                    onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                                    onMouseOut={e => e.currentTarget.style.background = 'white'}
                                  >
                                    <td style={{ padding: '12px 14px' }}>
                                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{uName}</div>
                                      <div style={{ fontSize: '11px', color: '#64748b' }}>{roleTitle}</div>
                                    </td>
                                    <td style={{ padding: '12px 14px' }}>
                                      <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: statusBg, color: statusColor }}>
                                        {statusLabel}
                                      </span>
                                    </td>
                                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#334155', fontFamily: 'monospace' }}>
                                      {clockInTime}
                                    </td>
                                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#334155', fontFamily: 'monospace' }}>
                                      {clockOutTime}
                                    </td>
                                    <td style={{ padding: '12px 14px', fontSize: '13px', fontWeight: '700', color: '#15803d', fontFamily: 'monospace' }}>
                                      {formatMinutes(uItem.netWorkMinutes || uItem.currentWorkMinutes || 0)}
                                    </td>
                                    <td style={{ padding: '12px 14px', fontSize: '13px', color: '#a16207', fontFamily: 'monospace' }}>
                                      {formatMinutes(uItem.totalBreakMinutes || 0)}
                                    </td>
                                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                      <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        Ver detalles →
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      ) : (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                          No hay colaboradores activos registrados para este día.
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* MULTI-DAY PERIOD REPORT VIEW: Semanal, Quincenal, Mensual, Custom */}
              {adminPeriod !== 'today' && adminPeriod !== 'yesterday' && (
                <>
                  {/* KPI Cards Grid for Period */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Horas Netas Trabajadas</span>
                      <span style={{ fontSize: '24px', fontWeight: '800', color: '#16a34a', fontFamily: 'monospace' }}>
                        {formatMinutes(
                          filteredUserSummary
                            .reduce((acc, u) => acc + (u.netWorkMinutes || 0), 0)
                        )}
                      </span>
                    </div>

                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Tiempo de Comida</span>
                      <span style={{ fontSize: '24px', fontWeight: '800', color: '#d97706', fontFamily: 'monospace' }}>
                        {formatMinutes(
                          filteredUserSummary
                            .reduce((acc, u) => acc + (u.totalBreakMinutes || 0), 0)
                        )}
                      </span>
                    </div>

                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Turnos Laborados</span>
                      <span style={{ fontSize: '24px', fontWeight: '800', color: '#091426', fontFamily: 'monospace' }}>
                        {filteredUserSummary
                          .reduce((acc, u) => acc + (u.completedShifts || 0), 0)}
                      </span>
                    </div>

                    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Colaboradores Incluidos</span>
                      <span style={{ fontSize: '24px', fontWeight: '800', color: '#6b21a8', fontFamily: 'monospace' }}>
                        {filteredUserSummary.length}
                      </span>
                    </div>
                  </div>

                  {/* Users Performance & Payroll Summary Table */}
                  <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                          Resumen de Asistencia y Rendimiento para Nómina
                        </h3>
                        {summaryData?.range && (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Periodo: {summaryData.range.startDate} al {summaryData.range.endDate}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSummaryLoading ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando resumen de personal...</div>
                    ) : filteredUserSummary.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        No se encontraron datos de asistencia para el filtro seleccionado.
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <tr>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Colaborador</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Sucursal</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Días Trabajados</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Ausencias / Faltas</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Tiempo Comida</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Horas Netas</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Estatus Nómina</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUserSummary
                            .map((uSum) => {
                              const totalPeriodShifts = uSum.totalShifts || 5;
                              const workedShifts = uSum.completedShifts || 0;
                              const absentShifts = Math.max(0, totalPeriodShifts - workedShifts);

                              let payrollStatusBg = '#f0fdf4';
                              let payrollStatusColor = '#16a34a';
                              let payrollStatusLabel = '🟢 Completo';

                              if (workedShifts === 0) {
                                payrollStatusBg = '#fef2f2'; payrollStatusColor = '#dc2626'; payrollStatusLabel = '🔴 Sin Asistencias';
                              } else if (absentShifts > 0) {
                                payrollStatusBg = '#fef9c3'; payrollStatusColor = '#854d0e'; payrollStatusLabel = `🟡 ${absentShifts} ${absentShifts === 1 ? 'falta' : 'faltas'}`;
                              }

                              return (
                                <tr
                                  key={uSum.userId}
                                  onClick={() => handleOpenBreakdown({ userId: uSum.userId, userName: uSum.userName })}
                                  style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer', transition: 'background 0.15s' }}
                                  onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                                  onMouseOut={e => e.currentTarget.style.background = 'white'}
                                >
                                  <td style={{ padding: '14px 16px' }}>
                                    <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>{uSum.userName}</div>
                                    {uSum.userEmail && <div style={{ fontSize: '12px', color: '#64748b' }}>{uSum.userEmail}</div>}
                                  </td>
                                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#475569' }}>
                                    {uSum.branchName || 'Matriz'}
                                  </td>
                                  <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#15803d', fontFamily: 'monospace' }}>
                                    {workedShifts} / {totalPeriodShifts}
                                  </td>
                                  <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: absentShifts > 0 ? '#dc2626' : '#64748b', fontFamily: 'monospace' }}>
                                    {absentShifts}
                                  </td>
                                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#d97706', fontFamily: 'monospace' }}>
                                    {formatMinutes(uSum.totalBreakMinutes)}
                                  </td>
                                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '700', color: '#16a34a', fontFamily: 'monospace' }}>
                                    {formatMinutes(uSum.netWorkMinutes)}
                                  </td>
                                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: payrollStatusBg, color: payrollStatusColor }}>
                                      {payrollStatusLabel}
                                    </span>
                                  </td>
                                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                    <SecondaryButton size="sm" onClick={(e) => { e.stopPropagation(); handleOpenBreakdown({ userId: uSum.userId, userName: uSum.userName }); }}>
                                      <Icon name="Eye" size="xs" className="mr-1" /> Desglose
                                    </SecondaryButton>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Global Records Log */}
                  <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                        Bitácora Global de Turnos y Ajustes
                      </h3>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Estatus:</span>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                        >
                          <option value="all">Todos los Estatus</option>
                          <option value="working">En Turno</option>
                          <option value="on_break">En Descanso</option>
                          <option value="completed">Completado</option>
                        </select>
                      </div>
                    </div>

                    {isRecordsLoading ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando registros del sistema...</div>
                    ) : safeRecords.filter(r => {
                      if (selectedUserIdFilter === 'all') return true;
                      const rUid = typeof r.user === 'object' ? r.user?._id || r.user?.id : r.user;
                      return rUid === selectedUserIdFilter;
                    }).length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        No hay registros de asistencia en la bitácora.
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <tr>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Fecha</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Usuario</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Entrada</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Salida</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Tiempo Comida</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Horas Netas</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Estatus</th>
                            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {safeRecords
                            .filter(r => {
                              if (selectedUserIdFilter === 'all') return true;
                              const rUid = typeof r.user === 'object' ? r.user?._id || r.user?.id : r.user;
                              return rUid === selectedUserIdFilter;
                            })
                            .map((rec) => {
                              const userName = typeof rec.user === 'object' ? rec.user?.name : 'Usuario';
                              return (
                                <tr key={rec._id || rec.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#855300', fontFamily: 'monospace' }}>{rec.date}</td>
                                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{userName}</td>
                                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#334155', fontFamily: 'monospace' }}>
                                    {new Date(rec.clockIn).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#334155', fontFamily: 'monospace' }}>
                                    {rec.clockOut
                                      ? new Date(rec.clockOut).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                                      : 'En Turno'}
                                  </td>
                                  <td style={{ padding: '14px 16px', fontSize: '14px', color: '#d97706', fontFamily: 'monospace' }}>
                                    {formatMinutes(rec.totalBreakMinutes)}
                                  </td>
                                  <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '700', color: '#16a34a', fontFamily: 'monospace' }}>
                                    {formatMinutes(rec.netWorkMinutes)}
                                  </td>
                                  <td style={{ padding: '14px 16px' }}>
                                    <span style={{
                                      padding: '3px 10px',
                                      borderRadius: '12px',
                                      fontSize: '11px',
                                      fontWeight: '700',
                                      background: rec.status === 'working' ? '#dcfce7' : rec.status === 'on_break' ? '#fef9c3' : '#dbeafe',
                                      color: rec.status === 'working' ? '#15803d' : rec.status === 'on_break' ? '#a16207' : '#1d4ed8'
                                    }}>
                                      {rec.status === 'working' ? 'En Turno' : rec.status === 'on_break' ? 'En Comida' : 'Completado'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                    <button
                                      onClick={() => handleOpenEdit(rec)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb', padding: '4px' }}
                                      title="Ajuste manual de horas (Admin)"
                                    >
                                      <Icon name="Edit3" size="sm" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}

            </div>
          )}
        </main>

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
      </div>
    </div>
  );
};

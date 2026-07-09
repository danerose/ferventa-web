import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/app/presentation/components';
import { useAuthStore } from '@/core/stores/useAuthStore';
import { APIAdminRepository } from '@/app/data/repositories/APIAdminRepository';
import { APIClientPortalRepository } from '@/app/data/repositories/APIClientPortalRepository';
import type { AdminAppointment } from '@/app/domain/entities/AdminEntities';
import type { OccupiedSlots } from '@/app/domain/entities/ClientPortalEntities';
import { AppointmentForm } from '../components/organisms/AppointmentForm';

const adminRepo = new APIAdminRepository();
const clientRepo = new APIClientPortalRepository();

// --- Utilities ---

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  completed: 'Completada',
  rescheduled: 'Reagendada',
};

const STATUS_STYLES: Record<string, React.CSSProperties> = {
  pending: { background: '#fff7e0', color: '#92400e', border: '1px solid #fbbf2430' },
  approved: { background: '#ecfdf5', color: '#065f46', border: '1px solid #34d39930' },
  rejected: { background: '#fef2f2', color: '#991b1b', border: '1px solid #f8717130' },
  cancelled: { background: '#f1f5f9', color: '#475569', border: '1px solid #94a3b830' },
  completed: { background: '#eff6ff', color: '#1e40af', border: '1px solid #60a5fa30' },
  rescheduled: { background: '#f5f3ff', color: '#5b21b6', border: '1px solid #8b5cf630' },
};

const STATUS_ACCENT: Record<string, string> = {
  pending: '#fbbf24',
  approved: '#10b981',
  rejected: '#ef4444',
  cancelled: '#94a3b8',
  completed: '#3b82f6',
  rescheduled: '#8b5cf6',
};

function formatScheduledAt(scheduledAt: string) {
  try {
    const d = new Date(scheduledAt);
    const day = d.getUTCDate();
    const monthShort = d
      .toLocaleDateString('es-MX', { month: 'short', timeZone: 'UTC' })
      .toUpperCase()
      .replace('.', '');
    const hours = d.getUTCHours();
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return { date: `${day} ${monthShort}`, time: `${h12}:${minutes}`, period };
  } catch {
    return { date: '---', time: '---', period: '' };
  }
}

// --- Toast ---
interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

// --- AppointmentCard Component ---
interface AppointmentCardProps {
  appt: AdminAppointment;
  onApproveClick: (appt: AdminAppointment) => void;
  onRejectClick: (appt: AdminAppointment) => void;
  onRescheduleClick: (appt: AdminAppointment) => void;
  onCancelClick?: (appt: AdminAppointment) => void;
  onRescheduleApprovedClick?: (appt: AdminAppointment) => void;
  updating: boolean;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appt,
  onApproveClick,
  onRejectClick,
  onRescheduleClick,
  onCancelClick,
  onRescheduleApprovedClick,
  updating,
}) => {
  const { date, time, period } = formatScheduledAt(appt.scheduledAt);
  const accent = STATUS_ACCENT[appt.status] || '#cbd5e1';
  const statusStyle = STATUS_STYLES[appt.status] || STATUS_STYLES.pending;

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '20px 20px 20px 24px',
        display: 'flex',
        gap: '20px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        opacity: updating ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(9,20,38,0.08)';
        (e.currentTarget as HTMLDivElement).style.borderColor = '#091426';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0';
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          background: accent,
          borderRadius: '12px 0 0 12px',
        }}
      />

      {/* Date/Time column */}
      <div
        style={{
          width: '80px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: '1px solid #e2e8f0',
          paddingRight: '20px',
          gap: '4px',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#64748b',
          }}
        >
          {date}
        </span>
        <span
          style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#091426',
            lineHeight: '1',
            letterSpacing: '-0.02em',
          }}
        >
          {time}
        </span>
        <span
          style={{
            fontSize: '11px',
            fontFamily: 'JetBrains Mono, monospace',
            color: '#94a3b8',
            fontWeight: '500',
          }}
        >
          {period}
        </span>
      </div>

      {/* Center: Main info */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Customer name + status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#091426' }}>
                {appt.customerName}
              </span>
              <span
                style={{
                  ...statusStyle,
                  fontSize: '10.5px',
                  fontWeight: '700',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                {STATUS_LABELS[appt.status] || appt.status}
              </span>
            </div>
            {appt.customerPhone && (
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icon name="Phone" size="xs" style={{ flexShrink: 0 }} />
                {appt.customerPhone}
              </p>
            )}
          </div>

          {/* Vehicle + service */}
          {appt.vehicle && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
              }}
            >
              <Icon name="Car" size="xs" className="text-[#45474c]" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#091426', whiteSpace: 'nowrap' }}>
                {[appt.vehicle.brand, appt.vehicle.model, appt.vehicle.year].filter(Boolean).join(' ')}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'JetBrains Mono, monospace',
                  color: '#855300',
                  fontWeight: '600',
                  background: '#fef3c7',
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}
              >
                {"***" + appt.vehicle.serialNumberLastFour}
              </span>
            </div>
          )}
        </div>

        {/* Service requested & Branch name */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              background: '#eff4ff',
              border: '1px solid #c7d2fe',
              borderRadius: '8px',
              padding: '6px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Icon name="Wrench" size="xs" className="text-[#3730a3]" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#3730a3' }}>
              {appt.serviceRequested}
            </span>
          </div>

          {appt.branchName && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '8px',
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Icon name="MapPin" size="xs" className="text-[#166534]" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#166534' }}>
                {appt.branchName}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        {appt.notes && (
          <div
            style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
          >
            <p style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icon name="FileText" size="xs" />
              Notas
            </p>
            <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#475569', lineHeight: '1.4' }}>
              "{appt.notes}"
            </p>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      {(appt.status === 'pending' || appt.status === 'rescheduled') && (
        <div
          style={{
            width: '180px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            justifyContent: 'center',
          }}
        >
          {/* Approve button - full width */}
          <button
            onClick={() => onApproveClick(appt)}
            disabled={updating}
            style={{
              width: '100%',
              background: '#091426',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: updating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background 0.15s, opacity 0.15s',
            }}
            onMouseEnter={(e) => { if (!updating) (e.currentTarget as HTMLButtonElement).style.background = '#1e293b'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#091426'; }}
          >
            <Icon name="CheckCircle" size="xs" />
            Aprobar
          </button>

          {/* 2-column grid for Reschedule and Reject */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              onClick={() => onRescheduleClick(appt)}
              disabled={updating}
              style={{
                width: '100%',
                background: 'transparent',
                color: '#091426',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '7px 8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: updating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (!updating) (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <Icon name="Calendar" size="xs" />
              Reagendar
            </button>
            <button
              onClick={() => onRejectClick(appt)}
              disabled={updating}
              style={{
                width: '100%',
                background: 'transparent',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                borderRadius: '8px',
                padding: '7px 8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: updating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (!updating) (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <Icon name="XCircle" size="xs" />
              Rechazar
            </button>
          </div>
        </div>
      )}

      {appt.status === 'approved' && (
        <div
          style={{
            width: '180px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            justifyContent: 'center',
          }}
        >
          {/* Reagendar button */}
          <button
            onClick={() => onRescheduleApprovedClick?.(appt)}
            disabled={updating}
            style={{
              width: '100%',
              background: '#091426',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: updating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background 0.15s, opacity 0.15s',
            }}
            onMouseEnter={(e) => { if (!updating) (e.currentTarget as HTMLButtonElement).style.background = '#1e293b'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#091426'; }}
          >
            <Icon name="Calendar" size="xs" />
            Reagendar
          </button>

          {/* Cancelar button */}
          <button
            onClick={() => onCancelClick?.(appt)}
            disabled={updating}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: updating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { if (!updating) (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <Icon name="XCircle" size="xs" />
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

// --- Skeleton Loader ---

const SkeletonCard = () => (
  <div
    style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      gap: '20px',
      overflow: 'hidden',
    }}
  >
    <div style={{ width: '80px', flexShrink: 0 }}>
      <div style={{ height: '12px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '8px', width: '60%' }} />
      <div style={{ height: '32px', background: '#f1f5f9', borderRadius: '4px', marginBottom: '8px' }} />
      <div style={{ height: '12px', background: '#f1f5f9', borderRadius: '4px', width: '40%' }} />
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ height: '20px', background: '#f1f5f9', borderRadius: '4px', width: '40%' }} />
      <div style={{ height: '14px', background: '#f1f5f9', borderRadius: '4px', width: '60%' }} />
      <div style={{ height: '28px', background: '#f1f5f9', borderRadius: '6px', width: '45%' }} />
    </div>
  </div>
);

// --- Sidebar ---

interface SidebarProps {
  onLogout: () => void;
  userName: string;
}

const NAV_ITEMS = [
  { icon: 'LayoutDashboard', label: 'Dashboard', active: false },
  { icon: 'CalendarCheck', label: 'Citas', active: true },
  { icon: 'Wrench', label: 'Mantenimiento', active: false },
  { icon: 'Package', label: 'Inventario', active: false },
  { icon: 'Users', label: 'Usuarios', active: false },
];

const Sidebar: React.FC<SidebarProps> = ({ onLogout, userName }) => (
  <aside
    style={{
      width: '240px',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      background: '#091426',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
      borderRight: '1px solid rgba(255,255,255,0.05)',
    }}
  >
    {/* Logo */}
    <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            background: '#855300',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="Wrench" className="text-white" size="sm" />
        </div>
        <span style={{ color: 'white', fontSize: '18px', fontWeight: '700', letterSpacing: '-0.01em' }}>
          Moto servicio Nova FV
        </span>
      </div>
      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>
        Workshop OS
      </span>
    </div>

    {/* Navigation */}
    <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {NAV_ITEMS.map((item) => (
        <div
          key={item.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '8px',
            cursor: item.active ? 'default' : 'not-allowed',
            background: item.active ? 'rgba(133,83,0,0.2)' : 'transparent',
            color: item.active ? '#fbbf24' : 'rgba(255,255,255,0.45)',
            transition: 'background 0.15s, color 0.15s',
            fontWeight: item.active ? '700' : '500',
            fontSize: '14px',
          }}
        >
          <Icon name={item.icon as 'Wrench'} size="sm" style={{ flexShrink: 0 }} />
          {item.label}
        </div>
      ))}
    </nav>

    {/* User + Logout */}
    <div style={{ padding: '12px 10px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div
        style={{
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '10px',
          padding: '12px',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: '#855300',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: 'white',
            fontSize: '14px',
            fontWeight: '700',
          }}
        >
          {userName.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ color: 'white', fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userName}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>Administrador</p>
        </div>
      </div>

      <button
        onClick={onLogout}
        style={{
          width: '100%',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '8px',
          padding: '8px 12px',
          color: 'rgba(255,255,255,0.55)',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)';
          (e.currentTarget as HTMLButtonElement).style.color = '#fca5a5';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.3)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.12)';
        }}
      >
        <Icon name="LogOut" size="xs" />
        Cerrar Sesión
      </button>
    </div>
  </aside>
);

// --- Status Filter Tabs ---

const FILTER_TABS = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'rescheduled', label: 'Reagendadas' },
  { value: 'completed', label: 'Completadas' },
  { value: 'rejected', label: 'Rechazadas' },
  { value: 'cancelled', label: 'Canceladas' },
];

// --- Main Dashboard Page ---

export interface AdminDashboardPageProps {
  onLogout: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onLogout }) => {
  const { user, accessToken, clearAuth } = useAuthStore();
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [branchFilter, setBranchFilter] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal States
  const [activeModal, setActiveModal] = useState<'approve' | 'reject' | 'reschedule' | 'approveRescheduled' | 'addAppointment' | 'cancelApproved' | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<AdminAppointment | null>(null);
  const [modalMessage, setModalMessage] = useState('');
  const [isMessageEdited, setIsMessageEdited] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Reschedule Suggestions
  const [suggestedSchedules, setSuggestedSchedules] = useState<{ date: string, time: string }[]>([]);
  const [newSuggestionDate, setNewSuggestionDate] = useState('');
  const [newSuggestionTime, setNewSuggestionTime] = useState('08:00');

  // Rescheduled Approve final selection
  const [finalDate, setFinalDate] = useState('');
  const [finalTime, setFinalTime] = useState('08:00');

  // Visual Helper (Occupied Slots)
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlots | null>(null);
  const [occupiedLoading, setOccupiedLoading] = useState(false);

  const addToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const handleUnauthorized = useCallback(() => {
    clearAuth();
    onLogout();
  }, [clearAuth, onLogout]);

  const fetchAppointments = useCallback(
    async (search?: string) => {
      if (!accessToken) return;
      setLoading(true);
      setError(null);
      try {
        const data = await adminRepo.getAppointments(accessToken, {
          status: statusFilter,
          search: search ?? searchValue,
        });
        setAppointments(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        if (msg === 'UNAUTHORIZED') {
          handleUnauthorized();
          return;
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [accessToken, statusFilter, searchValue, handleUnauthorized]
  );

  // Fetch on filter change
  useEffect(() => {
    fetchAppointments(searchValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Debounced search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchAppointments(val);
    }, 400);
  };

  // Helper to load occupied slots
  const loadSlots = async () => {
    setOccupiedLoading(true);
    try {
      const today = new Date();
      const futureLimit = new Date();
      futureLimit.setDate(today.getDate() + 14);
      const formatDateStr = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };
      const slots = await clientRepo.getOccupiedSlots(formatDateStr(today), formatDateStr(futureLimit));
      setOccupiedSlots(slots);
    } catch (err) {
      console.error('Error fetching occupied slots:', err);
    } finally {
      setOccupiedLoading(false);
    }
  };

  // Generate WhatsApp Time format (12h)
  const format12h = (t: string) => {
    if (!t) return '';
    const [hStr, mStr] = t.split(':');
    const h = parseInt(hStr);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${mStr} ${ampm}`;
  };

  const formatSpanishDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const dateObj = new Date(dateStr + 'T00:00:00Z');
      return dateObj.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    } catch {
      return dateStr;
    }
  };

  // Trigger click handlers
  const handleApproveClick = (appt: AdminAppointment) => {
    setSelectedAppt(appt);
    setIsMessageEdited(false);

    if (appt.status === 'rescheduled') {
      setActiveModal('approveRescheduled');
      // Set default values from current appt
      const dateObj = new Date(appt.scheduledAt);
      const yyyy = dateObj.getUTCFullYear();
      const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getUTCDate()).padStart(2, '0');
      setFinalDate(`${yyyy}-${mm}-${dd}`);
      const hh = String(dateObj.getUTCHours()).padStart(2, '0');
      const min = String(dateObj.getUTCMinutes()).padStart(2, '0');
      setFinalTime(`${hh}:${min}`);

      // Load slots for the validation helper
      loadSlots();
    } else {
      setActiveModal('approve');
      const { date, time, period } = formatScheduledAt(appt.scheduledAt);
      const displayTime = `${time} ${period}`;
      const customer = appt.customerName;
      const vehicleStr = appt.vehicle
        ? `${appt.vehicle.brand} ${appt.vehicle.model} (${appt.vehicle.year})`
        : 'Gen\u00E9rico';
      const serialStr = appt.vehicle?.serialNumberLastFour || 'N/A';

      let msg = `*CONFIRMACI\u00D3N DE CITA*\n\nHola *${customer}*, te confirmamos que tu cita ha sido aprobada.\n\n*Detalles de la cita:*\n- *Fecha:* ${date}\n- *Hora:* ${displayTime}\n- *Veh\u00EDculo:* ${vehicleStr} (Serie: ${serialStr})\n- *Servicio:* ${appt.serviceRequested}\n- *Nota:* Debe llevar p\u00F3liza de garant\u00EDa, factura o carta factura (original, foto o copia).`;
      if (appt.branchName === 'Nova FV Sucursal Uman') {
        msg += `\n- *Ubicaci\u00F3n:* https://maps.app.goo.gl/uxoSts8ZdXMNM3To6?g_st=ic`;
      }
      msg += `\n\nTe esperamos en el taller. Si tienes alguna duda o contratiempo, por favor responde a este mensaje.`;
      setModalMessage(msg);
    }
  };

  const handleRejectClick = (appt: AdminAppointment) => {
    setSelectedAppt(appt);
    setIsMessageEdited(false);
    setRejectionReason('');
    setActiveModal('reject');

    const { date, time, period } = formatScheduledAt(appt.scheduledAt);
    const displayTime = `${time} ${period}`;

    const msg = `*CANCELACI\u00D3N DE CITA*\n\nHola *${appt.customerName}*, lamentamos informarte que no podemos agendar tu cita solicitada para el d\u00EDa ${date} a las ${displayTime}.\n\n*Motivo:* [Escribe el motivo del rechazo]\n\nTe sugerimos solicitar una nueva cita con un horario alternativo a trav\u00E9s de nuestro portal. Agradecemos tu comprensi\u00F3n.`;
    setModalMessage(msg);
  };

  const handleRescheduleClick = (appt: AdminAppointment) => {
    setSelectedAppt(appt);
    setIsMessageEdited(false);
    setSuggestedSchedules([]);
    setActiveModal('reschedule');

    // Set default suggestion date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setNewSuggestionDate(`${yyyy}-${mm}-${dd}`);
    setNewSuggestionTime('09:00');

    // Load slots for helper
    loadSlots();
  };

  const handleCancelClick = (appt: AdminAppointment) => {
    setSelectedAppt(appt);
    setActiveModal('cancelApproved');
  };

  const handleRescheduleApprovedClick = (appt: AdminAppointment) => {
    setSelectedAppt(appt);
    setIsMessageEdited(false);
    setActiveModal('approveRescheduled');

    // Set default values from current appt
    const dateObj = new Date(appt.scheduledAt);
    const yyyy = dateObj.getUTCFullYear();
    const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getUTCDate()).padStart(2, '0');
    setFinalDate(`${yyyy}-${mm}-${dd}`);
    const hh = String(dateObj.getUTCHours()).padStart(2, '0');
    const min = String(dateObj.getUTCMinutes()).padStart(2, '0');
    setFinalTime(`${hh}:${min}`);

    // Load slots for the validation helper
    loadSlots();
  };

  // Re-generate reject message when reason changes (if not custom edited)
  useEffect(() => {
    if (activeModal === 'reject' && selectedAppt && !isMessageEdited) {
      const { date, time, period } = formatScheduledAt(selectedAppt.scheduledAt);
      const displayTime = `${time} ${period}`;
      const reasonText = rejectionReason.trim() ? rejectionReason : '[Escribe el motivo del rechazo]';

      const msg = `*CANCELACI\u00D3N DE CITA*\n\nHola *${selectedAppt.customerName}*, lamentamos informarte que no podemos agendar tu cita solicitada para el d\u00EDa ${date} a las ${displayTime}.\n\n*Motivo:* ${reasonText}\n\nTe sugerimos solicitar una nueva cita con un horario alternativo a trav\u00E9s de nuestro portal. Agradecemos tu comprensi\u00F3n.`;
      setModalMessage(msg);
    }
  }, [rejectionReason, activeModal, selectedAppt, isMessageEdited]);

  // Re-generate reschedule message when suggestions change (if not custom edited)
  useEffect(() => {
    if (activeModal === 'reschedule' && selectedAppt && !isMessageEdited) {
      const { date, time, period } = formatScheduledAt(selectedAppt.scheduledAt);
      const displayTime = `${time} ${period}`;

      let suggestionsListText = '[Elige una o m\u00E1s fechas y horarios abajo para sugerir]';
      if (suggestedSchedules.length > 0) {
        suggestionsListText = suggestedSchedules.map((s, idx) => {
          const dateFmt = formatSpanishDate(s.date);
          const timeFmt = format12h(s.time);
          return `- *Opci\u00F3n ${idx + 1}:* ${dateFmt.charAt(0).toUpperCase() + dateFmt.slice(1)} a las ${timeFmt}`;
        }).join('\n');
      }

      const msg = `*PROPUESTA DE REAGENDACI\u00D3N*\n\nHola *${selectedAppt.customerName}*, el horario solicitado originalmente para tu cita (${date} a las ${displayTime}) no est\u00E1 disponible.\n\nTe sugerimos las siguientes opciones alternativas:\n\n${suggestionsListText}\n\nPor favor, responde a este mensaje indic\u00E1ndonos cu\u00E1l de estas opciones prefieres para confirmar tu espacio. Muchas gracias.`;
      setModalMessage(msg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedSchedules, activeModal, selectedAppt, isMessageEdited]);

  // Re-generate rescheduled approval message when date/time changes (if not custom edited)
  useEffect(() => {
    if (activeModal === 'approveRescheduled' && selectedAppt && !isMessageEdited) {
      const dateFmt = formatSpanishDate(finalDate);
      const timeFmt = format12h(finalTime);
      const displaySchedule = `${dateFmt} a las ${timeFmt}`;
      const customer = selectedAppt.customerName;
      const vehicleStr = selectedAppt.vehicle
        ? `${selectedAppt.vehicle.brand} ${selectedAppt.vehicle.model} (${selectedAppt.vehicle.year})`
        : 'Gen\u00E9rico';
      const serialStr = selectedAppt.vehicle?.serialNumberLastFour || 'N/A';

      let msg = `*CONFIRMACI\u00D3N DE CITA*\n\nHola *${customer}*, te confirmamos que tu cita ha sido reagendada y aprobada.\n\n*Detalles de la cita:*\n- *Fecha y Hora:* ${displaySchedule.charAt(0).toUpperCase() + displaySchedule.slice(1)}\n- *Veh\u00EDculo:* ${vehicleStr} (Serie: ${serialStr})\n- *Servicio:* ${selectedAppt.serviceRequested}\n- *Nota:* Debe llevar p\u00F3liza de garant\u00EDa, factura o carta factura (original, foto o copia).`;
      if (selectedAppt.branchName === 'Nova FV Sucursal Uman') {
        msg += `\n- *Ubicaci\u00F3n:* https://maps.app.goo.gl/uxoSts8ZdXMNM3To6?g_st=ic`;
      }
      msg += `\n\nTe esperamos en el taller. Si tienes alguna duda o contratiempo, por favor responde a este mensaje.`;
      setModalMessage(msg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalDate, finalTime, activeModal, selectedAppt, isMessageEdited]);

  // Handle addition of suggestion
  const handleAddSuggestion = () => {
    if (!newSuggestionDate || !newSuggestionTime) return;
    // Prevent duplicate suggestions
    const exists = suggestedSchedules.some(s => s.date === newSuggestionDate && s.time === newSuggestionTime);
    if (!exists) {
      setSuggestedSchedules(prev => [...prev, { date: newSuggestionDate, time: newSuggestionTime }]);
    }
  };

  const handleRemoveSuggestion = (idx: number) => {
    setSuggestedSchedules(prev => prev.filter((_, i) => i !== idx));
  };

  // Submit Operations
  const openWhatsApp = (phone: string, text: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '52' + cleanPhone;
    }
    const encodedText = encodeURIComponent(text);
    const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    window.open(url, '_blank');
  };

  const handleApproveConfirm = async () => {
    if (!accessToken || !selectedAppt) return;
    setUpdatingId(selectedAppt.id);
    setActiveModal(null);
    try {
      await adminRepo.approveAppointment(accessToken, selectedAppt.id, modalMessage);
      setAppointments((prev) =>
        prev.map((a) => (a.id === selectedAppt.id ? { ...a, status: 'approved' as const } : a))
      );
      addToast('success', 'Cita aprobada y abriendo WhatsApp.');
      if (selectedAppt.customerPhone) {
        openWhatsApp(selectedAppt.customerPhone, modalMessage);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      if (msg === 'UNAUTHORIZED') { handleUnauthorized(); return; }
      addToast('error', msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!accessToken || !selectedAppt) return;
    if (!rejectionReason.trim()) {
      alert('Debes indicar el motivo del rechazo.');
      return;
    }
    setUpdatingId(selectedAppt.id);
    setActiveModal(null);
    try {
      await adminRepo.rejectAppointment(accessToken, selectedAppt.id, modalMessage);
      setAppointments((prev) =>
        prev.map((a) => (a.id === selectedAppt.id ? { ...a, status: 'rejected' as const } : a))
      );
      addToast('success', 'Cita rechazada y abriendo WhatsApp.');
      if (selectedAppt.customerPhone) {
        openWhatsApp(selectedAppt.customerPhone, modalMessage);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      if (msg === 'UNAUTHORIZED') { handleUnauthorized(); return; }
      addToast('error', msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRescheduleConfirm = async () => {
    if (!accessToken || !selectedAppt) return;
    if (suggestedSchedules.length === 0) {
      alert('Debes añadir al menos una fecha y horario sugerido.');
      return;
    }

    setUpdatingId(selectedAppt.id);
    setActiveModal(null);
    try {
      // Send first suggestion in scheduledAt field as ISO
      const firstSug = suggestedSchedules[0];
      const isoString = `${firstSug.date}T${firstSug.time}:00.000Z`;
      const originalDuration = selectedAppt.duration || 90;

      await adminRepo.rescheduleAppointment(accessToken, selectedAppt.id, isoString, originalDuration, modalMessage);

      setAppointments((prev) =>
        prev.map((a) => (a.id === selectedAppt.id ? { ...a, status: 'rescheduled' as const, scheduledAt: isoString } : a))
      );
      addToast('success', 'Propuesta de reagendación registrada.');
      if (selectedAppt.customerPhone) {
        openWhatsApp(selectedAppt.customerPhone, modalMessage);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      if (msg === 'UNAUTHORIZED') { handleUnauthorized(); return; }
      addToast('error', msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApproveRescheduledConfirm = async () => {
    if (!accessToken || !selectedAppt) return;
    if (!finalDate || !finalTime) return;

    setUpdatingId(selectedAppt.id);
    setActiveModal(null);
    try {
      // Convert selected date/time to ISO format
      const finalIso = `${finalDate}T${finalTime}:00.000Z`;

      // Step 1: Update the appointment schedule
      await adminRepo.updateAppointment(accessToken, selectedAppt.id, {
        scheduledAt: finalIso,
      });

      // Step 2: Approve the appointment and send the WhatsApp message
      await adminRepo.approveAppointment(accessToken, selectedAppt.id, modalMessage);

      setAppointments((prev) =>
        prev.map((a) => (a.id === selectedAppt.id ? { ...a, status: 'approved' as const, scheduledAt: finalIso } : a))
      );
      addToast('success', 'Cita reagendada aprobada y abriendo WhatsApp.');
      if (selectedAppt.customerPhone) {
        openWhatsApp(selectedAppt.customerPhone, modalMessage);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      if (msg === 'UNAUTHORIZED') { handleUnauthorized(); return; }
      addToast('error', msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelApprovedConfirm = async () => {
    if (!accessToken || !selectedAppt) return;

    setUpdatingId(selectedAppt.id);
    setActiveModal(null);
    try {
      // Update appointment status to cancelled
      await adminRepo.updateAppointment(accessToken, selectedAppt.id, {
        status: 'cancelled',
      });

      setAppointments((prev) =>
        prev.map((a) => (a.id === selectedAppt.id ? { ...a, status: 'cancelled' as const } : a))
      );
      addToast('success', 'Cita cancelada exitosamente.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      if (msg === 'UNAUTHORIZED') { handleUnauthorized(); return; }
      addToast('error', msg);
    } finally {
      setUpdatingId(null);
    }
  };

  // Generate visual helper list for occupied dates
  const occupiedList = useMemo(() => {
    if (!occupiedSlots) return [];

    const list = [];
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(todayUTC.getTime() + i * 24 * 60 * 60 * 1000);
      const yyyy = nextDate.getUTCFullYear();
      const mm = String(nextDate.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(nextDate.getUTCDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;

      // Format day name in Spanish
      const dayLabel = nextDate.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

      // Check Holiday
      const holiday = occupiedSlots.holidays.find((h: any) => h.date === dateString);
      // Check non-working day
      const dayOfWeek = nextDate.getUTCDay();
      const isNonWorking = occupiedSlots.nonWorkingDaysOfWeek.includes(dayOfWeek);
      const schedule = occupiedSlots.workingHours.find((w: any) => w.dayOfWeek === dayOfWeek);
      const isClosed = isNonWorking || (schedule && !schedule.isWorking);

      // Busy slots for this date
      const busyTimes = occupiedSlots.busySlots
        .filter((b: any) => b.date === dateString)
        .map((b: any) => `${b.startTime} - ${b.endTime}`);

      list.push({
        dateStr: dateString,
        dayLabel: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
        isClosed: !!isClosed,
        closedReason: holiday ? holiday.description : 'Cerrado',
        busyTimes,
      });
    }
    return list;
  }, [occupiedSlots]);

  const uniqueBranches = useMemo(() => {
    const branches = new Set<string>();
    appointments.forEach((a) => {
      if (a.branchName) {
        branches.add(a.branchName);
      }
    });
    return Array.from(branches);
  }, [appointments]);

  const visibleAppointments = useMemo(() => {
    let filtered = statusFilter === 'all'
      ? appointments
      : appointments.filter((a) => a.status === statusFilter);

    if (branchFilter !== 'all') {
      filtered = filtered.filter((a) => a.branchName === branchFilter);
    }
    return filtered;
  }, [appointments, statusFilter, branchFilter]);

  const pendingCount = appointments.filter((a) => a.status === 'pending').length;

  // Generate 15min incremental time slots option list (e.g. from 8:00 to 18:00)
  const timeSlotOptions = useMemo(() => {
    const slots = [];
    let minutes = 8 * 60; // 8:00 AM
    const endMinutes = 18 * 60; // 6:00 PM

    while (minutes <= endMinutes) {
      const hh = Math.floor(minutes / 60).toString().padStart(2, '0');
      const mm = (minutes % 60).toString().padStart(2, '0');
      slots.push(`${hh}:${mm}`);
      minutes += 15;
    }
    return slots;
  }, []);

  return (
    <div style={{ background: '#f8f9ff', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <Sidebar onLogout={() => { clearAuth(); onLogout(); }} userName={user?.name || 'Admin'} />

      {/* Main area */}
      <div style={{ marginLeft: '240px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            background: 'white',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 28px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          {/* Search and Branch Filter */}
          <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '560px' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1 }}>
              <Icon
                name="Search"
                size="sm"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                value={searchValue}
                onChange={handleSearchChange}
                placeholder="Buscar por cliente, teléfono o serie..."
                style={{
                  width: '100%',
                  paddingLeft: '38px',
                  paddingRight: '16px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#0b1c30',
                  outline: 'none',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = '#091426';
                  (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(9,20,38,0.08)';
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = '#e2e8f0';
                  (e.target as HTMLInputElement).style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Branch Filter */}
            <div style={{ position: 'relative', width: '200px', flexShrink: 0 }}>
              <Icon
                name="MapPin"
                size="sm"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  pointerEvents: 'none',
                }}
              />
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '38px',
                  paddingRight: '28px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#0b1c30',
                  outline: 'none',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundImage: 'none',
                }}
              >
                <option value="all">Todas las sucursales</option>
                {uniqueBranches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))}
              </select>
              <div
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  pointerEvents: 'none',
                  fontSize: '10px',
                }}
              >
                ▼
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {pendingCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#fff7e0',
                  border: '1px solid #fbbf2440',
                  borderRadius: '8px',
                  padding: '6px 12px',
                }}
              >
                <Icon name="Clock" size="xs" style={{ color: '#92400e' }} />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#92400e' }}>
                  {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
            <button
              onClick={() => setActiveModal('addAppointment')}
              style={{
                background: '#091426',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#1e293b'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#091426'; }}
            >
              <Icon name="Plus" size="xs" />
              {'Añadir Cita'}
            </button>
            <button
              onClick={() => fetchAppointments()}
              title="Actualizar"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                background: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'white'; }}
            >
              <Icon name="RefreshCw" size="xs" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '28px', maxWidth: '1280px', width: '100%', margin: '0 auto' }}>
          {/* Page header */}
          <div style={{ marginBottom: '24px' }}>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: '700',
                color: '#091426',
                letterSpacing: '-0.02em',
                marginBottom: '4px',
              }}
            >
              Gestión de Citas
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Administra las solicitudes de tus clientes y actualiza su estado.
            </p>
          </div>

          {/* Status Filter Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '4px',
              marginBottom: '20px',
              overflowX: 'auto',
              flexWrap: 'nowrap',
            }}
          >
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                style={{
                  padding: '7px 16px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s, color 0.15s',
                  background: statusFilter === tab.value ? '#091426' : 'transparent',
                  color: statusFilter === tab.value ? 'white' : '#64748b',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content area */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <div
              style={{
                background: '#fff1f1',
                border: '1px solid rgba(186,26,26,0.2)',
                borderRadius: '12px',
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Icon name="AlertTriangle" className="text-error" />
              <div>
                <p style={{ fontWeight: '700', color: '#991b1b', marginBottom: '4px' }}>Error al cargar las citas</p>
                <p style={{ fontSize: '14px', color: '#7f1d1d' }}>{error}</p>
              </div>
              <button
                onClick={() => fetchAppointments()}
                style={{
                  marginLeft: 'auto',
                  background: '#991b1b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                Reintentar
              </button>
            </div>
          ) : visibleAppointments.length === 0 ? (
            <div
              style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '56px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="CalendarOff" className="text-[#94a3b8]" />
              </div>
              <p style={{ fontWeight: '700', color: '#0b1c30', fontSize: '16px' }}>Sin citas</p>
              <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center' }}>
                {searchValue
                  ? `No se encontraron citas para "${searchValue}"`
                  : `No hay citas con estado "${STATUS_LABELS[statusFilter] ?? statusFilter}"`}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {visibleAppointments.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  onApproveClick={handleApproveClick}
                  onRejectClick={handleRejectClick}
                  onRescheduleClick={handleRescheduleClick}
                  onCancelClick={handleCancelClick}
                  onRescheduleApprovedClick={handleRescheduleApprovedClick}
                  updating={updatingId === appt.id}
                />
              ))}
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', paddingTop: '8px' }}>
                {visibleAppointments.length} cita{visibleAppointments.length !== 1 ? 's' : ''} mostrada{visibleAppointments.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Modal Aprobar Cita Común */}
      {activeModal === 'approve' && selectedAppt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', margin: 'auto' }}>
            <div style={{ padding: '24px 28px', background: '#091426', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="CheckCircle" />
                <span style={{ fontSize: '18px', fontWeight: '700' }}>Aprobar Cita</span>
              </div>
              <button onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}><Icon name="X" /></button>
            </div>

            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>
                Se aprobará la cita para <strong>{selectedAppt.customerName}</strong> y se abrirá WhatsApp con los detalles de confirmación.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Mensaje a enviar (Editable)</label>
                <textarea
                  value={modalMessage}
                  onChange={(e) => { setModalMessage(e.target.value); setIsMessageEdited(true); }}
                  rows={8}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ padding: '16px 28px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'end', gap: '12px' }}>
              <button
                onClick={() => setActiveModal(null)}
                style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleApproveConfirm}
                style={{ background: '#091426', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: '700', color: 'white', cursor: 'pointer' }}
              >
                Aprobar y Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Rechazar Cita */}
      {activeModal === 'reject' && selectedAppt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', margin: 'auto' }}>
            <div style={{ padding: '24px 28px', background: '#991b1b', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="XCircle" />
                <span style={{ fontSize: '18px', fontWeight: '700' }}>Rechazar Cita</span>
              </div>
              <button onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}><Icon name="X" /></button>
            </div>

            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Motivo del rechazo *</label>
                <input
                  type="text"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Ej. Falta de refacciones para el modelo específico"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Mensaje a enviar (Editable)</label>
                <textarea
                  value={modalMessage}
                  onChange={(e) => { setModalMessage(e.target.value); setIsMessageEdited(true); }}
                  rows={8}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ padding: '16px 28px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'end', gap: '12px' }}>
              <button
                onClick={() => setActiveModal(null)}
                style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectionReason.trim()}
                style={{ background: '#dc2626', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: '700', color: 'white', cursor: rejectionReason.trim() ? 'pointer' : 'not-allowed', opacity: rejectionReason.trim() ? 1 : 0.6 }}
              >
                Rechazar y Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Reagendar Cita */}
      {activeModal === 'reschedule' && selectedAppt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '980px', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', margin: 'auto' }}>
            <div style={{ padding: '20px 24px', background: '#091426', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="Calendar" />
                <span style={{ fontSize: '18px', fontWeight: '700' }}>Proponer Reagendación de Cita</span>
              </div>
              <button onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}><Icon name="X" /></button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: '400px' }}>
              {/* Left Column: Visual helper of occupied schedule */}
              <div style={{ width: '320px', borderRight: '1px solid #e2e8f0', background: '#f8fafc', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="CalendarRange" size="xs" />
                  Visualizador de Agenda (Ayuda)
                </h4>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Horarios y citas agendadas de los próximos 7 días laborales.</p>

                {occupiedLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><span style={{ fontSize: '13px', color: '#94a3b8' }}>Cargando agenda...</span></div>
                ) : occupiedList.length === 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><span style={{ fontSize: '13px', color: '#94a3b8' }}>No hay información de agenda.</span></div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {occupiedList.map((day: any) => (
                      <div key={day.dateStr} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', fontSize: '12px' }}>
                        <div style={{ fontWeight: '700', color: '#091426', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span>{day.dayLabel}</span>
                          {day.isClosed && <span style={{ color: '#dc2626', fontSize: '10.5px' }}>{day.closedReason}</span>}
                        </div>
                        {day.isClosed ? null : day.busyTimes.length === 0 ? (
                          <div style={{ color: '#16a34a', fontStyle: 'italic' }}>Todo el día libre</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>OCUPADO EN:</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {day.busyTimes.map((t: string, idx: number) => (
                                <span key={idx} style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Suggestion builder & message */}
              <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
                  La cita original no puede ser agendada en la hora solicitada. Selecciona una o varias opciones alternativas para sugerirle al cliente.
                </p>

                {/* Builder section */}
                <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#091426' }}>Añadir sugerencia de horario</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="date"
                      value={newSuggestionDate}
                      onChange={(e) => setNewSuggestionDate(e.target.value)}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', flex: 1 }}
                    />
                    <select
                      value={newSuggestionTime}
                      onChange={(e) => setNewSuggestionTime(e.target.value)}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: 'white' }}
                    >
                      {timeSlotOptions.map((t: string) => (
                        <option key={t} value={t}>{format12h(t)}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddSuggestion}
                      style={{ background: '#091426', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Icon name="Plus" size="xs" /> Añadir
                    </button>
                  </div>

                  {/* Suggestions list tags */}
                  {suggestedSchedules.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                      {suggestedSchedules.map((s, idx) => (
                        <div key={idx} style={{ background: '#f3e8ff', border: '1px solid #d8b4fe', color: '#5b21b6', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                          <span>{s.date.split('-').slice(1).join('/')} a las {format12h(s.time)}</span>
                          <button onClick={() => handleRemoveSuggestion(idx)} style={{ background: 'transparent', border: 'none', color: '#7c3aed', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                            <Icon name="X" size="xs" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Message area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Mensaje a enviar (Editable)</label>
                  <textarea
                    value={modalMessage}
                    onChange={(e) => { setModalMessage(e.target.value); setIsMessageEdited(true); }}
                    rows={8}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 28px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'end', gap: '12px' }}>
              <button
                onClick={() => setActiveModal(null)}
                style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleRescheduleConfirm}
                disabled={suggestedSchedules.length === 0}
                style={{ background: '#091426', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: '700', color: 'white', cursor: suggestedSchedules.length > 0 ? 'pointer' : 'not-allowed', opacity: suggestedSchedules.length > 0 ? 1 : 0.6 }}
              >
                Mandar Mensaje y Cambiar a Reagendada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal Aprobar Cita Reagendada (Rescheduled) / Reagendar Aprobada */}
      {activeModal === 'approveRescheduled' && selectedAppt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', margin: 'auto' }}>
            <div style={{ padding: '24px 28px', background: selectedAppt.status === 'approved' ? '#091426' : '#8b5cf6', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name={selectedAppt.status === 'approved' ? 'Calendar' : 'CheckCircle'} />
                <span style={{ fontSize: '18px', fontWeight: '700' }}>
                  {selectedAppt.status === 'approved' ? 'Reagendar Cita Aprobada' : 'Confirmar y Aprobar Cita Reagendada'}
                </span>
              </div>
              <button onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}><Icon name="X" /></button>
            </div>

            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '13.5px', color: '#475569', margin: 0 }}>
                {selectedAppt.status === 'approved'
                  ? 'Selecciona la nueva fecha y hora para la cita aprobada.'
                  : 'Selecciona la fecha y hora final acordada con el cliente para esta cita reagendada antes de proceder con su aprobación.'}
              </p>

              {/* Final schedule selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: selectedAppt.status === 'approved' ? '#f8fafc' : '#f5f3ff', border: selectedAppt.status === 'approved' ? '1px solid #e2e8f0' : '1px solid #ddd6fe', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: selectedAppt.status === 'approved' ? '#475569' : '#6d28d9' }}>Fecha Final *</label>
                  <input
                    type="date"
                    value={finalDate}
                    onChange={(e) => setFinalDate(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: selectedAppt.status === 'approved' ? '#475569' : '#6d28d9' }}>Hora Final (Intervalos 15 min) *</label>
                  <select
                    value={finalTime}
                    onChange={(e) => setFinalTime(e.target.value)}
                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', background: 'white' }}
                  >
                    {timeSlotOptions.map((t: string) => (
                      <option key={t} value={t}>{format12h(t)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Visual aid panel (agenda items) inside approve modal */}
              {occupiedSlots && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>Agenda del día seleccionado ({finalDate}):</span>
                  {(() => {
                    const selectStr = finalDate;
                    const dayInfo = occupiedList.find((d: any) => d.dateStr === selectStr);
                    if (!dayInfo) return <div style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Elige una fecha para ver disponibilidad.</div>;
                    if (dayInfo.isClosed) return <div style={{ fontSize: '11.5px', color: '#dc2626', fontWeight: '600' }}>Cerrado: {dayInfo.closedReason}</div>;
                    if (dayInfo.busyTimes.length === 0) return <div style={{ fontSize: '11.5px', color: '#16a34a', fontStyle: 'italic' }}>Todo el día libre</div>;
                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', alignSelf: 'center' }}>Ocupado:</span>
                        {dayInfo.busyTimes.map((t: string, idx: number) => (
                          <span key={idx} style={{ background: '#fee2e2', color: '#991b1b', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>{t}</span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Mensaje a enviar (Editable)</label>
                <textarea
                  value={modalMessage}
                  onChange={(e) => { setModalMessage(e.target.value); setIsMessageEdited(true); }}
                  rows={8}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'Inter, system-ui, sans-serif', outline: 'none', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ padding: '16px 28px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'end', gap: '12px' }}>
              <button
                onClick={() => setActiveModal(null)}
                style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleApproveRescheduledConfirm}
                disabled={!finalDate || !finalTime}
                style={{
                  background: selectedAppt.status === 'approved' ? '#091426' : '#8b5cf6',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 20px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: 'white',
                  cursor: (finalDate && finalTime) ? 'pointer' : 'not-allowed'
                }}
              >
                {selectedAppt.status === 'approved' ? 'Guardar y Reagendar' : 'Actualizar Cita y Aprobar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Cancelar Cita Aprobada */}
      {activeModal === 'cancelApproved' && selectedAppt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '500px', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', margin: 'auto' }}>
            <div style={{ padding: '24px 28px', background: '#dc2626', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="AlertTriangle" />
                <span style={{ fontSize: '18px', fontWeight: '700' }}>Cancelar Cita Aprobada</span>
              </div>
              <button onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}><Icon name="X" /></button>
            </div>

            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'start' }}>
                <Icon name="AlertCircle" className="text-[#dc2626]" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#991b1b' }}>Advertencia Importante</span>
                  <p style={{ fontSize: '13.5px', color: '#7f1d1d', margin: 0, lineHeight: '1.4' }}>
                    Esta acción no puede ser deshecha. ¿Estás seguro de que deseas cancelar la cita de <strong>{selectedAppt.customerName}</strong>?
                    {(() => {
                      const { date, time, period } = formatScheduledAt(selectedAppt.scheduledAt);
                      return (
                        <span style={{ display: 'block', marginTop: '6px', fontSize: '12px', color: '#991b1b', fontWeight: '600' }}>
                          Fecha programada: {date} a las {time} {period}
                        </span>
                      );
                    })()}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 28px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'end', gap: '12px' }}>
              <button
                onClick={() => setActiveModal(null)}
                style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
              >
                Volver
              </button>
              <button
                onClick={handleCancelApprovedConfirm}
                style={{ background: '#dc2626', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: '700', color: 'white', cursor: 'pointer' }}
              >
                Sí, Cancelar Cita
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal A\u00F1adir Cita */}
      {activeModal === 'addAppointment' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', maxWidth: '600px', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '90vh', margin: 'auto' }}>
            <div style={{ padding: '20px 24px', background: '#091426', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="Calendar" />
                <span style={{ fontSize: '18px', fontWeight: '700' }}>Nueva Cita</span>
              </div>
              <button
                onClick={() => {
                  setActiveModal(null);
                  fetchAppointments();
                }}
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}
              >
                <Icon name="X" />
              </button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <AppointmentForm />
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              background: toast.type === 'success' ? '#091426' : '#dc2626',
              color: 'white',
              borderRadius: '10px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              fontSize: '14px',
              fontWeight: '600',
              animation: 'slideInRight 0.25s ease',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <Icon name={toast.type === 'success' ? 'CheckCircle' : 'AlertCircle'} size="sm" />
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboardPage;

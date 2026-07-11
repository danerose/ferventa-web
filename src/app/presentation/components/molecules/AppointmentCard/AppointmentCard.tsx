import React from 'react';
import { Icon, PrimaryButton, SecondaryButton } from '@/app/presentation/components';
import type { AdminAppointment } from '@/app/domain/entities/AdminEntities';
import { formatScheduledAt } from '@/core/utils/formatScheduledAt';

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  completed: 'Completada',
  rescheduled: 'Reagendada',
};

export const STATUS_STYLES: Record<string, { background: string; color: string; border: string }> = {
  pending: { background: '#fffbeb', color: '#b45309', border: '1px solid #fef3c7' },
  approved: { background: '#f0fdf4', color: '#166534', border: '1px solid #dcfce7' },
  rejected: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fee2e2' },
  cancelled: { background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' },
  completed: { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #dbeafe' },
  rescheduled: { background: '#f5f3ff', color: '#5b21b6', border: '1px solid #8b5cf630' },
};

export const STATUS_ACCENT: Record<string, string> = {
  pending: '#fbbf24',
  approved: '#10b981',
  rejected: '#ref4444',
  cancelled: '#94a3b8',
  completed: '#3b82f6',
  rescheduled: '#8b5cf6',
};

export interface AppointmentCardProps {
  appt: AdminAppointment;
  onApproveClick: (appt: AdminAppointment) => void;
  onRejectClick: (appt: AdminAppointment) => void;
  onRescheduleClick: (appt: AdminAppointment) => void;
  onCancelClick?: (appt: AdminAppointment) => void;
  onRescheduleApprovedClick?: (appt: AdminAppointment) => void;
  onCompleteClick?: (appt: AdminAppointment) => void;
  updating: boolean;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appt,
  onApproveClick,
  onRejectClick,
  onRescheduleClick,
  onCancelClick,
  onRescheduleApprovedClick,
  onCompleteClick,
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
          {/* Approve button */}
          <PrimaryButton
            size="sm"
            disabled={updating}
            onClick={() => onApproveClick(appt)}
            className="w-full bg-[#091426] hover:bg-[#1e293b] text-white border-none rounded-lg"
          >
            <Icon name="CheckCircle" size="xs" className="mr-1.5" />
            Aprobar
          </PrimaryButton>

          {/* 2-column grid for Reschedule and Reject */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <SecondaryButton
              size="xs"
              variant="outline"
              disabled={updating}
              onClick={() => onRescheduleClick(appt)}
              className="text-[#091426] border-[#cbd5e1] hover:bg-[#f1f5f9] rounded-lg py-1.5"
            >
              <Icon name="Calendar" size="xs" className="mr-1" />
              Reagendar
            </SecondaryButton>
            <SecondaryButton
              size="xs"
              variant="outline"
              disabled={updating}
              onClick={() => onRejectClick(appt)}
              className="text-[#dc2626] border-[#fca5a5] hover:bg-[#fef2f2] rounded-lg py-1.5"
            >
              <Icon name="XCircle" size="xs" className="mr-1" />
              Rechazar
            </SecondaryButton>
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
          {/* Completar button */}
          <PrimaryButton
            size="sm"
            disabled={updating}
            onClick={() => onCompleteClick?.(appt)}
            className="w-full bg-[#166534] hover:bg-[#15803d] text-white border-none rounded-lg"
          >
            <Icon name="CheckCircle" size="xs" className="mr-1.5" />
            Completar
          </PrimaryButton>

          {/* Reagendar button */}
          <PrimaryButton
            size="sm"
            disabled={updating}
            onClick={() => onRescheduleApprovedClick?.(appt)}
            className="w-full bg-[#091426] hover:bg-[#1e293b] text-white border-none rounded-lg"
          >
            <Icon name="Calendar" size="xs" className="mr-1.5" />
            Reagendar
          </PrimaryButton>

          {/* Cancelar button */}
          <SecondaryButton
            size="sm"
            variant="outline"
            disabled={updating}
            onClick={() => onCancelClick?.(appt)}
            className="w-full text-[#dc2626] border-[#fca5a5] hover:bg-[#fef2f2] rounded-lg"
          >
            <Icon name="XCircle" size="xs" className="mr-1.5" />
            Cancelar
          </SecondaryButton>
        </div>
      )}
    </div>
  );
};

export const SkeletonCard: React.FC = () => (
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

import React from 'react';
import { Icon, PrimaryButton, SecondaryButton } from '@/app/presentation/components';
import { STATUS_LABELS, STATUS_STYLES } from '@/app/presentation/components/molecules/AppointmentCard/AppointmentCard';
import type { AdminAppointment } from '@/app/domain/entities/AdminEntities';

export interface AppointmentDetailDrawerProps {
  appt: AdminAppointment | null;
  onClose: () => void;
  onApproveClick: (appt: AdminAppointment) => void;
  onRejectClick: (appt: AdminAppointment) => void;
  onRescheduleClick: (appt: AdminAppointment) => void;
  onCompleteClick: (appt: AdminAppointment) => void;
  onRescheduleApprovedClick: (appt: AdminAppointment) => void;
  onCancelClick: (appt: AdminAppointment) => void;
}

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

export const AppointmentDetailDrawer: React.FC<AppointmentDetailDrawerProps> = ({
  appt,
  onClose,
  onApproveClick,
  onRejectClick,
  onRescheduleClick,
  onCompleteClick,
  onRescheduleApprovedClick,
  onCancelClick,
}) => {
  if (!appt) return null;

  const statusStyle = STATUS_STYLES[appt.status] || STATUS_STYLES.pending;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9, 20, 38, 0.4)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
        backdropFilter: 'blur(2px)',
        transition: 'opacity 0.2s ease-in-out',
      }}
      onClick={onClose}
    >
      <aside
        style={{
          width: '360px',
          height: '100%',
          background: 'white',
          boxShadow: '-4px 0 24px rgba(9, 20, 38, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.2s ease-out',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid #cbd5e1',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#091426', margin: 0 }}>
              Detalle de la Cita
            </h3>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Información rápida
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Icon name="X" size="md" />
          </button>
        </div>

        {/* Sidebar Body */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Client Profile Card */}
          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#091426',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '16px',
                }}
              >
                {appt.customerName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#091426', margin: 0 }}>
                  {appt.customerName}
                </h4>
                <span
                  style={{
                    ...statusStyle,
                    fontSize: '9.5px',
                    fontWeight: '700',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginTop: '4px',
                  }}
                >
                  {STATUS_LABELS[appt.status] || appt.status}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  Vehículo
                </span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#091426' }}>
                  {appt.vehicle ? `${appt.vehicle.brand} ${appt.vehicle.model}` : 'Genérico'}
                </span>
              </div>
              <div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    display: 'block',
                    marginBottom: '2px',
                  }}
                >
                  Serie
                </span>
                <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', fontWeight: '600', color: '#855300' }}>
                  {appt.vehicle?.serialNumberLastFour ? `***${appt.vehicle.serialNumberLastFour}` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Info Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Phone */}
            {appt.customerPhone && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#eff4ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1e40af',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="Phone" size="sm" />
                </div>
                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                      display: 'block',
                    }}
                  >
                    Teléfono
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#091426' }}>
                    {appt.customerPhone}
                  </span>
                </div>
              </div>
            )}

            {/* Email */}
            {appt.customerEmail && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#eff4ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1e40af',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="Mail" size="sm" />
                </div>
                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                      display: 'block',
                    }}
                  >
                    Correo
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#091426' }}>
                    {appt.customerEmail}
                  </span>
                </div>
              </div>
            )}

            {/* Scheduled time */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#eff4ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1e40af',
                  flexShrink: 0,
                }}
              >
                <Icon name="Clock" size="sm" />
              </div>
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    display: 'block',
                  }}
                >
                  Fecha y Hora
                </span>
                <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#091426', display: 'block' }}>
                  {(() => {
                    const { date, time, period } = formatScheduledAt(appt.scheduledAt);
                    return `${date}, ${time} ${period}`;
                  })()}
                </span>
                {appt.duration && (
                  <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', display: 'block', marginTop: '2px' }}>
                    Duración estimada: {appt.duration} min
                  </span>
                )}
              </div>
            </div>

            {/* Service Requested */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#eff4ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1e40af',
                  flexShrink: 0,
                }}
              >
                <Icon name="Wrench" size="sm" />
              </div>
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    display: 'block',
                  }}
                >
                  Servicio Solicitado
                </span>
                <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#091426' }}>
                  {appt.serviceRequested}
                </span>
              </div>
            </div>

            {/* Mechanic */}
            {appt.assignedMechanic && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#eff4ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1e40af',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="User" size="sm" />
                </div>
                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                      display: 'block',
                    }}
                  >
                    Mecánico Asignado
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#091426' }}>
                    {appt.assignedMechanic}
                  </span>
                </div>
              </div>
            )}

            {/* Branch */}
            {appt.branchName && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#eff4ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1e40af',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="MapPin" size="sm" />
                </div>
                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                      display: 'block',
                    }}
                  >
                    Sucursal
                  </span>
                  <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#091426' }}>
                    {appt.branchName}
                  </span>
                </div>
              </div>
            )}

            {/* Notes */}
            {appt.notes && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#eff4ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1e40af',
                    flexShrink: 0,
                  }}
                >
                  <Icon name="FileText" size="sm" />
                </div>
                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                      display: 'block',
                    }}
                  >
                    Notas
                  </span>
                  <p style={{ fontSize: '13px', fontStyle: 'italic', color: '#475569', margin: 0, lineHeight: '1.4' }}>
                    "{appt.notes}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer Actions */}
        <div
          style={{
            padding: '20px 24px',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {(appt.status === 'pending' || appt.status === 'rescheduled') && (
            <>
              <PrimaryButton
                onClick={() => {
                  onClose();
                  onApproveClick(appt);
                }}
                className="w-full bg-[#091426] hover:bg-[#1e293b] text-white border-none py-2.5 rounded-lg text-[13px]"
              >
                Aprobar Cita
              </PrimaryButton>
              <SecondaryButton
                onClick={() => {
                  onClose();
                  onRescheduleClick(appt);
                }}
                className="w-full bg-white border-[#cbd5e1] hover:bg-[#f1f5f9] text-[#091426] py-2.5 rounded-lg text-[13px]"
              >
                Proponer Reagendación
              </SecondaryButton>
              <SecondaryButton
                onClick={() => {
                  onClose();
                  onRejectClick(appt);
                }}
                className="w-full bg-transparent border-none text-[#dc2626] hover:bg-[#fef2f2] py-2 rounded-lg text-[12px]"
              >
                Rechazar Cita
              </SecondaryButton>
            </>
          )}

          {appt.status === 'approved' && (
            <>
              <PrimaryButton
                onClick={() => {
                  onCompleteClick(appt);
                }}
                className="w-full bg-[#166534] hover:bg-[#15803d] text-white border-none py-2.5 rounded-lg text-[13px]"
              >
                Completar Cita
              </PrimaryButton>
              <PrimaryButton
                onClick={() => {
                  onClose();
                  onRescheduleApprovedClick(appt);
                }}
                className="w-full bg-[#091426] hover:bg-[#1e293b] text-white border-none py-2.5 rounded-lg text-[13px]"
              >
                Reagendar Cita
              </PrimaryButton>
              <SecondaryButton
                onClick={() => {
                  onClose();
                  onCancelClick(appt);
                }}
                className="w-full bg-white border-[#fca5a5] hover:bg-[#fef2f2] text-[#dc2626] py-2.5 rounded-lg text-[13px]"
              >
                Cancelar Cita
              </SecondaryButton>
            </>
          )}

          {(appt.status === 'completed' || appt.status === 'rejected' || appt.status === 'cancelled') && (
            <div
              style={{
                textTransform: 'uppercase',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '0.05em',
                color: '#64748b',
                textAlign: 'center',
                padding: '6px',
              }}
            >
              Esta cita está finalizada ({STATUS_LABELS[appt.status] || appt.status})
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

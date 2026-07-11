import React from 'react';
import { Modal } from '@/app/presentation/components/molecules/Modal/Modal';
import { PrimaryButton, SecondaryButton, Icon } from '@/app/presentation/components';
import type { AdminAppointment } from '@/app/domain/entities/AdminEntities';

export interface CancelApprovedModalProps {
  isOpen: boolean;
  appt: AdminAppointment | null;
  onClose: () => void;
  onConfirm: () => void;
  updating: boolean;
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

export const CancelApprovedModal: React.FC<CancelApprovedModalProps> = ({
  isOpen,
  appt,
  onClose,
  onConfirm,
  updating,
}) => {
  if (!appt) return null;

  const footer = (
    <>
      <SecondaryButton onClick={onClose} disabled={updating}>
        Volver
      </SecondaryButton>
      <PrimaryButton
        onClick={onConfirm}
        disabled={updating}
        loading={updating}
        className="bg-[#dc2626] hover:bg-[#b91c1c] text-white border-none"
      >
        Sí, Cancelar Cita
      </PrimaryButton>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancelar Cita Aprobada"
      footer={footer}
      headerBackground="#dc2626"
      maxWidth="500px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fee2e2',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'start',
          }}
        >
          <Icon name="AlertCircle" className="text-[#dc2626]" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#991b1b' }}>Advertencia Importante</span>
            <p style={{ fontSize: '13.5px', color: '#7f1d1d', margin: 0, lineHeight: '1.4' }}>
              Esta acción no puede ser deshecha. ¿Estás seguro de que deseas cancelar la cita de{' '}
              <strong>{appt.customerName}</strong>?
              {(() => {
                const { date, time, period } = formatScheduledAt(appt.scheduledAt);
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
    </Modal>
  );
};

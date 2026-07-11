import React from 'react';
import { Modal } from '@/app/presentation/components/molecules/Modal/Modal';
import { PrimaryButton, SecondaryButton, Icon } from '@/app/presentation/components';
import type { AdminAppointment } from '@/app/domain/entities/AdminEntities';

export interface CompleteAppointmentModalProps {
  isOpen: boolean;
  appt: AdminAppointment | null;
  onClose: () => void;
  onConfirm: () => void;
  updating: boolean;
}

export const CompleteAppointmentModal: React.FC<CompleteAppointmentModalProps> = ({
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
        Cancelar
      </SecondaryButton>
      <PrimaryButton
        onClick={onConfirm}
        disabled={updating}
        loading={updating}
        className="bg-[#166534] hover:bg-[#15803d] text-white border-none"
      >
        Completar Cita
      </PrimaryButton>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Completar Cita"
      footer={footer}
      headerBackground="#166534"
      maxWidth="500px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'start',
          }}
        >
          <Icon name="CheckCircle" className="text-[#166534]" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#166534' }}>
              Confirmar Recepción de Cliente
            </span>
            <p style={{ fontSize: '13.5px', color: '#14532d', margin: 0, lineHeight: '1.4' }}>
              ¿Deseas marcar la cita de <strong>{appt.customerName}</strong> como completada?
            </p>
            <p style={{ fontSize: '12.5px', color: '#15803d', fontWeight: '600', marginTop: '8px', margin: 0 }}>
              Al dar Completar declaras que el Cliente asistió a la cita y el mantenimiento pasará a mostrarse en la pestaña de mantenimiento.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

import React from 'react';
import { Modal } from '@/app/presentation/components/molecules/Modal/Modal';
import { PrimaryButton, SecondaryButton } from '@/app/presentation/components';
import type { AdminAppointment } from '@/app/domain/entities/AdminEntities';

export interface ApproveAppointmentModalProps {
  isOpen: boolean;
  appt: AdminAppointment | null;
  onClose: () => void;
  modalMessage: string;
  onMessageChange: (val: string) => void;
  onConfirm: () => void;
  updating: boolean;
}

export const ApproveAppointmentModal: React.FC<ApproveAppointmentModalProps> = ({
  isOpen,
  appt,
  onClose,
  modalMessage,
  onMessageChange,
  onConfirm,
  updating,
}) => {
  if (!appt) return null;

  const footer = (
    <>
      <SecondaryButton onClick={onClose} disabled={updating}>
        Cancelar
      </SecondaryButton>
      <PrimaryButton onClick={onConfirm} disabled={updating} loading={updating}>
        Aprobar y Enviar
      </PrimaryButton>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Aprobar Cita"
      footer={footer}
      maxWidth="600px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontSize: '14px', color: '#475569', margin: 0 }}>
          Se aprobará la cita para <strong>{appt.customerName}</strong> y se abrirá WhatsApp con los detalles de confirmación.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
            Mensaje a enviar (Editable)
          </label>
          <textarea
            value={modalMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            rows={8}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13.5px',
              fontFamily: 'Inter, system-ui, sans-serif',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>
      </div>
    </Modal>
  );
};

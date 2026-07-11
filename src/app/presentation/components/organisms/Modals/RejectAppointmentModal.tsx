import React from 'react';
import { Modal } from '@/app/presentation/components/molecules/Modal/Modal';
import { PrimaryButton, SecondaryButton, TextInput } from '@/app/presentation/components';
import type { AdminAppointment } from '@/app/domain/entities/AdminEntities';

export interface RejectAppointmentModalProps {
  isOpen: boolean;
  appt: AdminAppointment | null;
  onClose: () => void;
  rejectionReason: string;
  onRejectionReasonChange: (val: string) => void;
  modalMessage: string;
  onMessageChange: (val: string) => void;
  onConfirm: () => void;
  updating: boolean;
}

export const RejectAppointmentModal: React.FC<RejectAppointmentModalProps> = ({
  isOpen,
  appt,
  onClose,
  rejectionReason,
  onRejectionReasonChange,
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
      <PrimaryButton
        onClick={onConfirm}
        disabled={updating || !rejectionReason.trim()}
        loading={updating}
        className="bg-[#dc2626] hover:bg-[#b91c1c] text-white border-none"
      >
        Rechazar y Enviar
      </PrimaryButton>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rechazar Cita"
      footer={footer}
      headerBackground="#991b1b"
      maxWidth="600px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
            Motivo del rechazo *
          </label>
          <TextInput
            type="text"
            value={rejectionReason}
            onChange={(e) => onRejectionReasonChange(e.target.value)}
            placeholder="Ej. Falta de refacciones para el modelo específico"
            size="sm"
          />
        </div>

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

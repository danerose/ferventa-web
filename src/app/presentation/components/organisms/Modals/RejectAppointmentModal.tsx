import React from 'react';
import { Modal, Textarea } from '@/app/presentation/components';
import { PrimaryButton, SecondaryButton, TextInput } from '@/app/presentation/components';
import type { AdminAppointment } from '@/app/domain';

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
        color="error"
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
      headerVariant="error"
      maxWidth="600px"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-base-content/70">
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

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-base-content/70">
            Mensaje a enviar (Editable)
          </label>
          <Textarea
            value={modalMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            rows={8}
            className="font-sans text-[13.5px]"
          />
        </div>
      </div>
    </Modal>
  );
};


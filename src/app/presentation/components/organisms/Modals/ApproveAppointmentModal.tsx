import React from 'react';
import { Modal, Textarea, PrimaryButton, SecondaryButton, KbdBadge } from '@/app/presentation/components';
import type { AdminAppointment } from '@/app/domain';

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
        Cancelar <KbdBadge keys="Esc" className="ml-1.5" />
      </SecondaryButton>
      <PrimaryButton onClick={onConfirm} disabled={updating} loading={updating}>
        Aprobar y Enviar <KbdBadge keys="Enter ↵" className="ml-1.5" />
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
      <div className="flex flex-col gap-4">
        <p className="text-sm text-base-content/80 m-0">
          Se aprobará la cita para <strong className="text-base-content font-semibold">{appt.customerName}</strong> y se abrirá WhatsApp con los detalles de confirmación.
        </p>

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


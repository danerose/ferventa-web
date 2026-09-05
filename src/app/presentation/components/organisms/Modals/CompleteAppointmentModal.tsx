import React from 'react';
import { Modal, PrimaryButton, SecondaryButton, Icon, KbdBadge } from '@/app/presentation/components';
import type { AdminAppointment } from '@/app/domain';

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
        Cancelar <KbdBadge keys="Esc" className="ml-1.5" />
      </SecondaryButton>
      <PrimaryButton
        onClick={onConfirm}
        disabled={updating}
        loading={updating}
        color="success"
      >
        Completar Cita <KbdBadge keys="Enter ↵" className="ml-1.5" />
      </PrimaryButton>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Completar Cita"
      footer={footer}
      headerVariant="success"
      maxWidth="500px"
    >
      <div className="flex flex-col gap-4">
        <div className="bg-success/10 border border-success/20 rounded-DEFAULT p-4 flex gap-3 items-start">
          <Icon name="CheckCircle" className="text-success shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-success">
              Confirmar Recepción de Cliente
            </span>
            <p className="text-sm text-base-content/80 m-0 leading-relaxed">
              ¿Deseas marcar la cita de <strong className="text-base-content font-semibold">{appt.customerName}</strong> como completada?
            </p>
            <p className="text-xs text-success font-semibold mt-2 m-0">
              Al dar Completar declaras que el Cliente asistió a la cita y el mantenimiento pasará a mostrarse en la pestaña de mantenimiento.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

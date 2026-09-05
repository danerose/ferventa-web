import React from 'react';
import { Modal } from '@/app/presentation/components';
import { AppointmentForm } from '@/app/presentation/components';

export interface AddAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddAppointmentModal: React.FC<AddAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess: _onSuccess,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Cita"
      maxWidth="600px"
    >
      <AppointmentForm
        onCancel={onClose}
      />
    </Modal>
  );
};

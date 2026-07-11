import React from 'react';
import { Modal } from '@/app/presentation/components/molecules/Modal/Modal';
import { AppointmentForm } from '../AppointmentForm';

export interface AddAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddAppointmentModal: React.FC<AddAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        onSuccess();
      }}
      title="Nueva Cita"
      maxWidth="600px"
    >
      <AppointmentForm />
    </Modal>
  );
};

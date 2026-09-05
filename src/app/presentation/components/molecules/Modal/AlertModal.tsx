import React from 'react';
import { Modal } from '@/app/presentation/components';
import { PrimaryButton, KbdBadge } from '@/app/presentation/components';

export interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string | React.ReactNode;
  buttonText?: string;
  isError?: boolean;
}

export const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  buttonText = 'Aceptar',
  isError = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onClose}
      title={title}
      maxWidth="400px"
      headerVariant={isError ? 'error' : 'neutral'}
      footer={
        <>
          <PrimaryButton
            onClick={onClose}
            color={isError ? 'error' : 'primary'}
          >
            {buttonText}
            <KbdBadge keys="Enter ↵" style={{ marginLeft: '6px' }} />
          </PrimaryButton>
        </>
      }
    >
      <div style={{ color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
        {message}
      </div>
    </Modal>
  );
};

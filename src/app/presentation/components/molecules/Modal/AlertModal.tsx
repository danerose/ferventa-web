import React from 'react';
import { Modal } from './Modal';
import { PrimaryButton } from '@/app/presentation/components';

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
      title={title}
      maxWidth="400px"
      headerBackground={isError ? '#ef4444' : '#091426'}
      footer={
        <>
          <PrimaryButton
            onClick={onClose}
            style={isError ? { backgroundColor: '#ef4444', borderColor: '#ef4444' } : undefined}
          >
            {buttonText}
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

import React from 'react';
import { Modal } from './Modal';
import { PrimaryButton, SecondaryButton } from '@/app/presentation/components';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="400px"
      headerBackground={isDestructive ? '#ef4444' : '#091426'}
      footer={
        <>
          <SecondaryButton onClick={onClose}>{cancelText}</SecondaryButton>
          <PrimaryButton
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={isDestructive ? { backgroundColor: '#ef4444', borderColor: '#ef4444' } : undefined}
          >
            {confirmText}
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

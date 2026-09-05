import React from 'react';
import { Modal } from '@/app/presentation/components';
import { PrimaryButton, SecondaryButton, KbdBadge } from '@/app/presentation/components';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  loading?: boolean;
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
  loading = false,
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={title}
      maxWidth="400px"
      headerVariant={isDestructive ? 'error' : 'neutral'}
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={loading}>
            {cancelText}
            <KbdBadge keys="Esc" style={{ marginLeft: '6px' }} />
          </SecondaryButton>
          <PrimaryButton
            onClick={handleConfirm}
            loading={loading}
            disabled={loading}
            color={isDestructive ? 'error' : 'primary'}
          >
            {confirmText}
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

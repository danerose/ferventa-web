import React from 'react';
import { Icon } from '@/app/presentation/components';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerBackground?: string;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  headerBackground = '#091426',
  maxWidth = '600px',
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9, 20, 38, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          maxWidth,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          margin: 'auto',
          maxHeight: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            background: headerBackground,
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '18px', fontWeight: '700' }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              opacity: 0.8,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Icon name="X" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: '16px 24px',
              background: '#f8fafc',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'end',
              gap: '12px',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

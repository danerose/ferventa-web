import React from 'react';
import { Icon, KbdBadge } from '@/app/presentation/components';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerBackground?: string;
  maxWidth?: string;
  zIndex?: number;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  footer,
  headerBackground = '#091426',
  maxWidth = '600px',
  zIndex = 1100,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hasFocusedRef = React.useRef(false);
  const onCloseRef = React.useRef(onClose);
  const onConfirmRef = React.useRef(onConfirm);
  onCloseRef.current = onClose;
  onConfirmRef.current = onConfirm;

  // Auto-focus first input element once on modal open
  React.useEffect(() => {
    if (isOpen && !hasFocusedRef.current) {
      hasFocusedRef.current = true;
      const timer = setTimeout(() => {
        if (containerRef.current) {
          const inputEl = containerRef.current.querySelector<HTMLElement>(
            'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])'
          );
          if (inputEl) {
            inputEl.focus();
          } else {
            const fallbackBtn = containerRef.current.querySelector<HTMLElement>(
              'button:not([title*="Cerrar"]):not([disabled])'
            );
            fallbackBtn?.focus();
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
    if (!isOpen) {
      hasFocusedRef.current = false;
    }
  }, [isOpen]);

  // Keyboard shortcut listener (Esc, Enter)
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
      } else if (e.key === 'Enter') {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'textarea') return;

        if (onConfirmRef.current) {
          e.preventDefault();
          onConfirmRef.current();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(9, 20, 38, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex,
        padding: '20px',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        ref={containerRef}
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
            padding: '16px 24px',
            background: headerBackground,
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: '700' }}>{title}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', color: '#f1f5f9' }}>
              <KbdBadge keys="Tab ↹" style={{ fontSize: '9px', padding: '1px 4px' }} />
              <span>Navegar campos</span>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Cerrar (Esc)"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              opacity: 0.8,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <KbdBadge keys="Esc" style={{ fontSize: '9px', padding: '1px 4px' }} />
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

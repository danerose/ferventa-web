import React from 'react';
import { Icon, KbdBadge } from '@/app/presentation/components';
import { cn } from '@/core/utils/cn';

export type ModalHeaderVariant = 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerVariant?: ModalHeaderVariant;
  headerBackground?: string; // Kept for backward compatibility
  maxWidth?: string;
  zIndex?: number;
  closeOnBackdropClick?: boolean;
}

const headerVariantMap: Record<ModalHeaderVariant, string> = {
  neutral: 'bg-neutral text-neutral-content',
  primary: 'bg-primary text-primary-content',
  secondary: 'bg-secondary text-secondary-content',
  accent: 'bg-accent text-accent-content',
  info: 'bg-info text-info-content',
  success: 'bg-success text-success-content',
  warning: 'bg-warning text-warning-content',
  error: 'bg-error text-error-content',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  footer,
  headerVariant = 'neutral',
  headerBackground,
  maxWidth = '600px',
  zIndex = 1100,
  closeOnBackdropClick = false,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const hasFocusedRef = React.useRef(false);
  const onCloseRef = React.useRef(onClose);
  const onConfirmRef = React.useRef(onConfirm);

  React.useEffect(() => {
    onCloseRef.current = onClose;
    onConfirmRef.current = onConfirm;
  }, [onClose, onConfirm]);

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

  const headerClass = headerVariantMap[headerVariant] || headerVariantMap.neutral;

  return (
    <div
      className="fixed inset-0 bg-neutral/50 backdrop-blur-xs flex items-center justify-center p-5"
      style={{ zIndex }}
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <div
        ref={containerRef}
        className="bg-base-100 text-base-content rounded-2xl flex flex-col overflow-hidden shadow-2xl m-auto max-h-[90vh] w-full border border-base-300 animate-in fade-in zoom-in-95 duration-150"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={cn('px-6 py-4 flex justify-between items-center', headerClass)}
          style={headerBackground ? { background: headerBackground } : undefined}
        >
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold">{title}</span>
            <div className="flex items-center gap-1.5 bg-white/15 px-2 py-0.5 rounded-md text-xs opacity-90">
              <KbdBadge keys="Tab ↹" style={{ fontSize: '9px', padding: '1px 4px' }} />
              <span>Navegar campos</span>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Cerrar (Esc)"
            className="btn btn-ghost btn-xs btn-circle text-current hover:bg-white/20 flex items-center gap-1"
          >
            <Icon name="X" size="sm" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-base-200/50 border-t border-base-300 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

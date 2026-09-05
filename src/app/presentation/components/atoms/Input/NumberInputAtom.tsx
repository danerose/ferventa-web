import React from 'react';
import { cn } from '@/core/utils/cn';
import type { Size } from '@/core/types';

export interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  color?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error';
  size?: Size;
  variant?: 'outline' | 'ghost' | 'soft' | 'bordered';
  error?: boolean;
  allowDecimal?: boolean;
  allowNegative?: boolean;
}

const sizeMap: Record<string, string> = {
  xs: 'input-xs text-xs',
  sm: 'input-sm text-sm',
  md: 'input-md text-base',
  lg: 'input-lg text-lg',
  xl: 'input-lg text-xl',
};

export const NumberInputAtom = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      size = 'md',
      error,
      disabled,
      className,
      allowDecimal = true,
      allowNegative = true,
      onKeyDown,
      onPaste,
      onChange,
      ...props
    },
    ref
  ) => {
    const sizeClass = sizeMap[size] || sizeMap.md;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (onKeyDown) {
        onKeyDown(e);
        if (e.defaultPrevented) return;
      }

      const allowedKeys = [
        'Backspace',
        'Delete',
        'ArrowLeft',
        'ArrowRight',
        'Tab',
        'Enter',
        'Escape',
        'Home',
        'End',
      ];
      
      if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      if (e.key === '-' && allowNegative) {
        const selectionStart = e.currentTarget.selectionStart;
        if (selectionStart !== 0 || e.currentTarget.value.includes('-')) {
          e.preventDefault();
        }
        return;
      }

      if (e.key === '.' && allowDecimal) {
        if (e.currentTarget.value.includes('.')) {
          e.preventDefault();
        }
        return;
      }

      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (onPaste) {
        onPaste(e);
        if (e.defaultPrevented) return;
      }

      const text = e.clipboardData.getData('text');
      const regex = allowDecimal
        ? (allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/)
        : (allowNegative ? /^-?\d*$/ : /^\d*$/);

      if (!regex.test(text)) {
        e.preventDefault();
      }
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onChange={onChange}
        className={cn(
          'input input-bordered w-full font-data-mono bg-base-100 text-base-content border-base-300 placeholder:text-base-content/40 rounded-DEFAULT focus:border-primary transition-all duration-150',
          sizeClass,
          error && 'input-error border-error text-error',
          disabled && 'opacity-50 cursor-not-allowed bg-base-200',
          className
        )}
        {...props}
      />
    );
  }
);

NumberInputAtom.displayName = 'NumberInputAtom';
export const NumberInput = NumberInputAtom;

import React from 'react';
import { cn } from '@/core/utils/cn';
import type { Size } from '@/core/types';

export interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  color?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error';
  size?: Size;
  variant?: 'outline' | 'ghost' | 'soft' | 'bordered';
  error?: boolean;
  errorMessage?: string;
}

const sizeMap: Record<string, string> = {
  xs: 'input-xs text-xs',
  sm: 'input-sm text-sm',
  md: 'input-md text-base',
  lg: 'input-lg text-lg',
  xl: 'input-lg text-xl',
};

export const TextInputAtom = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      size = 'md',
      error,
      errorMessage,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const hasError = error || !!errorMessage;
    const sizeClass = sizeMap[size] || sizeMap.md;

    return (
      <div className="w-full">
        <input
          ref={ref}
          type="text"
          disabled={disabled}
          className={cn(
            'input input-bordered w-full bg-base-100 text-base-content border-base-300 placeholder:text-base-content/40 rounded-DEFAULT focus:border-primary transition-all duration-150',
            sizeClass,
            hasError && 'input-error border-error text-error',
            disabled && 'opacity-50 cursor-not-allowed bg-base-200',
            className
          )}
          {...props}
        />
        {errorMessage && (
          <span className="text-error text-[11px] mt-1 block font-medium">
            {errorMessage}
          </span>
        )}
      </div>
    );
  }
);

TextInputAtom.displayName = 'TextInputAtom';
export const TextInput = TextInputAtom;

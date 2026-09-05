import React from 'react';
import { cn } from '@/core/utils/cn';
import type { Size } from '@/core/types';

export interface ToggleAtomProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: Size;
  label?: string;
}

const sizeStyles: Record<Size, string> = {
  xs: 'toggle-xs',
  sm: 'toggle-sm',
  md: 'toggle-md',
  lg: 'toggle-lg',
  xl: 'toggle-lg',
};

export const ToggleAtom: React.FC<ToggleAtomProps> = ({
  size = 'md',
  label,
  className,
  id,
  ...props
}) => {
  const inputId = id || (label ? `tg-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const inputElement = (
    <input
      type="checkbox"
      id={inputId}
      className={cn(
        'toggle toggle-primary transition-all',
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );

  if (label) {
    return (
      <label htmlFor={inputId} className="inline-flex items-center gap-2 cursor-pointer select-none">
        {inputElement}
        <span className="text-sm font-medium text-base-content">{label}</span>
      </label>
    );
  }

  return inputElement;
};

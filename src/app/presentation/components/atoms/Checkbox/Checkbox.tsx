import React from 'react';
import { cn } from '@/core/utils/cn';
import type { Size } from '@/core/types';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: Size;
  label?: string;
}

const sizeStyles: Record<Size, string> = {
  xs: 'checkbox-xs',
  sm: 'checkbox-sm',
  md: 'checkbox-md',
  lg: 'checkbox-lg',
  xl: 'checkbox-lg',
};

export const Checkbox: React.FC<CheckboxProps> = ({
  size = 'md',
  label,
  className,
  id,
  ...props
}) => {
  const inputId = id || (label ? `cb-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const inputElement = (
    <input
      type="checkbox"
      id={inputId}
      className={cn(
        'checkbox checkbox-primary rounded transition-all',
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
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      </label>
    );
  }

  return inputElement;
};

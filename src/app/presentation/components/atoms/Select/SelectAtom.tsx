import React from 'react';
import { cn } from '@/core/utils/cn';
import type { Size } from '@/core/types';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: Size;
  options?: SelectOption[];
  isError?: boolean;
  fullWidth?: boolean;
}

const sizeStyles: Record<Size, string> = {
  xs: 'select-xs text-xs h-7 min-h-7',
  sm: 'select-sm text-xs h-8 min-h-8',
  md: 'select-md text-sm h-10 min-h-10',
  lg: 'select-lg text-base h-12 min-h-12',
  xl: 'select-lg text-lg h-14 min-h-14',
};

export const SelectAtom: React.FC<SelectProps> = ({
  size = 'md',
  options,
  isError = false,
  fullWidth = true,
  className,
  children,
  ...props
}) => {
  return (
    <select
      className={cn(
        'select select-bordered rounded-DEFAULT bg-base-100 text-base-content border-base-300 transition-colors focus:border-primary focus:outline-none',
        sizeStyles[size],
        fullWidth && 'w-full',
        isError && 'select-error border-error text-error',
        className
      )}
      {...props}
    >
      {options
        ? options.map((opt) => (
            <option key={String(opt.value)} value={opt.value} disabled={opt.disabled} className="bg-base-100 text-base-content">
              {opt.label}
            </option>
          ))
        : children}
    </select>
  );
};

export const Select = SelectAtom;

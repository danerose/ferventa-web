import React from 'react';
import { cn } from '@/core/utils/cn';
import type { Size, StatusVariant } from '@/core/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant | 'ghost' | 'outline' | 'soft';
  size?: Size;
  children: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  primary: 'badge-primary text-primary-content border-primary',
  secondary: 'badge-secondary text-secondary-content border-secondary',
  accent: 'badge-accent text-accent-content border-accent',
  info: 'badge-info text-info-content border-info',
  success: 'badge-success text-success-content border-success',
  warning: 'badge-warning text-warning-content border-warning',
  error: 'badge-error text-error-content border-error',
  neutral: 'badge-neutral text-neutral-content border-neutral',
  ghost: 'badge-ghost text-base-content border-transparent',
  outline: 'badge-outline text-base-content border-current',
  soft: 'badge-soft text-primary',
};

const sizeStyles: Record<Size, string> = {
  xs: 'badge-xs text-[10px] px-1.5 py-0.5',
  sm: 'badge-sm text-xs px-2 py-0.5',
  md: 'badge-md text-sm px-2.5 py-1',
  lg: 'badge-lg text-base px-3 py-1.5',
  xl: 'badge-lg text-lg px-4 py-2',
};

export const BadgeAtom: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'badge inline-flex items-center justify-center font-medium rounded-full transition-colors',
        variantStyles[variant] || variantStyles.neutral,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export const Badge = BadgeAtom;

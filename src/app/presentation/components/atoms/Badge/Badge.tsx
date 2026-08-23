import React from 'react';
import { cn } from '@/core/utils/cn';
import type { Size, StatusVariant } from '@/core/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant | 'ghost' | 'outline' | 'soft';
  size?: Size;
  children: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  primary: 'bg-primary text-primary-content border-primary',
  secondary: 'bg-secondary text-secondary-content border-secondary',
  accent: 'bg-accent text-accent-content border-accent',
  info: 'bg-info text-info-content border-info',
  success: 'bg-emerald-500 text-white border-emerald-500 dark:bg-emerald-600',
  warning: 'bg-amber-500 text-slate-950 border-amber-500 dark:bg-amber-600 dark:text-white',
  error: 'bg-rose-500 text-white border-rose-500 dark:bg-rose-600',
  neutral: 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600',
  ghost: 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent',
  outline: 'bg-transparent border border-current',
  soft: 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:border-primary/30',
};

const sizeStyles: Record<Size, string> = {
  xs: 'badge-xs text-[10px] px-1.5 py-0.5',
  sm: 'badge-sm text-xs px-2 py-0.5',
  md: 'badge-md text-sm px-2.5 py-1',
  lg: 'badge-lg text-base px-3 py-1.5',
  xl: 'text-lg px-4 py-2',
};

export const Badge: React.FC<BadgeProps> = ({
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

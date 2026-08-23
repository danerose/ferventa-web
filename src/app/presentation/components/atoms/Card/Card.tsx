import React from 'react';
import { cn } from '@/core/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const paddingStyles: Record<string, string> = {
  none: 'p-0',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
};

const variantStyles: Record<string, string> = {
  elevated: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm',
  outlined: 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700',
  flat: 'bg-slate-50 dark:bg-slate-800/50 border border-transparent',
};

export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  padding = 'md',
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-xl transition-colors',
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

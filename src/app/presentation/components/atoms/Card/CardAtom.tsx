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
  elevated: 'bg-base-100 border border-base-300 text-base-content shadow-sm',
  outlined: 'bg-base-100 border border-base-300 text-base-content',
  flat: 'bg-base-200 border border-transparent text-base-content',
};

export const CardAtom: React.FC<CardProps> = ({
  variant = 'elevated',
  padding = 'md',
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-lg transition-colors',
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

export const Card = CardAtom;

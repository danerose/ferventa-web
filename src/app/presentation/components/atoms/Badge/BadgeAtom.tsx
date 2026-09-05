import React from 'react';
import { cn } from '@/core/utils/cn';
import type { Size, StatusVariant } from '@/core/types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant | 'ghost' | 'outline' | 'soft' | 'solid';
  color?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'neutral';
  size?: Size;
  children: React.ReactNode;
}

const colorStyles: Record<string, { solid: string; soft: string; outline: string }> = {
  primary: {
    solid: 'bg-primary text-primary-content border-primary',
    soft: 'bg-primary/15 text-primary border-primary/30',
    outline: 'border-primary text-primary bg-transparent',
  },
  secondary: {
    solid: 'bg-secondary text-secondary-content border-secondary',
    soft: 'bg-secondary/15 text-secondary border-secondary/30',
    outline: 'border-secondary text-secondary bg-transparent',
  },
  accent: {
    solid: 'bg-accent text-accent-content border-accent',
    soft: 'bg-accent/15 text-accent border-accent/30',
    outline: 'border-accent text-accent bg-transparent',
  },
  info: {
    solid: 'bg-info text-info-content border-info',
    soft: 'bg-info/15 text-info border-info/30',
    outline: 'border-info text-info bg-transparent',
  },
  success: {
    solid: 'bg-success text-success-content border-success',
    soft: 'bg-success/15 text-success border-success/30',
    outline: 'border-success text-success bg-transparent',
  },
  warning: {
    solid: 'bg-warning text-warning-content border-warning',
    soft: 'bg-warning/20 text-warning border-warning/40',
    outline: 'border-warning text-warning bg-transparent',
  },
  error: {
    solid: 'bg-error text-error-content border-error',
    soft: 'bg-error/15 text-error border-error/30',
    outline: 'border-error text-error bg-transparent',
  },
  neutral: {
    solid: 'bg-neutral text-neutral-content border-neutral',
    soft: 'bg-base-300 text-base-content/80 border-base-300',
    outline: 'border-base-300 text-base-content/80 bg-transparent',
  },
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
  color,
  size = 'md',
  className,
  children,
  ...props
}) => {
  const effectiveColor = color || (variant in colorStyles ? variant : 'neutral');
  const styleType = variant === 'soft' || variant === 'outline' ? variant : 'solid';
  const colorClass = colorStyles[effectiveColor]?.[styleType] || colorStyles.neutral.solid;
  const isGhost = variant === 'ghost';

  return (
    <span
      className={cn(
        'badge inline-flex items-center justify-center font-semibold rounded-full border transition-colors',
        isGhost ? 'bg-transparent text-base-content border-transparent' : colorClass,
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


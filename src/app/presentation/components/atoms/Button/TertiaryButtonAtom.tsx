import React from 'react';
import { cn } from '@/core/utils/cn';
import type { Size } from '@/core/types';
import type { ButtonColor } from './PrimaryButtonAtom';

export interface TertiaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size;
  color?: ButtonColor | 'default';
  loading?: boolean;
  skeleton?: boolean;
  iconStart?: React.ReactNode;
  iconEnd?: React.ReactNode;
}

const sizeMap: Record<Size, string> = {
  xs: 'btn-xs min-h-[28px]',
  sm: 'btn-sm min-h-[36px]',
  md: 'btn-md min-h-[44px]',
  lg: 'btn-lg min-h-[52px]',
  xl: 'btn-xl min-h-[60px]',
};

const colorMap: Record<ButtonColor | 'default', string> = {
  default: 'text-base-content hover:bg-base-200',
  primary: 'text-primary hover:bg-primary/10',
  secondary: 'text-secondary hover:bg-secondary/10',
  accent: 'text-accent hover:bg-accent/10',
  neutral: 'text-base-content/80 hover:text-base-content hover:bg-base-200',
  info: 'text-info hover:bg-info/10',
  success: 'text-success hover:bg-success/10',
  warning: 'text-warning hover:bg-warning/10',
  error: 'text-error hover:bg-error/10',
};

export const TertiaryButtonAtom = React.forwardRef<HTMLButtonElement, TertiaryButtonProps>(
  (
    {
      size = 'md',
      color = 'default',
      disabled,
      loading,
      skeleton,
      className,
      children,
      type = 'button',
      iconStart,
      iconEnd,
      ...props
    },
    ref
  ) => {
    const sizeClass = sizeMap[size];
    const colorClass = colorMap[color] || colorMap.default;

    if (skeleton) {
      return (
        <div
          className={cn('skeleton rounded-DEFAULT bg-base-300 inline-block', sizeClass, className)}
          style={{ width: '120px' }}
        />
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          'btn btn-ghost font-medium rounded-DEFAULT select-none transition-all duration-150 active:scale-[0.98]',
          colorClass,
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          sizeClass,
          className
        )}
        {...props}
      >
        {loading && <span className="loading loading-spinner loading-xs mr-1" />}
        {!loading && iconStart && <span className="inline-flex shrink-0 mr-1.5">{iconStart}</span>}
        {children}
        {iconEnd && <span className="inline-flex shrink-0 ml-1.5">{iconEnd}</span>}
      </button>
    );
  }
);



TertiaryButtonAtom.displayName = 'TertiaryButtonAtom';

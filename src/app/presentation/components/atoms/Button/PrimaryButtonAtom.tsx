import React from 'react';
import { cn } from '@/core/utils/cn';
import type { Size } from '@/core/types';

export type ButtonColor = 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error';

export interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size;
  color?: ButtonColor;
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

const colorMap: Record<ButtonColor, string> = {
  primary: 'btn-primary text-primary-content',
  secondary: 'btn-secondary text-secondary-content',
  accent: 'btn-accent text-accent-content',
  neutral: 'btn-neutral text-neutral-content',
  info: 'btn-info text-info-content',
  success: 'btn-success text-success-content',
  warning: 'btn-warning text-warning-content',
  error: 'btn-error text-error-content',
};

export const PrimaryButtonAtom = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  (
    {
      size = 'md',
      color = 'primary',
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
    const isBtnDisabled = disabled || loading;
    const colorClass = isBtnDisabled
      ? 'bg-base-300 text-base-content/50 border-base-300 cursor-not-allowed pointer-events-none'
      : (colorMap[color] || colorMap.primary);

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
        disabled={isBtnDisabled}
        className={cn(
          'btn font-semibold rounded-DEFAULT select-none transition-all duration-150 active:scale-[0.98]',
          colorClass,
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



PrimaryButtonAtom.displayName = 'PrimaryButtonAtom';

import React from 'react';
import { cn } from '@/core/utils/cn';

export interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'solid' | 'outline' | 'soft' | 'ghost' | 'link';
  loading?: boolean;
  skeleton?: boolean;
}

const sizeMap: Record<string, string> = {
  xs: 'px-2.5 py-1 text-xs min-h-[28px]',
  sm: 'px-3.5 py-1.5 text-sm min-h-[36px]',
  md: 'px-4 py-2 text-base min-h-[44px]',
  lg: 'px-5 py-2.5 text-lg min-h-[52px]',
  xl: 'px-8 py-4 text-xl min-h-[64px]',
};

const variantMap = {
  solid: 'bg-[#1e293b] text-white hover:bg-[#0f172a] border-none shadow-sm',
  outline: 'border border-[#1e293b] text-[#1e293b] bg-transparent hover:bg-[#f1f5f9]',
  soft: 'bg-[#cbd5e1]/40 text-[#1e293b] hover:bg-[#cbd5e1]/60',
  ghost: 'bg-transparent text-[#1e293b] hover:bg-[#f1f5f9]',
  link: 'bg-transparent text-[#1e293b] underline hover:text-[#0f172a] p-0 min-h-0',
};

export const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
  (
    {
      size = 'md',
      variant = 'solid',
      disabled,
      loading,
      skeleton,
      className,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const sizeClass = sizeMap[size];
    const variantClass = variantMap[variant];

    if (skeleton) {
      return (
        <div
          className={cn(
            'skeleton animate-pulse rounded bg-gray-200 inline-block',
            sizeClass,
            className
          )}
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
          'inline-flex items-center justify-center font-semibold rounded select-none transition-colors duration-150 ease-in-out active:scale-[0.98]',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          variantClass,
          sizeClass,
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

PrimaryButton.displayName = 'PrimaryButton';

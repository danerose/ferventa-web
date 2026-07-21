import React from 'react';
import { cn } from '@/core/utils/cn';

export interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  color?: 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'ghost' | 'soft' | 'bordered';
  error?: boolean;
  errorMessage?: string;
}

const colorMap = {
  primary: 'focus:border-[#091426] border-[#cbd5e1]',
  secondary: 'focus:border-[#855300] border-[#cbd5e1]',
  accent: 'focus:border-[#f59e0b] border-[#cbd5e1]',
  neutral: 'focus:border-[#1e293b] border-[#cbd5e1]',
  info: 'focus:border-blue-500 border-blue-200',
  success: 'focus:border-[#10b981] border-[#10b981]/30 bg-[#10b981]/5',
  warning: 'focus:border-[#f59e0b] border-[#f59e0b]/30 bg-[#f59e0b]/5',
  error: 'focus:border-[#ba1a1a] border-[#ba1a1a]/30 bg-[#ba1a1a]/5',
};

const sizeMap = {
  xs: 'px-2.5 py-1 text-xs min-h-[28px]',
  sm: 'px-3 py-1.5 text-sm min-h-[36px]',
  md: 'px-3.5 py-2 text-base min-h-[44px]',
  lg: 'px-4 py-2.5 text-lg min-h-[52px]',
};

const variantMap = {
  outline: 'border bg-white',
  bordered: 'border border-2 bg-white',
  ghost: 'border-transparent bg-transparent hover:bg-[#f1f5f9] focus:bg-white focus:border-gray-300',
  soft: 'border-transparent bg-[#e5eeff]/40 text-[#0b1c30] hover:bg-[#e5eeff]/60 focus:bg-white focus:border-[#1e293b]',
};

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      color = 'neutral',
      size = 'md',
      variant = 'outline',
      error,
      errorMessage,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const hasError = error || !!errorMessage;
    return (
      <div className="w-full">
        <input
          ref={ref}
          type="text"
          disabled={disabled}
          className={cn(
            'w-full font-sans rounded border-[#cbd5e1] text-[#0b1c30] placeholder:text-gray-400 outline-none transition-all duration-150',
            'focus:ring-0 focus:border-2',
            disabled && 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60',
            variantMap[variant],
            colorMap[color],
            sizeMap[size],
            hasError && 'border-[#ba1a1a] focus:border-[#ba1a1a] bg-[#ba1a1a]/5 text-[#ba1a1a]',
            className
          )}
          {...props}
        />
        {errorMessage && (
          <span className="text-[#ba1a1a] text-[11px] mt-1 block font-medium animate-fadeIn">
            {errorMessage}
          </span>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';

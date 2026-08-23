import React from 'react';
import { cn } from '@/core/utils/cn';

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'p' | 'span' | 'label' | 'div' | 'small' | 'strong';
  variant?: 'body' | 'caption' | 'muted' | 'mono' | 'label' | 'error' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  children: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  body: 'text-slate-800 dark:text-slate-200',
  caption: 'text-slate-500 dark:text-slate-400',
  muted: 'text-slate-400 dark:text-slate-500',
  mono: 'font-mono text-slate-700 dark:text-slate-300',
  label: 'text-slate-700 dark:text-slate-300 font-medium',
  error: 'text-rose-600 dark:text-rose-400 font-medium',
  success: 'text-emerald-600 dark:text-emerald-400 font-medium',
};

const sizeStyles: Record<string, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

const weightStyles: Record<string, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export const Text: React.FC<TextProps> = ({
  as: Component = 'p',
  variant = 'body',
  size = 'sm',
  weight = 'normal',
  className,
  children,
  ...props
}) => {
  return (
    <Component
      className={cn(
        variantStyles[variant],
        sizeStyles[size],
        weightStyles[weight],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

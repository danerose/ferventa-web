import React from 'react';
import { cn } from '@/core/utils/cn';

export interface TextAtomProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'p' | 'span' | 'label' | 'div' | 'small' | 'strong';
  variant?: 'body' | 'caption' | 'muted' | 'mono' | 'label' | 'error' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  children: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  body: 'text-base-content',
  caption: 'text-base-content/70',
  muted: 'text-base-content/50',
  mono: 'font-data-mono text-base-content/80',
  label: 'text-base-content font-medium',
  error: 'text-error font-medium',
  success: 'text-success font-medium',
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

export const TextAtom: React.FC<TextAtomProps> = ({
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

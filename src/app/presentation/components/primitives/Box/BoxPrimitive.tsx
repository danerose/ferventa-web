import React from 'react';
import { cn } from '@/core/utils/cn';

export interface BoxProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  p?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  px?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  py?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  m?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  bg?: 'base-100' | 'base-200' | 'base-300' | 'primary' | 'secondary' | 'neutral' | 'info' | 'success' | 'warning' | 'error';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full' | 'DEFAULT';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  target?: string;
  rel?: string;
  src?: string;
  alt?: string;
  type?: string;
  accept?: string;
  multiple?: boolean;
  colSpan?: number;
  rowSpan?: number;
  children?: React.ReactNode;
}

const pMap = {
  none: 'p-0',
  xs: 'p-1',
  sm: 'p-2',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

const pxMap = {
  none: 'px-0',
  xs: 'px-1',
  sm: 'px-2',
  md: 'px-4',
  lg: 'px-6',
  xl: 'px-8',
};

const pyMap = {
  none: 'py-0',
  xs: 'py-1',
  sm: 'py-2',
  md: 'py-4',
  lg: 'py-6',
  xl: 'py-8',
};

const mMap = {
  none: 'm-0',
  xs: 'm-1',
  sm: 'm-2',
  md: 'm-4',
  lg: 'm-6',
  xl: 'm-8',
};

const bgMap = {
  'base-100': 'bg-base-100 text-base-content',
  'base-200': 'bg-base-200 text-base-content',
  'base-300': 'bg-base-300 text-base-content',
  primary: 'bg-primary text-primary-content',
  secondary: 'bg-secondary text-secondary-content',
  neutral: 'bg-neutral text-neutral-content',
  info: 'bg-info text-info-content',
  success: 'bg-success text-success-content',
  warning: 'bg-warning text-warning-content',
  error: 'bg-error text-error-content',
};

const roundedMap = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-DEFAULT',
  DEFAULT: 'rounded-DEFAULT',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
};


const shadowMap = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
};

export const BoxPrimitive = React.forwardRef<HTMLElement, BoxProps>(
  (
    {
      as: Component = 'div',
      p,
      px,
      py,
      m,
      bg,
      rounded,
      shadow,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(
          p && pMap[p],
          px && pxMap[px],
          py && pyMap[py],
          m && mMap[m],
          bg && bgMap[bg],
          rounded && roundedMap[rounded],
          shadow && shadowMap[shadow],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);


BoxPrimitive.displayName = 'BoxPrimitive';
export const Box = BoxPrimitive;

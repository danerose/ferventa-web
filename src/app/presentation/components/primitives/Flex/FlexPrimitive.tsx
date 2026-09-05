import React from 'react';
import { cn } from '@/core/utils/cn';

export interface FlexProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  direction?: 'row' | 'row-reverse' | 'col' | 'col-reverse';
  wrap?: boolean | 'wrap' | 'wrap-reverse' | 'nowrap';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  children?: React.ReactNode;
}

const directionMap = {
  row: 'flex-row',
  'row-reverse': 'flex-row-reverse',
  col: 'flex-col',
  'col-reverse': 'flex-col-reverse',
};

const wrapMap = {
  true: 'flex-wrap',
  false: 'flex-nowrap',
  wrap: 'flex-wrap',
  'wrap-reverse': 'flex-wrap-reverse',
  nowrap: 'flex-nowrap',
};

const gapMap = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
};

const justifyMap = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const alignMap = {
  start: 'items-start',
  end: 'items-end',
  center: 'items-center',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
};

export const FlexPrimitive = React.forwardRef<HTMLElement, FlexProps>(
  (
    {
      as: Component = 'div',
      direction = 'row',
      wrap = false,
      gap = 'none',
      justify = 'start',
      align = 'stretch',
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
          'flex',
          direction && directionMap[direction],
          wrap !== undefined && wrapMap[String(wrap) as keyof typeof wrapMap],
          gap && gapMap[gap],
          justify && justifyMap[justify],
          align && alignMap[align],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);


FlexPrimitive.displayName = 'FlexPrimitive';
export const Flex = FlexPrimitive;

import React from 'react';
import { cn } from '@/core/utils/cn';

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
}

const headingStyles: Record<number, string> = {
  1: 'font-display-lg text-base-content tracking-tight',
  2: 'font-headline-md text-base-content tracking-tight',
  3: 'text-lg font-semibold text-base-content',
  4: 'text-base font-semibold text-base-content',
  5: 'text-sm font-medium text-base-content',
  6: 'text-xs font-medium text-base-content/80',
};

export const HeadingAtom: React.FC<HeadingProps> = ({
  level = 2,
  className,
  children,
  ...props
}) => {
  const Tag = `h${level}` as React.ElementType;

  return (
    <Tag className={cn(headingStyles[level], className)} {...props}>
      {children}
    </Tag>
  );
};

export const Heading = HeadingAtom;

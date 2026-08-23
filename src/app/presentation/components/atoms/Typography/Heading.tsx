import React from 'react';
import { cn } from '@/core/utils/cn';

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
}

const headingStyles: Record<number, string> = {
  1: 'text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50',
  2: 'text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100',
  3: 'text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100',
  4: 'text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-200',
  5: 'text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200',
  6: 'text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300',
};

export const Heading: React.FC<HeadingProps> = ({
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

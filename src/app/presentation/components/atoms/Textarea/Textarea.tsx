import React from 'react';
import { cn } from '@/core/utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isError?: boolean;
  fullWidth?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  isError = false,
  fullWidth = true,
  className,
  rows = 3,
  ...props
}) => {
  return (
    <textarea
      rows={rows}
      className={cn(
        'textarea textarea-bordered rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 transition-colors focus:border-primary focus:outline-none text-sm',
        fullWidth && 'w-full',
        isError && 'border-rose-500 focus:border-rose-500',
        className
      )}
      {...props}
    />
  );
};

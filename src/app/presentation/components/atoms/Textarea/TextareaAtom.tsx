import React from 'react';
import { cn } from '@/core/utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  isError?: boolean;
  fullWidth?: boolean;
}

export const TextareaAtom: React.FC<TextareaProps> = ({
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
        'textarea textarea-bordered rounded-DEFAULT bg-base-100 text-base-content border-base-300 placeholder:text-base-content/40 transition-colors focus:border-primary focus:outline-none text-sm',
        fullWidth && 'w-full',
        isError && 'textarea-error border-error text-error',
        className
      )}
      {...props}
    />
  );
};

export const Textarea = TextareaAtom;

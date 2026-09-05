import React from 'react';
import { cn } from '@/core/utils/cn';

export interface KbdBadgeAtomProps extends React.HTMLAttributes<HTMLElement> {
  keys: string;
}

export const KbdBadgeAtom: React.FC<KbdBadgeAtomProps> = ({ keys, className, ...props }) => {
  return (
    <kbd
      className={cn(
        'kbd kbd-sm bg-base-200 border-base-300 text-base-content font-mono font-semibold text-[10px] px-1.5 py-0.5 shadow-sm inline-flex items-center justify-center gap-0.5 select-none whitespace-nowrap',
        className
      )}
      {...props}
    >
      {keys}
    </kbd>
  );
};

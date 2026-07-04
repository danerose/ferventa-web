import React from 'react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/core/utils/cn';

export type IconName = keyof typeof LucideIcons;

export interface IconProps extends Omit<React.HTMLAttributes<SVGElement>, 'color'> {
  name: IconName;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  color?: string;
  className?: string;
}

const sizeMap = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export const Icon = React.forwardRef<SVGSVGElement, IconProps>(
  ({ name, size = 'md', color, className, ...props }, ref) => {
    const LucideIconComponent = LucideIcons[name] as React.ComponentType<{
      size?: number;
      color?: string;
      className?: string;
      ref?: React.Ref<SVGSVGElement>;
    }>;

    if (!LucideIconComponent) {
      console.warn(`Icon component "${name}" not found in lucide-react`);
      return null;
    }

    const calculatedSize = typeof size === 'number' ? size : sizeMap[size];

    return (
      <LucideIconComponent
        ref={ref}
        size={calculatedSize}
        color={color}
        className={cn('inline-block shrink-0', className)}
        {...props}
      />
    );
  }
);

Icon.displayName = 'Icon';

import React from 'react';
import { FlexPrimitive, type FlexProps } from '../Flex/FlexPrimitive';

export type StackProps = Omit<FlexProps, 'direction'> & {
  spacing?: FlexProps['gap'];
};

export const StackPrimitive = React.forwardRef<HTMLDivElement, StackProps>(
  ({ children, spacing, gap, ...props }, ref) => {
    return (
      <FlexPrimitive ref={ref} direction="col" gap={gap ?? spacing ?? 'none'} {...props}>
        {children}
      </FlexPrimitive>
    );
  }
);

StackPrimitive.displayName = 'StackPrimitive';
export const Stack = StackPrimitive;

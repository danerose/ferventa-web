import React from 'react';
import { Flex, type FlexProps } from '../Flex/Flex';

export type StackProps = Omit<FlexProps, 'direction'>;

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ children, ...props }, ref) => {
    return (
      <Flex ref={ref} direction="col" {...props}>
        {children}
      </Flex>
    );
  }
);

Stack.displayName = 'Stack';

import { VariantProps, cva } from 'class-variance-authority';
import React from 'react';
import { cn } from '../../lib/utils';

const containerVariants = cva('px-2 md:px-4 mx-auto xl:px-0', {
  variants: {
    size: {
      default: 'max-w-screen-xl',
      screenMd: 'max-w-screen-md',
      md: 'max-w-md',
      '2xl': 'max-w-screen-2xl',
      full: 'max-w-full'
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export interface ContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <div
        className={cn(
          containerVariants({
            size,
          }),
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Container.displayName = 'Container';

export { Container };

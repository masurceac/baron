import React, { forwardRef } from 'react';
import { cva, VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const createTypography = (
  Tag: React.ElementType,
  baseClass: string,
  options?: Parameters<typeof cva>[1]
) => {
  const classNameVariants = cva(
    baseClass,
    options ?? {
      variants: {
        variant: {
          default: '',
          action: 'flex justify-between items-center',
        },
      },
      defaultVariants: {
        variant: 'default',
      },
    }
  );

  const component = forwardRef<
    HTMLElement,
    React.HTMLAttributes<HTMLElement> & VariantProps<typeof classNameVariants>
  >(({ children, className, ...props }, ref) => (
    <Tag
      {...props}
      ref={ref}
      className={cn(classNameVariants({ className, ...props }))}
    >
      {children}
    </Tag>
  ));
  component.displayName = `Typography${Tag}`;

  return component;
};

import { cn } from '@baron/ui/lib/utils';

export function RedGreenHighlight(props: {
  variant: 'red' | 'green';
  children: React.ReactNode;
  className?: string;
}) {
  return props.variant === 'green' ? (
    <span className={cn('text-green-500', props.className)}>
      {props.children}
    </span>
  ) : (
    <span className={cn('text-red-500', props.className)}>
      {props.children}
    </span>
  );
}

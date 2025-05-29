import { ReactNode } from 'react';
import { ControllerProps, FieldPath, FieldValues } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { cn } from '../../lib/utils';

interface FormFieldWrapperProps {
  label?: ReactNode;
  rightLabel?: ReactNode;
  description?: ReactNode;
  className?: string;
  hideErrorMessage?: boolean;
}

const FormFieldWrapper = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  rightLabel,
  description,
  render,
  className,
  hideErrorMessage,
  ...props
}: FormFieldWrapperProps & ControllerProps<TFieldValues, TName>) => {
  return (
    <FormField
      {...props}
      render={(field) => (
        <FormItem
          className={cn('group', className)}
          data-error={!!field.fieldState.error}
          data-success={field.formState.isSubmitSuccessful}
        >
          <div className="flex justify-between">
            {label && <FormLabel className="text-nowrap">{label}</FormLabel>}
            {rightLabel && (
              <FormLabel className="text-nowrap">{rightLabel}</FormLabel>
            )}
          </div>

          <FormControl>{render(field)}</FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          {!hideErrorMessage ? <FormMessage /> : null}
        </FormItem>
      )}
    />
  );
};

export { FormFieldWrapper };

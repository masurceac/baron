import { simulationRoomSchema } from '@baron/schema';
import { Button } from '@baron/ui/components/button';
import { Form } from '@baron/ui/components/form';
import { FormFieldWrapper } from '@baron/ui/components/form-field-wrapper';
import { Input } from '@baron/ui/components/input';
import { Separator } from '@baron/ui/components/separator';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForwardedRef, useImperativeHandle } from 'react';
import { SubmitHandler, useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

type FormSchema = z.infer<typeof simulationRoomSchema>;

export type VPCFormRef = {
  form: UseFormReturn<FormSchema>;
};

export function ItemForm(props: {
  defaultValues?: Partial<FormSchema>;
  ref?: ForwardedRef<VPCFormRef>;
  onSubmit: SubmitHandler<FormSchema>;
}) {
  const form = useForm<FormSchema>({
    defaultValues: props.defaultValues,
    resolver: zodResolver(simulationRoomSchema),
  });

  useImperativeHandle(props.ref, () => ({
    form,
  }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(props.onSubmit)}>
        <div className="space-y-8">
          <FormFieldWrapper
            control={form.control}
            name="name"
            label="Name"
            render={({ field }) => (
              <Input {...field} placeholder="Enter name" />
            )}
          />
          <FormFieldWrapper
            control={form.control}
            name="description"
            label="Description"
            render={({ field }) => (
              <Input {...field} placeholder="Enter Description" />
            )}
          />
          <Separator />
          <Button type="submit" className="w-full">
            Submit
          </Button>
        </div>
      </form>
    </Form>
  );
}

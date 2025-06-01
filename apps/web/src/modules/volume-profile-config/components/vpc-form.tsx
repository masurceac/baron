import { TimeUnitSelect } from '@/modules/inputs/time-unit-select';
import { volumeProfileConfigSchema } from '@baron/schema';
import { Button } from '@baron/ui/components/button';
import { Form } from '@baron/ui/components/form';
import { FormFieldWrapper } from '@baron/ui/components/form-field-wrapper';
import { Input } from '@baron/ui/components/input';
import { NumericInput } from '@baron/ui/components/numeric-input';
import { Separator } from '@baron/ui/components/separator';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForwardedRef, useImperativeHandle } from 'react';
import { SubmitHandler, useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

type VPCSchema = z.infer<typeof volumeProfileConfigSchema>;

export type VPCFormRef = {
  form: UseFormReturn<VPCSchema>;
};

export function VPCForm(props: {
  defaultValues?: Partial<VPCSchema>;
  ref?: ForwardedRef<VPCFormRef>;
  onSubmit: SubmitHandler<VPCSchema>;
}) {
  const form = useForm<VPCSchema>({
    defaultValues: props.defaultValues ?? {},
    resolver: zodResolver(volumeProfileConfigSchema),
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
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <FormFieldWrapper
              control={form.control}
              name="maxDeviationPercent"
              label="Max Deviation Percent"
              description="Max/Min % range to consider for a Volume Profile."
              render={({ field }) => (
                <NumericInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Enter max deviation percent"
                />
              )}
            />
            <FormFieldWrapper
              control={form.control}
              name="minimumBarsToConsider"
              label="Minimum Bars to Consider"
              description="Minimum number of bars to form a Volume Profile."
              render={({ field }) => (
                <NumericInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Enter minimum bars amount"
                />
              )}
            />
            <Separator className="col-span-2" />
            <FormFieldWrapper
              control={form.control}
              name="timeframeAmount"
              label="Timeframe Amount"
              render={({ field }) => (
                <NumericInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Time amount to build this Volume Profile"
                />
              )}
            />
            <FormFieldWrapper
              control={form.control}
              name="timeframeUnit"
              label="Timeframe Unit"
              render={({ field }) => (
                <TimeUnitSelect
                  className="w-full"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Separator className="col-span-2" />

            <FormFieldWrapper
              control={form.control}
              name="historicalTimeToConsiderAmount"
              label="Historical bars to consider"
              description="How many historical bars should be considered for building VP."
              render={({ field }) => (
                <NumericInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="FRVP will be calculated based on this many historical bars"
                />
              )}
            />
            <FormFieldWrapper
              control={form.control}
              name="volumeProfilePercentage"
              label="Volume Profile Percentage"
              description="Optional. Defaults to 70."
              render={({ field }) => (
                <NumericInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Enter volume profile percentage"
                />
              )}
            />
          </div>
          <Button type="submit" className="w-full">
            Submit
          </Button>
        </div>
      </form>
    </Form>
  );
}

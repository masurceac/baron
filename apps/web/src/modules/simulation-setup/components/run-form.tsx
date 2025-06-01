import { SimulationRun, simulationRunSchema } from '@baron/schema';
import { Button } from '@baron/ui/components/button';
import { DateTimeInput } from '@baron/ui/components/date-time-input';
import { Form } from '@baron/ui/components/form';
import { FormFieldWrapper } from '@baron/ui/components/form-field-wrapper';
import { NumericInput } from '@baron/ui/components/numeric-input';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForwardedRef, useImperativeHandle } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { SubmitHandler, useForm, UseFormReturn } from 'react-hook-form';

export type VPCFormRef = {
  form: UseFormReturn<SimulationRun>;
};

export function RunSimulationForm(props: {
  defaultValues?: Partial<SimulationRun>;
  ref?: ForwardedRef<VPCFormRef>;
  onSubmit: SubmitHandler<SimulationRun>;
  simulationSetupId: string;
}) {
  const form = useForm<SimulationRun>({
    defaultValues: props.defaultValues ?? {
      simulationSetupId: props.simulationSetupId,
    },
    resolver: zodResolver(simulationRunSchema),
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
            name="startDate"
            label="Start Date"
            render={({ field }) => (
              <div>
                <DateTimeInput
                  placeholder="Choose date (UTC time)"
                  value={(field.value ?? new Date()).toISOString()}
                  onChange={(e) => (e ? field.onChange(new Date(e)) : null)}
                  hasTime
                />
                {field.value && (
                  <p className="text-sm text-muted-foreground ml-2 mt-1">
                    UTC: {formatInTimeZone(field.value, 'UTC', 'PPP p')}
                  </p>
                )}
              </div>
            )}
          />
          <FormFieldWrapper
            control={form.control}
            name="iterations"
            label="Iteration"
            render={({ field }) => (
              <NumericInput
                value={field.value}
                onChange={field.onChange}
                placeholder="Amount of trades to execute"
              />
            )}
          />

          <Button type="submit" className="w-full">
            Submit
          </Button>
        </div>
      </form>
    </Form>
  );
}

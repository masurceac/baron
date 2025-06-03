import { InfoBarMultiselect } from '@/modules/info-bars/lib';
import { TradingPairSelect } from '@/modules/inputs/trading-pair-select';
import { DetailedTextDialog } from '@/modules/shared/components/detailed-text-dialog';
import { VolumeProfileMultiselect } from '@/modules/volume-profile-config/lib';
import { OPEN_ORDER_PROMPT, OPEN_ORDER_SYSTEM_PROMPT } from '@baron/ai/prompt';
import { simulationRunSchema } from '@baron/schema';
import { Button } from '@baron/ui/components/button';
import { Form } from '@baron/ui/components/form';
import { FormFieldWrapper } from '@baron/ui/components/form-field-wrapper';
import { Input } from '@baron/ui/components/input';
import { NumericInput } from '@baron/ui/components/numeric-input';
import { Separator } from '@baron/ui/components/separator';
import { Switch } from '@baron/ui/components/switch';
import { Textarea } from '@baron/ui/components/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForwardedRef, useImperativeHandle } from 'react';
import { SubmitHandler, useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { DateTimeInput } from '@baron/ui/components/date-time-input';
import { FormatDate } from '@baron/ui/components/format-date';

type FormSchema = z.infer<typeof simulationRunSchema>;

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
            name="name"
            label="Name"
            render={({ field }) => (
              <Input {...field} placeholder="Enter name" />
            )}
          />
          <FormFieldWrapper
            control={form.control}
            name="pair"
            label="Trading Pair"
            render={({ field }) => (
              <TradingPairSelect
                value={field.value}
                onChange={field.onChange}
                className="w-full"
              />
            )}
          />
          <FormFieldWrapper
            control={form.control}
            name="trailingStop"
            label="Trailing Stop"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <FormFieldWrapper
            control={form.control}
            name="iterations"
            label="Iterations Amount"
            description="How many trades should be completed before the simulation ends."
            render={({ field }) => (
              <NumericInput
                value={field.value}
                onChange={field.onChange}
                placeholder="Enter Iterations Amount"
              />
            )}
          />
          <FormFieldWrapper
            control={form.control}
            name="startDate"
            label="Start Date"
            render={({ field }) => (
              <div>
                <DateTimeInput
                  placeholder="Choose date (UTC time)"
                  value={field.value ?? null}
                  onChange={(e) => (e ? field.onChange(new Date(e)) : null)}
                  hasTime
                />
                {field.value && (
                  <p className="text-sm text-muted-foreground ml-2 mt-1">
                    <FormatDate date={field.value} utc />
                  </p>
                )}
              </div>
            )}
          />
          <Separator />
          <FormFieldWrapper
            control={form.control}
            name="aiPrompt"
            label="AI Prompt"
            rightLabel="make sure to include all the variables"
            description={
              <DetailedTextDialog
                title="This is the default AI prompt used for open orders"
                content={OPEN_ORDER_PROMPT}
              />
            }
            render={({ field }) => (
              <Textarea value={field.value} onChange={field.onChange} />
            )}
          />
          <FormFieldWrapper
            control={form.control}
            name="systemPrompt"
            rightLabel="make sure to include all the variables"
            label="System Prompt"
            description={
              <DetailedTextDialog
                title="This is the default AI System prompt used for open orders"
                content={OPEN_ORDER_SYSTEM_PROMPT}
              />
            }
            render={({ field }) => (
              <Textarea value={field.value} onChange={field.onChange} />
            )}
          />
          <Separator />

          <FormFieldWrapper
            control={form.control}
            name="vpcIds"
            label="Volume Profile Configs"
            render={({ field }) => (
              <VolumeProfileMultiselect
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <FormFieldWrapper
            control={form.control}
            name="infoBarIds"
            label="Information Bars"
            render={({ field }) => (
              <InfoBarMultiselect
                value={field.value}
                onChange={field.onChange}
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

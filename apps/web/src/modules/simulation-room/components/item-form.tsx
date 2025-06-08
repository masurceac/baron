import { InfoBarMultiselect } from '@/modules/info-bars/lib';
import { TradingPairSelect } from '@/modules/inputs/trading-pair-select';
import { DetailedTextDialog } from '@/modules/shared/components/detailed-text-dialog';
import { VolumeProfileMultiselect } from '@/modules/volume-profile-config/lib';
import { ORDER_SUGGESTION_PROMPT } from '@baron/ai/order-suggestion';
import { simulationRoomSchema } from '@baron/schema';
import { Button } from '@baron/ui/components/button';
import { Form } from '@baron/ui/components/form';
import { FormFieldWrapper } from '@baron/ui/components/form-field-wrapper';
import { Input } from '@baron/ui/components/input';
import { Separator } from '@baron/ui/components/separator';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@baron/ui/components/alert';
import { Switch } from '@baron/ui/components/switch';
import { Textarea } from '@baron/ui/components/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForwardedRef, useImperativeHandle } from 'react';
import { SubmitHandler, useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { NumericInput } from '@baron/ui/components/numeric-input';
import { DateTimeInput } from '@baron/ui/components/date-time-input';
import { FormatDate } from '@baron/ui/components/format-date';

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

  const selfTraining = form.watch('selfTraining');

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
          <p className="text-lg">
            Data below will be used as template for running simulations.
          </p>
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
            name="tradesToExecute"
            label="Trades Amount"
            description="How many trades should be completed before the simulation ends."
            render={({ field }) => (
              <NumericInput
                value={field.value}
                onChange={field.onChange}
                placeholder="Enter Trades Amount"
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
            name="holdPriceEnabled"
            label="Price Hold Until Break"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          <FormFieldWrapper
            control={form.control}
            name="selfTraining"
            label="Self Training"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
          {selfTraining && (
            <>
              <Alert>
                <AlertTitle>Self Training Mode Enabled</AlertTitle>
                <AlertDescription>
                  When in self-training mode, the AI will use the prompt below
                  as requirements to generate further prompts for trading. All
                  required variables will be included automatically.
                </AlertDescription>
              </Alert>
              <FormFieldWrapper
                control={form.control}
                name="selfTrainingCycles"
                label="Self Training Cycles"
                description="How many self-training cycles should be made."
                render={({ field }) => (
                  <NumericInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Enter Self Training Cycles"
                  />
                )}
              />
              <FormFieldWrapper
                control={form.control}
                name="selfTrainingPrompt"
                label="Self training Prompt"
                description="This prompt will be used to generate further prompts for self-training and self-improvement."
                render={({ field }) => (
                  <Textarea value={field.value} onChange={field.onChange} />
                )}
              />
            </>
          )}
          <FormFieldWrapper
            control={form.control}
            name="aiPrompt"
            label="AI Prompt"
            description={
              <DetailedTextDialog
                title="This is the default AI prompt"
                content={
                  selfTraining
                    ? 'Example: Provide a high-risk trading strategy that relies on S/R volume profiles.'
                    : ORDER_SUGGESTION_PROMPT
                }
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

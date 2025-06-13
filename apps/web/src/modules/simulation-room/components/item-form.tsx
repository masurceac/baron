import { ModelsMultiSelect } from '@/modules/ai-models';
import { InfoBarMultiselect } from '@/modules/info-bars/lib';
import { TradingPairSelect } from '@/modules/inputs/trading-pair-select';
import { FrvpSelect } from '@/modules/predefined-frvp/lib';
import { simulationRoomSchema } from '@baron/schema';
import { Button } from '@baron/ui/components/button';
import { DateTimeInput } from '@baron/ui/components/date-time-input';
import { Form } from '@baron/ui/components/form';
import { FormFieldWrapper } from '@baron/ui/components/form-field-wrapper';
import { FormatDate } from '@baron/ui/components/format-date';
import { Input } from '@baron/ui/components/input';
import { NumericInput } from '@baron/ui/components/numeric-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@baron/ui/components/select';
import { Separator } from '@baron/ui/components/separator';
import { Textarea } from '@baron/ui/components/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForwardedRef, useImperativeHandle } from 'react';
import { SubmitHandler, useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { TimeUnit } from '@baron/common';
import { AiModelStrategyEnum, AiModelPriceStrategyEnum } from '@baron/schema';

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
              <Input {...field} placeholder="Choose a name" />
            )}
          />
          <FormFieldWrapper
            control={form.control}
            name="description"
            label="Description"
            render={({ field }) => (
              <Textarea value={field.value ?? ''} onChange={field.onChange} placeholder="Enter description" />
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
            name="maxTradesToExecute"
            label="Maximum Trades to Execute per simulation"
            render={({ field }) => (
              <NumericInput
                value={field.value}
                onChange={field.onChange}
                placeholder="Enter max trades"
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
            name="aiPrompt"
            label="AI Prompt"
            render={({ field }) => (
              <Textarea value={field.value} onChange={field.onChange} />
            )}
          />
          <Separator />

          <FormFieldWrapper
            control={form.control}
            name="predefinedFrvpId"
            label="FRVP ID"
            render={({ field }) => (
              <FrvpSelect value={field.value} onChange={field.onChange} />
            )}
          />

          <FormFieldWrapper
            control={form.control}
            name="aiModels"
            label="AI Models"
            render={({ field }) => (
              <ModelsMultiSelect
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <FormFieldWrapper
            control={form.control}
            name="aiModelStrategy"
            label="AI Model Strategy"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose Strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AiModelStrategyEnum.And}>And</SelectItem>
                  <SelectItem value={AiModelStrategyEnum.Or}>Or</SelectItem>
                </SelectContent>
              </Select>
            )}
          />

          <FormFieldWrapper
            control={form.control}
            name="aiModelPriceStrategy"
            label="AI Model Price Strategy"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose Price Strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AiModelPriceStrategyEnum.Max}>Max</SelectItem>
                  <SelectItem value={AiModelPriceStrategyEnum.Min}>Min</SelectItem>
                  <SelectItem value={AiModelPriceStrategyEnum.Average}>Average</SelectItem>
                </SelectContent>
              </Select>
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

          <Separator />

          <div className="grid grid-cols-3 gap-4">
            <FormFieldWrapper
              control={form.control}
              name="bulkExecutionsCount"
              label="Number of Bulk Executions"
              render={({ field }) => (
                <NumericInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Enter number of executions"
                />
              )}
            />

            <FormFieldWrapper
              control={form.control}
              name="bulkExecutionsIntervalAmount"
              label="Interval Amount"
              render={({ field }) => (
                <NumericInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Enter interval amount"
                />
              )}
            />

            <FormFieldWrapper
              control={form.control}
              name="bulkExecutionsIntervalUnits"
              label="Interval Units"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose Time Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TimeUnit.Min}>Minutes</SelectItem>
                    <SelectItem value={TimeUnit.Hour}>Hours</SelectItem>
                    <SelectItem value={TimeUnit.Day}>Days</SelectItem>
                    <SelectItem value={TimeUnit.Week}>Weeks</SelectItem>
                    <SelectItem value={TimeUnit.Month}>Months</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />

            <p className="col-span-3 text-sm text-muted-foregroun capitalized">
              The simulation will launch{' '}
              {form.watch('bulkExecutionsCount') || 0} parallel executions, with
              interval of {form.watch('bulkExecutionsIntervalAmount') || 0}{' '}
              {form.watch('bulkExecutionsIntervalUnits') || 'time units'}.
            </p>
          </div>

          <Button type="submit" className="w-full">
            Submit
          </Button>
        </div>
      </form>
    </Form>
  );
}

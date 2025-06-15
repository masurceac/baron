import { ModelsMultiSelect } from '@/modules/ai-models';
import { InfoBarMultiselect } from '@/modules/info-bars/lib';
import { TradingPairSelect } from '@/modules/inputs/trading-pair-select';
import { FrvpSelect } from '@/modules/predefined-frvp/lib';
import { liveTradingRoomSchema } from '@baron/schema';
import { Button } from '@baron/ui/components/button';
import { Form } from '@baron/ui/components/form';
import { FormFieldWrapper } from '@baron/ui/components/form-field-wrapper';
import { Input } from '@baron/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@baron/ui/components/select';
import { Textarea } from '@baron/ui/components/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForwardedRef, useImperativeHandle } from 'react';
import { SubmitHandler, useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { AiModelStrategyEnum, AiModelPriceStrategyEnum } from '@baron/schema';

type FormSchema = z.infer<typeof liveTradingRoomSchema>;

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
    resolver: zodResolver(liveTradingRoomSchema),
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
            name="aiPrompt"
            label="AI Prompt"
            render={({ field }) => (
              <Textarea value={field.value} onChange={field.onChange} />
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
                  <SelectItem value={AiModelPriceStrategyEnum.Max}>
                    Max
                  </SelectItem>
                  <SelectItem value={AiModelPriceStrategyEnum.Min}>
                    Min
                  </SelectItem>
                  <SelectItem value={AiModelPriceStrategyEnum.Average}>
                    Average
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          />
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

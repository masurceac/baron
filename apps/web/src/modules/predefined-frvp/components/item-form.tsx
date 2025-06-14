import { TradingPairSelect } from '@/modules/inputs/trading-pair-select';
import { createPredefinedFrvpSchema, PredefinedFrvpValue } from '@baron/schema';
import { Button } from '@baron/ui/components/button';
import { DateTimeInput } from '@baron/ui/components/date-time-input';
import { Form } from '@baron/ui/components/form';
import { FormFieldWrapper } from '@baron/ui/components/form-field-wrapper';
import { FormatDate } from '@baron/ui/components/format-date';
import { Input } from '@baron/ui/components/input';
import { Separator } from '@baron/ui/components/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@baron/ui/components/accordion';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForwardedRef, useImperativeHandle } from 'react';
import {
  SubmitHandler,
  useFieldArray,
  useForm,
  UseFormReturn,
} from 'react-hook-form';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { NumericInput } from '@baron/ui/components/numeric-input';

type FormSchema = z.infer<typeof createPredefinedFrvpSchema>;

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
    resolver: zodResolver(createPredefinedFrvpSchema),
  });

  const profiles = useFieldArray({
    control: form.control,
    name: 'profiles',
    rules: {
      minLength: 1,
    },
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
            name="lastDate"
            label="Last Date"
            rightLabel="For which date this FRVP is valid"
            render={({ field }) => (
              <div>
                <DateTimeInput
                  placeholder="Choose a date"
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

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Profiles</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  profiles.append({
                    label: '',
                    zones: [],
                  })
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Profile
              </Button>
            </div>

            {profiles.fields.map((profile, profileIndex) => (
              <Accordion key={profile.id} type="single" collapsible>
                <AccordionItem value={`profile-${profileIndex}`}>
                  <AccordionTrigger>
                    {form.watch(`profiles.${profileIndex}.label`) ||
                      `Profile ${profileIndex + 1}`}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => profiles.remove(profileIndex)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>

                      <FormFieldWrapper
                        control={form.control}
                        name={`profiles.${profileIndex}.label`}
                        label="Profile Label"
                        render={({ field }) => (
                          <Input {...field} placeholder="Enter profile label" />
                        )}
                      />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">Zones</h5>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const zones =
                                form.getValues(
                                  `profiles.${profileIndex}.zones`,
                                ) || [];
                              form.setValue(`profiles.${profileIndex}.zones`, [
                                ...zones,
                                {} as PredefinedFrvpValue,
                              ]);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Zone
                          </Button>
                        </div>

                        {form
                          .watch(`profiles.${profileIndex}.zones`)
                          ?.map((_, zoneIndex) => (
                            <div
                              key={zoneIndex}
                              className="space-y-4 p-4 border rounded-lg"
                            >
                              <div className="flex items-center justify-between">
                                <h6 className="font-medium">
                                  {form.watch(`profiles.${profileIndex}.label`)}{' '}
                                  - Zone {zoneIndex + 1}
                                </h6>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const zones = form.getValues(
                                      `profiles.${profileIndex}.zones`,
                                    );
                                    form.setValue(
                                      `profiles.${profileIndex}.zones`,
                                      zones.filter((_, i) => i !== zoneIndex),
                                    );
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <FormFieldWrapper
                                  control={form.control}
                                  name={`profiles.${profileIndex}.zones.${zoneIndex}.zoneStartAt`}
                                  label="Start Date"
                                  render={({ field }) => (
                                    <div className="space-y-2">
                                      <DateTimeInput
                                        value={field.value ?? null}
                                        onChange={(e) =>
                                          e ? field.onChange(new Date(e)) : null
                                        }
                                        hasTime
                                        placeholder="Select start date"
                                      />
                                      <Input
                                        placeholder="Enter date (YYYY-MM-DD HH:mm)"
                                        onChange={(e) => {
                                          const date = new Date(e.target.value);
                                          if (!isNaN(date.getTime())) {
                                            field.onChange(date);
                                          }
                                        }}
                                      />
                                    </div>
                                  )}
                                />
                                <FormFieldWrapper
                                  control={form.control}
                                  name={`profiles.${profileIndex}.zones.${zoneIndex}.zoneEndAt`}
                                  label="End Date"
                                  render={({ field }) => (
                                    <div className="space-y-2">
                                      <DateTimeInput
                                        value={field.value ?? null}
                                        onChange={(e) =>
                                          e ? field.onChange(new Date(e)) : null
                                        }
                                        hasTime
                                        placeholder="Select end date"
                                      />
                                      <Input
                                        placeholder="Enter date (YYYY-MM-DD HH:mm)"
                                        onChange={(e) => {
                                          const date = new Date(e.target.value);
                                          if (!isNaN(date.getTime())) {
                                            field.onChange(date);
                                          }
                                        }}
                                      />
                                    </div>
                                  )}
                                />
                              </div>

                              <div className="grid grid-cols-3 gap-4">
                                <FormFieldWrapper
                                  control={form.control}
                                  name={`profiles.${profileIndex}.zones.${zoneIndex}.volumeAreaLow`}
                                  label="Volume Area Low"
                                  render={({ field }) => (
                                    <NumericInput
                                      {...field}
                                      onChange={(value) =>
                                        field.onChange(value)
                                      }
                                    />
                                  )}
                                />

                                <FormFieldWrapper
                                  control={form.control}
                                  name={`profiles.${profileIndex}.zones.${zoneIndex}.pointOfControl`}
                                  label="Point of Control"
                                  render={({ field }) => (
                                    <NumericInput
                                      {...field}
                                      onChange={(value) =>
                                        field.onChange(value)
                                      }
                                    />
                                  )}
                                />
                                <FormFieldWrapper
                                  control={form.control}
                                  name={`profiles.${profileIndex}.zones.${zoneIndex}.volumeAreaHigh`}
                                  label="Volume Area High"
                                  render={({ field }) => (
                                    <NumericInput
                                      {...field}
                                      onChange={(value) =>
                                        field.onChange(value)
                                      }
                                    />
                                  )}
                                />
                              </div>
                            </div>
                          ))}
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const zones =
                                form.getValues(
                                  `profiles.${profileIndex}.zones`,
                                ) || [];
                              form.setValue(`profiles.${profileIndex}.zones`, [
                                ...zones,
                                {} as PredefinedFrvpValue,
                              ]);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Zone
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </div>

          <Button type="submit" className="w-full">
            Submit
          </Button>
        </div>
      </form>
    </Form>
  );
}

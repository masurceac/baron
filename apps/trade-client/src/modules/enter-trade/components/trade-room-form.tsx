'use client';

import { Button } from '@baron/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@baron/ui/components/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@baron/ui/components/form';
import { Input } from '@baron/ui/components/input';
import { NumericInput } from '@baron/ui/components/numeric-input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { TradeRoomFormSchema, tradeRoomFormSchema } from '../schema';

interface TradeRoomFormProps {
  onSubmit: (data: TradeRoomFormSchema) => void;
}

export function TradeRoomForm({ onSubmit }: TradeRoomFormProps) {
  const form = useForm<TradeRoomFormSchema>({
    resolver: zodResolver(tradeRoomFormSchema),
    defaultValues: {
      tradeRoomId: '',
      leverage: 30,
      positionSizeUsd: 100,
    },
  });

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>New Trade Room Session</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="tradeRoomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trade Room ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter trade room ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="leverage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leverage</FormLabel>
                  <FormControl>
                    <NumericInput min={1} max={125} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="positionSizeUsd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position Size (USD)</FormLabel>
                  <FormControl>
                    <NumericInput min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Enter Trade Room
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

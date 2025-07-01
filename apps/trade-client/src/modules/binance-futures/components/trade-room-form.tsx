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
import { Switch } from '@baron/ui/components/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/local-storage';
import {
  BinanceTradeRoomFormSchema,
  binanceTradeRoomFormSchema,
} from '../schema';

interface TradeRoomFormProps {
  onSubmit: (data: BinanceTradeRoomFormSchema) => void;
}

export function TradeRoomForm({ onSubmit }: TradeRoomFormProps) {
  const isLoadingRef = useRef(false);
  
  const form = useForm<BinanceTradeRoomFormSchema>({
    resolver: zodResolver(binanceTradeRoomFormSchema),
    defaultValues: {
      name: '',
      tradeRoomId: '',
      leverage: 30,
      positionSizeUsd: 100,
      apiKey: '',
      apiSecret: '',
      crazyMode: false,
      rememberMe: false,
      signalsCount: 1,
      entryPointDelta: 0,
    },
  });

  const handleSubmit = (data: BinanceTradeRoomFormSchema) => {
    if (data.rememberMe) {
      saveToLocalStorage(`binance-${data.name}`, data);
    }
    onSubmit(data);
  };

  const handleNameChange = (name: string) => {
    if (name && !isLoadingRef.current) {
      const savedData = loadFromLocalStorage<BinanceTradeRoomFormSchema>(`binance-${name}`);
      if (savedData) {
        isLoadingRef.current = true;
        form.reset({
          ...savedData,
          rememberMe: true,
        });
        isLoadingRef.current = false;
      }
    }
  };

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'name' && value.name && !isLoadingRef.current) {
        handleNameChange(value.name);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>New Trade Room Session</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                    <NumericInput 
                      min={1} 
                      max={125} 
                      value={field.value}
                      onChange={field.onChange}
                    />
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
                    <NumericInput 
                      min={1} 
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="signalsCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Signals Count</FormLabel>
                  <FormControl>
                    <NumericInput 
                      min={1} 
                      max={10} 
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="entryPointDelta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entry Point Delta (%)</FormLabel>
                  <FormControl>
                    <NumericInput 
                      min={0} 
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter API key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="apiSecret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Secret</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter API secret" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="crazyMode"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Crazy Mode</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Does the opposite of AI suggestion
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Remember Me</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Save form data for next time
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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

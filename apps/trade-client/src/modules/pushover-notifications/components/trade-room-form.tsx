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
import { Switch } from '@baron/ui/components/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { loadFromLocalStorage, saveToLocalStorage } from '@/lib/local-storage';
import {
  PushoverTradeRoomFormSchema,
  pushoverTradeRoomFormSchema,
} from '../schema';

interface TradeRoomFormProps {
  onSubmit: (data: PushoverTradeRoomFormSchema) => void;
}

export function TradeRoomForm({ onSubmit }: TradeRoomFormProps) {
  const isLoadingRef = useRef(false);
  
  const form = useForm<PushoverTradeRoomFormSchema>({
    resolver: zodResolver(pushoverTradeRoomFormSchema),
    defaultValues: {
      name: '',
      tradeRoomId: '',
      user: '',
      token: '',
      rememberMe: false,
    },
  });

  const handleSubmit = (data: PushoverTradeRoomFormSchema) => {
    if (data.rememberMe) {
      saveToLocalStorage(`pushover-${data.name}`, data);
    }
    onSubmit(data);
  };

  const handleNameChange = (name: string) => {
    if (name && !isLoadingRef.current) {
      const savedData = loadFromLocalStorage<PushoverTradeRoomFormSchema>(`pushover-${name}`);
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
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>New Pushover Notification Session</CardTitle>
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
              name="user"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pushover User Key</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Pushover user key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pushover App Token</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Pushover app token" {...field} />
                  </FormControl>
                  <FormMessage />
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
              Start Notifications
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 
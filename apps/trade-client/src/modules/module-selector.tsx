'use client';

import { Button } from '@baron/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@baron/ui/components/card';
import { useState } from 'react';
import { TradeRoom as BinanceTradeRoom } from './binance-futures';
import { TradeRoom as PushoverTradeRoom } from './pushover-notifications';
import Image from 'next/image';

type ModuleType = 'binance' | 'pushover';

export function ModuleSelector({ wsUrl }: { wsUrl: string }) {
  const [selectedModule, setSelectedModule] = useState<ModuleType | null>(null);

  const handleReset = () => {
    setSelectedModule(null);
  };

  if (!selectedModule) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Choose Module</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => setSelectedModule('binance')}
            className="w-full h-16 flex items-center justify-start gap-3 px-4"
            variant="outline"
          >
            <Image
              src="/binance.png"
              alt="Binance"
              width={32}
              height={32}
              className="rounded"
            />
            <span className="text-left">Binance Futures Trading</span>
          </Button>
          <Button
            onClick={() => setSelectedModule('pushover')}
            className="w-full h-16 flex items-center justify-start gap-3 px-4"
            variant="outline"
          >
            <Image
              src="/pushover-logo.svg"
              alt="Pushover"
              width={32}
              height={32}
              className="rounded"
            />
            <span className="text-left">Pushover Notifications</span>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-center mb-4">
        <Button
          variant="outline"
          onClick={handleReset}
          className="cursor-pointer"
        >
          ← Back to Module Selection
        </Button>
      </div>
      {selectedModule === 'binance' && <BinanceTradeRoom wsUrl={wsUrl} />}
      {selectedModule === 'pushover' && <PushoverTradeRoom wsUrl={wsUrl} />}
    </div>
  );
}

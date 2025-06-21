'use client';
import { useState } from 'react';
import { PushoverTradeRoomFormSchema } from '../schema';
import { TradeFormConnect } from './trade-form-connect';
import { TradeRoomForm } from './trade-room-form';
import { Button } from '@baron/ui/components/button';
import { XIcon } from 'lucide-react';

export function TradeRoom(props: { wsUrl: string }) {
  const [data, setData] = useState<PushoverTradeRoomFormSchema | null>(null);

  const handleReset = () => {
    setData(null);
  };

  if (!data) {
    return <TradeRoomForm onSubmit={setData} />;
  }

  return (
    <div>
      <div className="flex justify-center mb-4">
        <Button
          variant="outline"
          onClick={handleReset}
          className="cursor-pointer"
        >
          <XIcon className="w-4 mr-1" />
          Close Session
        </Button>
      </div>
      <TradeFormConnect roomData={data} wsUrl={props.wsUrl} />
    </div>
  );
} 
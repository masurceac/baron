'use client';
import { useState } from 'react';
import { TradeRoomFormSchema } from '../schema';
import { TradeFormConnect } from './trade-form-connect';
import { TradeRoomForm } from './trade-room-form';
import { Button } from '@baron/ui/components/button';

export function TradeRoom(props: { wsUrl: string }) {
  const [data, setData] = useState<TradeRoomFormSchema | null>(null);

  const handleReset = () => {
    setData(null);
  };

  if (!data) {
    return <TradeRoomForm onSubmit={setData} />;
  }

  return (
    <div>
      <Button variant="outline" onClick={handleReset} className="mb-4">
        Close Session
      </Button>
      <TradeFormConnect roomData={data} wsUrl={props.wsUrl} />
    </div>
  );
}

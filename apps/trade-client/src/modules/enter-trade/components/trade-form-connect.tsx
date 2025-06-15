'use client';

import { TradeDirection } from '@baron/common';
import { Switch } from '@baron/ui/components/switch';
import { useWebsocketClient } from '@baron/ws/client';
import {
  TradeClientServerWebsocketEvents,
  tradeClientWebsockets,
} from '@baron/ws/trade-client-ws';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { enterTrade } from '../actions/enter-trade';
import { TradeRoomFormSchema } from '../schema';

interface TradeEvent {
  timestamp: string;
  data: TradeClientServerWebsocketEvents['enterTrade'];
  success: boolean;
}

const pulseAnimation = `
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
}
`;

export function TradeFormConnect(props: {
  roomData: TradeRoomFormSchema;
  wsUrl: string;
}) {
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval>>(null);
  const [connected, setConnected] = useState(false);
  const [tradeEvents, setTradeEvents] = useState<TradeEvent[]>([]);
  const [showOnlySuccessful, setShowOnlySuccessful] = useState(false);

  const { setupListeners, loading } = useWebsocketClient(
    tradeClientWebsockets,
    {
      url: `${props.wsUrl}/websocket?roomId=${props.roomData.tradeRoomId}`,
      shouldReconnect: true,
      reconnectIntervalMs: 1000,
      onOpen({ emitters }) {
        toast.success('Connected');
        setConnected(true);
        heartbeatIntervalRef.current = setInterval(() => {
          emitters.heartbeat({
            date: new Date().toISOString(),
          });
        }, 1000);
      },
      onClose() {
        setConnected(false);
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }
      },
    },
  );

  useEffect(() => {
    if (loading) {
      return;
    }

    setupListeners({
      async enterTrade(data) {
        const success = await enterTrade(data, props.roomData);

        setTradeEvents((prev) => [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            data,
            success,
          },
        ]);
      },
    });
  }, [setupListeners, loading]);

  return (
    <div className="p-4 space-y-4">
      <style>{pulseAnimation}</style>
      <div className="flex items-center gap-2">
        <div className="relative">
          <div
            className={`w-2 h-2 mt-0.5 ml-0.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
          />
          {connected && (
            <div
              className="absolute top-0 left-0 w-3 h-3 rounded-full bg-green-500"
              style={{
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
          )}
        </div>
        <span className="text-sm font-medium">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Room Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Room ID</p>
            <p className="font-medium">{props.roomData.tradeRoomId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Platform</p>
            <p className="font-medium capitalize">{props.roomData.platform}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Leverage</p>
            <p className="font-medium">{props.roomData.leverage}x</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Position Size</p>
            <p className="font-medium">
              ${props.roomData.positionSizeUsd.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2">Trade Events</h3>
        <div className="flex items-center gap-2 mb-4">
          <Switch
            id="show-only-successful"
            checked={showOnlySuccessful}
            onCheckedChange={setShowOnlySuccessful}
          />
          <label
            htmlFor="show-only-successful"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Show only trades with positions
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pair
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stop Loss
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Take Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...tradeEvents]
                .filter((event) => !showOnlySuccessful || event.success)
                .reverse()
                .map((event, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.data.trade.type === TradeDirection.Buy
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {event.data.trade.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {event.data.trade.pair}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.data.trade.stopLossPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.data.trade.takeProfitPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.success
                            ? 'bg-green-100 text-green-800'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {event.success ? 'Opened' : 'No Action'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

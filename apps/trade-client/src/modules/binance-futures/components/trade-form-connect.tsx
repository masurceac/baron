'use client';

import { TradeDirection } from '@baron/common';
import { Badge } from '@baron/ui/components/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@baron/ui/components/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@baron/ui/components/alert';
import { DataTable } from '@baron/ui/components/data-table';
import { Switch } from '@baron/ui/components/switch';
import { cn } from '@baron/ui/lib/utils';
import { useWebsocketClient } from '@baron/ws/client';
import {
  TradeClientServerWebsocketEvents,
  tradeClientWebsockets,
} from '@baron/ws/trade-client-ws';
import { ColumnDef } from '@tanstack/react-table';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { enterTrade } from '../actions/enter-trade';
import { BinanceTradeRoomFormSchema } from '../schema';

interface TradeEvent {
  timestamp: string;
  data: TradeClientServerWebsocketEvents['enterTrade'];
  success: boolean;
  executed: boolean;
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
  roomData: BinanceTradeRoomFormSchema;
  wsUrl: string;
}) {
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval>>(null);
  const [connected, setConnected] = useState(false);
  const [tradeEvents, setTradeEvents] = useState<TradeEvent[]>([]);
  const [showOnlySuccessful, setShowOnlySuccessful] = useState(false);

  // Signals counting ref
  const consecutiveSignalsRef = useRef<{
    direction: TradeDirection | null;
    count: number;
  }>({ direction: null, count: 0 });

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
        const currentDirection = data.trade.type;
        const currentCount = consecutiveSignalsRef.current.count;
        const currentDirectionState = consecutiveSignalsRef.current.direction;

        const isSameDirection = currentDirectionState === currentDirection;
        const newCount = isSameDirection ? currentCount + 1 : 1;
        const shouldExecute =
          isSameDirection && newCount >= props.roomData.signalsCount;

        consecutiveSignalsRef.current = {
          direction: currentDirection,
          count: newCount,
        };

        const success = shouldExecute
          ? await enterTrade(data, props.roomData)
          : false;

        if (shouldExecute) {
          consecutiveSignalsRef.current = { direction: null, count: 0 };
        }

        setTradeEvents((prev) => [
          {
            timestamp: new Date().toISOString(),
            data,
            success,
            executed: shouldExecute,
          },
          ...prev,
        ]);
      },
    });
  }, [setupListeners, loading, props.roomData]);

  const columns: ColumnDef<TradeEvent>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      cell: ({ row }) => new Date(row.original.timestamp).toLocaleString(),
    },
    {
      accessorKey: 'data.trade.type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.data.trade.type === TradeDirection.Buy
              ? 'green'
              : 'destructive'
          }
        >
          {row.original.data.trade.type}
        </Badge>
      ),
    },
    {
      accessorKey: 'data.trade.pair',
      header: 'Pair',
      cell: ({ row }) => row.original.data.trade.pair,
    },
    {
      accessorKey: 'data.trade.stopLossPrice',
      header: 'Stop Loss',
      cell: ({ row }) => row.original.data.trade.stopLossPrice.toFixed(2),
    },
    {
      accessorKey: 'data.trade.takeProfitPrice',
      header: 'Take Profit',
      cell: ({ row }) => row.original.data.trade.takeProfitPrice.toFixed(2),
    },
    {
      accessorKey: 'executed',
      header: 'Executed',
      cell: ({ row }) => (
        <Badge variant={row.original.executed ? 'green' : 'secondary'}>
          {row.original.executed ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      accessorKey: 'success',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.success ? 'green' : 'secondary'}>
          {row.original.success ? 'Opened' : 'No Action'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="p-4 space-y-4 max-w-screen-md mx-auto">
      <style>{pulseAnimation}</style>
      <div className="flex items-center gap-2">
        <div className="relative">
          <div
            className={cn(
              'w-2 h-2 mt-0.5 ml-0.5 rounded-full',
              connected ? 'bg-green-500' : 'bg-red-500',
            )}
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

      {props.roomData.crazyMode && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Crazy Mode Enabled</AlertTitle>
          <AlertDescription>
            The orders will be the opposite of what the AI suggests.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{props.roomData.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Room ID</p>
              <p className="font-medium">{props.roomData.tradeRoomId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Leverage</p>
              <p className="font-medium">{props.roomData.leverage}x</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Position Size</p>
              <p className="font-medium">${props.roomData.positionSizeUsd}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Signals Count</p>
              <p className="font-medium">{props.roomData.signalsCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Consecutive Signals
              </p>
              <p className="font-medium">
                {consecutiveSignalsRef.current.direction ? (
                  <>
                    {consecutiveSignalsRef.current.direction} (
                    {consecutiveSignalsRef.current.count}/
                    {props.roomData.signalsCount})
                  </>
                ) : (
                  'None'
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Switch
              checked={showOnlySuccessful}
              onCheckedChange={setShowOnlySuccessful}
            />
            <label className="text-sm font-medium">
              Show only executed trades
            </label>
          </div>
          <DataTable
            columns={columns}
            data={
              showOnlySuccessful
                ? tradeEvents.filter((event) => event.executed)
                : tradeEvents
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

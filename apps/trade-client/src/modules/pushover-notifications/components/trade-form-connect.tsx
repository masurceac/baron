'use client';

import { TradeDirection } from '@baron/common';
import { Badge } from '@baron/ui/components/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@baron/ui/components/card';
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
import { sendNotification } from '../actions/send-notification';
import { PushoverTradeRoomFormSchema } from '../schema';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@baron/ui/components/dialog';
import { Button } from '@baron/ui/components/button';

interface NotificationEvent {
  timestamp: string;
  data: TradeClientServerWebsocketEvents['enterTrade'];
  success: boolean;
  sent: boolean;
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
  roomData: PushoverTradeRoomFormSchema;
  wsUrl: string;
}) {
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval>>(null);
  const [connected, setConnected] = useState(false);
  const [notificationEvents, setNotificationEvents] = useState<
    NotificationEvent[]
  >([]);
  const [showOnlySent, setShowOnlySent] = useState(false);

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
        toast.success('Connected to notifications');
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
        const shouldSend =
          isSameDirection && newCount >= props.roomData.signalsCount;

        consecutiveSignalsRef.current = {
          direction: currentDirection,
          count: newCount,
        };

        const success = shouldSend
          ? await sendNotification(data, props.roomData)
          : false;

        if (shouldSend) {
          consecutiveSignalsRef.current = { direction: null, count: 0 };
        }

        setNotificationEvents((prev) => [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            data,
            success,
            sent: shouldSend,
          },
        ]);
      },
    });
  }, [setupListeners, loading, props.roomData]);

  const columns: ColumnDef<NotificationEvent>[] = [
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
          className="capitalize"
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
      accessorKey: 'sent',
      header: 'Sent',
      cell: ({ row }) => (
        <Badge variant={row.original.sent ? 'green' : 'secondary'}>
          {row.original.sent ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      accessorKey: 'success',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.success ? 'green' : 'secondary'}>
          {row.original.success ? 'Sent' : 'No action'}
        </Badge>
      ),
    },
    {
      id: 'reason',
      header: 'Reason',
      cell: ({ row: { original } }) => (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">View</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reason</DialogTitle>
            </DialogHeader>
            <div className="whitespace-pre">{original.data.trade.reason}</div>
          </DialogContent>
        </Dialog>
      ),
    },
  ];

  const sortedEvents = [...notificationEvents].reverse();

  return (
    <div className="p-4 space-y-4 max-w-screen-lg mx-auto">
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
              <p className="text-sm text-muted-foreground">User Key</p>
              <p className="font-medium">{props.roomData.user}</p>
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
          <CardTitle>Notification History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Switch checked={showOnlySent} onCheckedChange={setShowOnlySent} />
            <label className="text-sm font-medium">
              Show only sent notifications
            </label>
          </div>
          <DataTable
            columns={columns}
            data={
              showOnlySent
                ? sortedEvents.filter((event) => event.sent)
                : sortedEvents
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

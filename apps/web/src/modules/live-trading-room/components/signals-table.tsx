import { trpc } from '@/core/trpc';
import { useCurrentPagination } from '@/modules/shared';
import { DetailedTextDialog } from '@/modules/shared/components/detailed-text-dialog';
import { SpaPagination } from '@/modules/shared/components/pagination';
import { RouterOutput } from '@baron/server';
import { Badge } from '@baron/ui/components/badge';
import { DataTable } from '@baron/ui/components/data-table';
import { FormatDate } from '@baron/ui/components/format-date';
import { ColumnDef } from '@tanstack/react-table';
import { Suspense, useMemo, useState } from 'react';
import { Button } from '@baron/ui/components/button';
import { BarChart3Icon } from 'lucide-react';
import { CheckTradeSuccessButton } from './check-trade-success-button';
import { CheckAllTradesSuccessButton } from './check-all-trades-success-button';
import { DailyBalanceSummary } from './daily-balance-summary';

type TableItem = RouterOutput['liveTradingRoom']['signals']['data'][number];

const TAKE = 50;

function SignalsTableContent(props: { liveTradingRoomId: string }) {
  const [showDailySummary, setShowDailySummary] = useState(false);
  const pagination = useCurrentPagination({ take: TAKE });
  const [list] = trpc.liveTradingRoom.signals.useSuspenseQuery({
    liveTradingRoomId: props.liveTradingRoomId,
    skip: pagination.skip,
    take: TAKE,
  });

  const utils = trpc.useUtils();

  const handleCheckSuccess = () => {
    // Invalidate the signals query to refresh the data
    utils.liveTradingRoom.signals.invalidate({
      liveTradingRoomId: props.liveTradingRoomId,
      skip: pagination.skip,
      take: TAKE,
    });
    utils.liveTradingRoom.signalsDailyBalance.invalidate();
  };

  const columns = useMemo<ColumnDef<TableItem>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        enableSorting: false,
        header: 'Created At',
        cell: ({ row: { original } }) => (
          <FormatDate date={original.createdAt} format="long" />
        ),
      },
      {
        accessorKey: 'suggestions',
        enableSorting: false,
        header: 'Signals',
        cell: ({ row: { original } }) => (
          <div className="space-y-2">
            {original.suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Badge
                  variant={
                    suggestion.type === 'buy'
                      ? 'default'
                      : suggestion.type === 'sell'
                        ? 'destructive'
                        : 'secondary'
                  }
                >
                  {suggestion.type.toUpperCase()}
                </Badge>
                {suggestion.stopLossPrice && (
                  <span className="text-sm text-muted-foreground">
                    SL: ${suggestion.stopLossPrice.toFixed(2)}
                  </span>
                )}
                {suggestion.takeProfitPrice && (
                  <span className="text-sm text-muted-foreground">
                    TP: ${suggestion.takeProfitPrice.toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'reason',
        enableSorting: false,
        header: 'Reasons',
        cell: ({ row: { original } }) => (
          <div className="space-y-2">
            {original.suggestions.map((suggestion, index) => (
              <div key={index}>
                {suggestion.reason && (
                  <DetailedTextDialog
                    title={`Signal ${index + 1} Reason`}
                    content={suggestion.reason}
                    label={`Reason ${index + 1}`}
                  />
                )}
              </div>
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'exitInfo',
        enableSorting: false,
        header: 'Exit Info',
        cell: ({ row: { original } }) => (
          <div className="space-y-2">
            {original.exitDate && original.exitBalance !== null ? (
              <div className="text-sm">
                <div>
                  <FormatDate date={original.exitDate} format="long" />
                </div>
                <div
                  className={`font-medium ${
                    original.exitBalance >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  ${original.exitBalance.toFixed(2)}
                </div>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Not checked</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'checkTrade',
        enableSorting: false,
        header: 'Check Trade Success',
        cell: ({ row: { original } }) => (
          <div className="space-y-2">
            {original.suggestions.map((suggestion, index) => (
              <div key={index}>
                <CheckTradeSuccessButton
                  signalId={original.id}
                  suggestionIndex={index}
                  suggestionType={suggestion.type}
                  hasStopLoss={!!suggestion.stopLossPrice}
                  hasTakeProfit={!!suggestion.takeProfitPrice}
                  onSuccess={handleCheckSuccess}
                />
              </div>
            ))}
          </div>
        ),
      },
    ],
    [handleCheckSuccess],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Signals</h3>
        <div className="flex items-center space-x-2">
          <CheckAllTradesSuccessButton
            liveTradingRoomId={props.liveTradingRoomId}
            onSuccess={handleCheckSuccess}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDailySummary(!showDailySummary)}
          >
            <BarChart3Icon className="w-4 h-4 mr-2" />
            {showDailySummary ? 'Hide' : 'Show'} Daily Summary
          </Button>
        </div>
      </div>

      {showDailySummary && (
        <DailyBalanceSummary liveTradingRoomId={props.liveTradingRoomId} />
      )}

      <DataTable columns={columns} data={list.data} />

      {list.count ? (
        <SpaPagination
          nextPage={list.nextPage ?? { skip: 0, take: TAKE }}
          count={list.count ?? 0}
          hasMore={list.hasMore ?? false}
          limit={TAKE}
        />
      ) : null}
    </div>
  );
}

export function SignalsTable(props: { liveTradingRoomId: string }) {
  return (
    <Suspense>
      <SignalsTableContent liveTradingRoomId={props.liveTradingRoomId} />
    </Suspense>
  );
}

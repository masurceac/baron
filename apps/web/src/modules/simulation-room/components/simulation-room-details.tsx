import { trpc } from '@/core/trpc';
import { InfoBarList } from '@/modules/info-bars/components/info-bar-list';
import { TradingPairSelect } from '@/modules/inputs/trading-pair-select';
import { DetailedTextDialog } from '@/modules/shared/components/detailed-text-dialog';
import { ExecutionStatus } from '@/modules/simulation-execution/components/execution-status';
import {
  TradeCountResult,
  TradeMoneyResult,
} from '@/modules/simulation-execution/components/trade-result';
import {
  AiModelEnum,
  DeepSeekModelEnum,
  GeminiModelEnum,
  OpenAIModelEnum,
} from '@baron/schema';
import { Badge } from '@baron/ui/components/badge';
import { Button } from '@baron/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@baron/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@baron/ui/components/dialog';
import { FormatDate } from '@baron/ui/components/format-date';
import { Separator } from '@baron/ui/components/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@baron/ui/components/table';
import { Suspense } from 'react';
import { ItemActions } from './item-actions';

function getModelLabel(type: AiModelEnum, model: string) {
  switch (type) {
    case AiModelEnum.DeepSeek:
      return model === DeepSeekModelEnum.Chat
        ? 'DeepSeek Chat'
        : 'DeepSeek Reasoner';
    case AiModelEnum.OpenAI:
      return model === OpenAIModelEnum.Gpt41 ? 'GPT-4.1' : 'O4 Mini 2025-04-16';
    case AiModelEnum.Gemini:
      return model === GeminiModelEnum.Gemini25FlashPreview0520
        ? 'Gemini 2.5 Flash Preview 05-20'
        : 'Gemini 2.5 Pro Preview 06-05';
  }
}

function SimulationRoomDetailsContent(props: { simulationRoomId: string }) {
  const [data] = trpc.simulationRoom.get.useSuspenseQuery({
    id: props.simulationRoomId,
  });

  return (
    <Card>
      <CardHeader className="flex items-center justify-start">
        <div className="flex-1">
          <CardTitle>
            <Badge variant="blue" className="mb-2 mr-2">
              Simulation Room
            </Badge>
            <ExecutionStatus status={data.simulationRoom.status} />
            <br />
            {data.simulationRoom.name}
          </CardTitle>
          <CardDescription className="whitespace-pre-line">
            {data.simulationRoom.description || 'No description provided.'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="lg:flex justify-start space-y-4 lg:space-y-0 space-x-4">
        <div className="flex space-x-4 items-center">
          <TradeMoneyResult trades={data.trades ?? []} />
          <TradeCountResult trades={data.trades ?? []} />
        </div>
        <div className="lg:flex items-center space-y-4 lg:space-y-0 space-x-4">
          <TradingPairSelect
            value={data.simulationRoom.pair}
            onChange={() => null}
            disabled
          />
          <DetailedTextDialog
            title="AI Prompt Used"
            content={data.simulationRoom.aiPrompt}
            label="AI Prompt"
          />

          <Dialog>
            <DialogTrigger asChild>
              <Button>Info Bars</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Information Bars Config used in this simulation execution
                </DialogTitle>
              </DialogHeader>
              <DialogContent>
                <InfoBarList items={data.infoBarIds?.map((v) => v.id) ?? []} />
              </DialogContent>
            </DialogContent>
          </Dialog>
          <ItemActions
            item={{
              id: data.simulationRoom.id,
              name: data.simulationRoom.name,
            }}
          />
        </div>
      </CardContent>

      <Separator className="my-2" />

      <CardContent>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-muted/40 rounded-lg p-4 border">
            <h3 className="text-base font-semibold mb-3">
              Trading Configuration
            </h3>
            <div className="space-y-1 flex items-center justify-between space-x-2">
              <div>
                <p className="text-sm text-muted-foreground">Max Trades:</p>
                <p className="font-medium">
                  {data.simulationRoom.maxTradesToExecute}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Crazy Mode:</p>
                <p className="font-medium">
                  {data.simulationRoom.crazyMode ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">FRVP:</p>
                <p className="font-medium">{data.predefinedFrvp.name}</p>
              </div>
            </div>
            <div>
              <div>
                <p className="text-sm text-muted-foreground">Start Date:</p>
                <p className="font-medium">
                  {data.simulationRoom.startDate && (
                    <FormatDate date={data.simulationRoom.startDate} utc />
                  )}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Group ID:</p>
              <p className="font-medium">
                {data.simulationRoom.groupIdentifier}
              </p>
            </div>
          </div>

          <div className="bg-muted/40 rounded-lg p-4 border">
            <h3 className="text-base font-semibold mb-3">AI Configuration</h3>
            <div className="space-y-1">
              <div>
                <p className="text-sm text-muted-foreground">AI Models:</p>
                <p className="font-medium">
                  {data.simulationRoom.aiModels
                    ?.map((model) => getModelLabel(model.type, model.model))
                    .join(', ')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Model Strategy:</p>
                <p className="font-medium">
                  {data.simulationRoom.aiModelStrategy}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price Strategy:</p>
                <p className="font-medium">
                  {data.simulationRoom.aiModelPriceStrategy}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/40 rounded-lg p-4 border">
            <h3 className="text-base font-semibold mb-3">
              Bulk Execution Configuration
            </h3>
            <div className="space-y-1">
              <div>
                <p className="text-sm text-muted-foreground">
                  Number of Executions:
                </p>
                <p className="font-medium">
                  {data.simulationRoom.bulkExecutionsCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Interval:</p>
                <p className="font-medium">
                  {data.simulationRoom.bulkExecutionsIntervalAmount}{' '}
                  {data.simulationRoom.bulkExecutionsIntervalUnits}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Grouped Trade Results</h3>
          {data.groupedTrades && data.groupedTrades.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-muted/40 rounded-lg p-4 border">
                  <p className="text-sm text-muted-foreground">Total Groups</p>
                  <p className="text-2xl font-bold">
                    {data.groupedTrades.length}
                  </p>
                </div>
                <div className="bg-muted/40 rounded-lg p-4 border">
                  <p className="text-sm text-muted-foreground">Total Balance</p>
                  <p
                    className={`text-2xl font-bold ${
                      data.groupedTrades.reduce(
                        (sum, group) => sum + Number(group.totalBalance ?? 0),
                        0,
                      ) >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    $
                    {data.groupedTrades
                      .reduce(
                        (sum, group) => sum + Number(group.totalBalance ?? 0),
                        0,
                      )
                      .toFixed(2)}
                  </p>
                </div>
                <div className="bg-muted/40 rounded-lg p-4 border">
                  <p className="text-sm text-muted-foreground">
                    Average per Group
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      data.groupedTrades.reduce(
                        (sum, group) => sum + Number(group.totalBalance ?? 0),
                        0,
                      ) /
                        data.groupedTrades.length >=
                      0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    $
                    {(
                      data.groupedTrades.reduce(
                        (sum, group) => sum + Number(group.totalBalance ?? 0),
                        0,
                      ) / data.groupedTrades.length
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group Identifier</TableHead>
                      <TableHead className="text-right">
                        Total Balance
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.groupedTrades.map((group, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">
                          {group.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {group.groupIdentifier}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-semibold ${
                              Number(group.totalBalance ?? 0) >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            ${Number(group.totalBalance ?? 0).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                Non-Intersecting Trades
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Non-Intersecting Trades for Group</DialogTitle>
                              </DialogHeader>
                              <NonIntersectingTradesList groupIdentifier={group.groupIdentifier} />
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No grouped trade results available yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function NonIntersectingTradesList({ groupIdentifier }: { groupIdentifier: string }) {
  const { data, isLoading, error } = trpc.simulationExecution.listNonIntersectingTrades.useQuery({ groupIdentifier });
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading trades</div>;
  if (!data || data.length === 0) return <div>No non-intersecting trades found.</div>;
  const endBalance = data.reduce((sum, trade) => sum + Number(trade.balanceResult ?? 0), 0);
  return (
    <div>
      <ExecutionTradeHistoryItemsCustom trades={data} />
      <div className="mt-4 text-right">
        <span className={`font-semibold text-lg ${endBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>End Balance: ${endBalance.toFixed(2)}</span>
      </div>
    </div>
  );
}

// Custom table to display trades (copy columns from ExecutionTradeHistoryItems, but use props.trades as data)
import { DataTable } from '@baron/ui/components/data-table';
import { RedGreenHighlight } from '@/modules/shared';
import { TradeDirection } from '@baron/common';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

function ExecutionTradeHistoryItemsCustom({ trades }: { trades: any[] }) {
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: 'index',
        enableSorting: false,
        header: '#',
        cell: ({ row: { index } }) => `${trades.length - index}`,
      },
      {
        accessorKey: 'createdAt',
        enableSorting: false,
        header: 'Created At',
        cell: ({ row: { original } }) => (
          <div>
            <FormatDate date={original.createdAt} format="long" />
            <p className="text-xs text-muted-foreground">{original.id}</p>
          </div>
        ),
      },
      {
        accessorKey: 'entryDate',
        enableSorting: false,
        header: 'Trade Dates',
        cell: ({ row: { original } }) => (
          <div>
            <FormatDate date={original.entryDate} utc />
            <br />
            <FormatDate date={original.exitDate} utc />
          </div>
        ),
      },
      {
        accessorKey: 'direction',
        enableSorting: false,
        header: 'Direction',
        cell: ({ row: { original } }) => (
          <div>
            <RedGreenHighlight
              variant={
                original.direction === TradeDirection.Buy ? 'green' : 'red'
              }
            >
              {original.direction === TradeDirection.Buy ? 'BUY' : 'SELL'}
            </RedGreenHighlight>
          </div>
        ),
      },
      {
        accessorKey: 'entryPrice',
        enableSorting: false,
        header: 'Entry Price',
        cell: ({ row: { original } }) => (
          <div>${original.entryPrice.toFixed(2)}</div>
        ),
      },
      {
        accessorKey: 'takeProfitPrice',
        enableSorting: false,
        header: 'TP/SL',
        cell: ({ row: { original } }) => (
          <div>
            <div>
              ${original.takeProfitPrice.toFixed(2)}&nbsp;/ $
              {original.stopLossPrice.toFixed(2)}
            </div>
            <div>
              $
              {Math.abs(original.entryPrice - original.takeProfitPrice).toFixed(
                2,
              )}
              &nbsp;/ $
              {Math.abs(original.entryPrice - original.stopLossPrice).toFixed(
                2,
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'exitPrice',
        enableSorting: false,
        header: 'Exit Price',
        cell: ({ row: { original } }) => (
          <RedGreenHighlight
            variant={
              original.direction === TradeDirection.Buy
                ? original.exitPrice < original.entryPrice
                  ? 'red'
                  : 'green'
                : original.exitPrice > original.entryPrice
                  ? 'red'
                  : 'green'
            }
          >
            ${original.exitPrice.toFixed(2)}
          </RedGreenHighlight>
        ),
      },
      {
        accessorKey: 'balanceResult',
        enableSorting: false,
        header: 'Result',
        cell: ({ row: { original } }) => (
          <div>
            <RedGreenHighlight
              variant={original.balanceResult >= 0 ? 'green' : 'red'}
            >
              $
              {original.balanceResult >= 0
                ? `+${original.balanceResult.toFixed(2)}`
                : `-${Math.abs(original.balanceResult).toFixed(2)}`}
            </RedGreenHighlight>
          </div>
        ),
      },
      {
        accessorKey: 'reason',
        enableSorting: false,
        header: 'Reason',
        cell: ({ row: { original } }) => (
          <div>
            <DetailedTextDialog
              title="This is the reason AI gave for this trade"
              content={original.reason}
              label="Reason"
            />
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row: { original } }) => <div>{original.status}</div>,
      },
    ],
    [trades],
  );
  return <DataTable columns={columns} data={trades} />;
}

export function SimulationRoomDetails(props: { simulationRoomId: string }) {
  return (
    <Suspense>
      <SimulationRoomDetailsContent simulationRoomId={props.simulationRoomId} />
    </Suspense>
  );
}

import { getAppRoute, GetRouteParams } from '@/core/route';
import { trpc } from '@/core/trpc';
import { InfoBarList } from '@/modules/info-bars/components/info-bar-list';
import { TradingPairSelect } from '@/modules/inputs/trading-pair-select';
import { PageLayout } from '@/modules/shared';
import { DetailedTextDialog } from '@/modules/shared/components/detailed-text-dialog';
import { ExecutionTradeHistory } from '@/modules/trade-history';
import { ExecutionLogs } from '@/modules/trade-history/components/execution-logs';
import { VolumeProfileList } from '@/modules/volume-profile-config/components/volume-profile-list';
import { SimulationExecutionStatus } from '@baron/db/enum';
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
import { Progress } from '@baron/ui/components/progress';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@baron/ui/components/tabs';
import {
  ArrowLeftIcon,
  CirclePlayIcon,
  OctagonMinusIcon,
  StepForwardIcon,
  StopCircleIcon,
  TargetIcon,
} from 'lucide-react';
import { Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ExecutionStatus } from '../components/execution-status';
import { TradeCountResult, TradeMoneyResult } from '../components/trade-result';

function DetailsData() {
  const params =
    useParams<
      GetRouteParams<'/app/simulation/room/:roomId/view/:executionId'>
    >();
  const utils = trpc.useUtils();

  const [data] = trpc.simulationExecution.getDetails.useSuspenseQuery(
    {
      executionId: params.executionId ?? '',
    },
    {
      refetchInterval: (query) =>
        query.state.data?.status === SimulationExecutionStatus.Running
          ? 5000
          : false,
    },
  );

  const stopExecution = trpc.simulationExecution.stopExecution.useMutation();
  const retryExecution = trpc.simulationExecution.retryExecution.useMutation();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <Badge variant="orange" className="mb-2">
              Simulation Execution
            </Badge>
            <br />
            {data.name}
          </CardTitle>
          <CardDescription>
            These are the details used for the AI in this simulation execution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-lg font-medium">
              Simulation starts on: <FormatDate date={data.startDate} utc />
            </p>
            <div className="max-w-lg text-sm">
              Trades Progress
              <Progress
                value={
                  ((data.trades?.length ?? 0) / data.tradesToExecute) * 100
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2 lg:flex items-center space-x-2">
              <TradingPairSelect
                value={data.pair}
                onChange={() => null}
                disabled
              />
              <ExecutionStatus status={data.status} />
              <Badge>
                <TargetIcon className="w-4 mr-1" /> {data.trades?.length ?? 0}/
                {data.tradesToExecute} trades
              </Badge>
              <Badge>
                <StepForwardIcon className="w-4 mr-1" /> {data.stepMinutes}{' '}
                minute(s) step
              </Badge>
              <Badge title="Trailing Stop">
                <OctagonMinusIcon className="w-4 mr-1" /> Trailing stop{' '}
                {data.trailingStop ? 'enabled' : 'disabled'}
              </Badge>
            </div>
          </div>
        </CardContent>
        <CardContent className="grid md:grid-cols-2 gap-4 lg:flex space-x-8">
          <DetailedTextDialog
            title="This is the default AI prompt used for open orders"
            content={data.aiPrompt}
            label="AI Prompt"
          />
          <Dialog>
            <DialogTrigger asChild>
              <Button>Volume Profile Config</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Volume Profile Config used in this simulation execution
                </DialogTitle>
              </DialogHeader>
              <DialogContent>
                <VolumeProfileList
                  items={
                    data.volumeProfiles?.map((v) => v.volumeProfileConfigId) ??
                    []
                  }
                />
              </DialogContent>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button>Information Bars Config</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Information Bars Config used in this simulation execution
                </DialogTitle>
              </DialogHeader>
              <DialogContent>
                <InfoBarList
                  items={
                    data.infoBars?.map((v) => v.informativeBarConfigId) ?? []
                  }
                />
              </DialogContent>
            </DialogContent>
          </Dialog>
        </CardContent>
        <CardContent className="space-x-4">
          {data.status === SimulationExecutionStatus.Running && (
            <>
              <Button
                variant="destructive"
                onClick={() => {
                  stopExecution.mutate(
                    { executionId: params.executionId ?? '' },
                    {
                      onSuccess: () => {
                        toast('Execution stopped');
                        utils.simulationExecution.getDetails.invalidate({
                          executionId: params.executionId ?? '',
                        });
                      },
                    },
                  );
                }}
              >
                Stop Execution
                <StopCircleIcon className="w-4 ml-2" />
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  retryExecution.mutate(
                    { executionId: params.executionId ?? '' },
                    {
                      onSuccess: () => {
                        toast('Execution Restarted');
                      },
                    },
                  );
                }}
              >
                Retry Execution
                <CirclePlayIcon className="w-4 ml-2" />
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="trades">
        <TabsList>
          <TabsTrigger value="trades">Trades List</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="trades" className="space-y-6">
          <div className="flex items-center justify-start space-x-4">
            <TradeMoneyResult trades={data.trades ?? []} />
            <TradeCountResult trades={data.trades ?? []} />
          </div>
          <ExecutionTradeHistory executionId={params.executionId ?? ''} />
        </TabsContent>

        <TabsContent value="logs">
          <ExecutionLogs executionId={params.executionId ?? ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function SimulationExecutionDetailsPage() {
  const params =
    useParams<
      GetRouteParams<'/app/simulation/room/:roomId/view/:executionId'>
    >();
  return (
    <PageLayout
      title={
        <Button asChild variant="link" size="sm">
          <Link
            to={getAppRoute('/app/simulation/room/:roomId/list', {
              roomId: params.roomId ?? '',
            })}
          >
            <ArrowLeftIcon className="w-4 mr-2" /> Back
          </Link>
        </Button>
      }
    >
      <div>
        <Suspense>
          <DetailsData />
        </Suspense>
      </div>
    </PageLayout>
  );
}

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
import { Button } from '@baron/ui/components/button';
import { Progress } from '@baron/ui/components/progress';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@baron/ui/components/tabs';
import {
  ArrowLeftIcon,
  OctagonMinusIcon,
  StepForwardIcon,
  TargetIcon,
} from 'lucide-react';
import { Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExecutionStatus } from '../components/execution-status';
import { TradeResult } from '../components/trade-result';
import { Badge } from '@baron/ui/components/badge';

function DetailsData() {
  const params =
    useParams<
      GetRouteParams<'/app/simulation/room/:roomId/view/:executionId'>
    >();

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{data.name}</CardTitle>
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
            <div className="flex items-center space-x-2">
              <TradingPairSelect
                value={data.pair}
                onChange={() => null}
                disabled
              />
              <ExecutionStatus status={data.status} />
              <Badge>
                <TargetIcon className="w-4 mr-1" /> {data.tradesToExecute}{' '}
                trades
              </Badge>
              <Badge>
                <StepForwardIcon className="w-4 mr-1" /> {data.stepMinutes}{' '}
                minute(s)
              </Badge>
              <Badge title="Trailing Stop">
                <OctagonMinusIcon className="w-4 mr-1" />{' '}
                {data.trailingStop ? 'Enabled' : 'Disabled'}
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
      </Card>

      <Tabs defaultValue="trades">
        <TabsList>
          <TabsTrigger value="trades">Trades List</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="trades" className="space-y-6">
          <TradeResult trades={data.trades ?? []} />

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
        <p>
          <Button asChild variant="link" size="sm">
            <Link
              to={getAppRoute('/app/simulation/room/:roomId/list', {
                roomId: params.roomId ?? '',
              })}
            >
              <ArrowLeftIcon className="w-4 mr-2" /> Back to List
            </Link>
          </Button>
          Simulation Execution Details.
        </p>
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

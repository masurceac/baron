import { getAppRoute, GetRouteParams } from '@/core/route';
import { trpc } from '@/core/trpc';
import { InfoBarList } from '@/modules/info-bars/components/info-bar-list';
import { PageLayout } from '@/modules/shared';
import { DetailedTextDialog } from '@/modules/shared/components/detailed-text-dialog';
import { ExecutionTradeHistory } from '@/modules/trade-history';
import { ExecutionLogs } from '@/modules/trade-history/components/execution-logs';
import { VolumeProfileList } from '@/modules/volume-profile-config/components/volume-profile-list';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@baron/ui/components/tabs';
import { ArrowLeftIcon } from 'lucide-react';
import { Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TradeResult } from '../components/trade-result';

function DetailsData() {
  const params =
    useParams<
      GetRouteParams<'/app/simulation/room/:roomId/setup/:setupId/view/:executionId'>
    >();

  const [data] = trpc.simulationExecution.getDetails.useSuspenseQuery({
    executionId: params.executionId ?? '',
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Simulation Details</CardTitle>
          <CardDescription>
            These are the details used for the AI in this simulation execution.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4 lg:flex space-x-8">
          <DetailedTextDialog
            title="This is the default AI prompt used for open orders"
            content={data.aiPrompt}
            label="AI Prompt"
          />
          <DetailedTextDialog
            title="This is the default AI prompt used for closed orders"
            content={data.systemPrompt}
            label="System Prompt"
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
        <CardContent>
          <div>
            <p>Pair: {data.pair}</p>
            <p>Status: {data.status}</p>
            <p>
              Start date: <FormatDate date={data.startDate} utc />
            </p>
            <p>Trailing stop: {data.trailingStop ? 'Enabled' : 'Disabled'}</p>
            <p>Step: {data.stepMinutes} minutes</p>
            <p>Target: {data.tradesToExecute} trades</p>
            <TradeResult trades={data.trades ?? []} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="trades">
        <TabsList>
          <TabsTrigger value="trades">Trades List</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>
        <TabsContent value="trades">
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
      GetRouteParams<'/app/simulation/room/:roomId/setup/:setupId/view/:executionId'>
    >();
  return (
    <PageLayout
      title={
        <p>
          <Button asChild variant="link" size="sm">
            <Link
              to={getAppRoute(
                '/app/simulation/room/:roomId/setup/:setupId/list',
                {
                  roomId: params.roomId ?? '',
                  setupId: params.setupId ?? '',
                },
              )}
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

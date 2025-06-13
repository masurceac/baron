import { getAppRoute, GetRouteParams } from '@/core/route';
import { trpc } from '@/core/trpc';
import { PageLayout } from '@/modules/shared';
import { ExecutionTradeHistory } from '@/modules/trade-history';
import { ExecutionLogs } from '@/modules/trade-history/components/execution-logs';
import { SimulationExecutionStatus } from '@baron/common';
import { Button } from '@baron/ui/components/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@baron/ui/components/tabs';
import { ArrowLeftIcon } from 'lucide-react';
import { Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TradeCountResult, TradeMoneyResult } from '../components/trade-result';
import { ExecutionStatus } from '../components/execution-status';

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
      <ExecutionStatus status={data.status} />
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

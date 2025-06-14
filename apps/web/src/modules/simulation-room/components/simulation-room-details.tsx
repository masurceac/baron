import { trpc } from '@/core/trpc';
import { InfoBarList } from '@/modules/info-bars/components/info-bar-list';
import { TradingPairSelect } from '@/modules/inputs/trading-pair-select';
import { DetailedTextDialog } from '@/modules/shared/components/detailed-text-dialog';
import { ExecutionStatus } from '@/modules/simulation-execution/components/execution-status';
import {
  TradeCountResult,
  TradeMoneyResult,
} from '@/modules/simulation-execution/components/trade-result';
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
import { Suspense } from 'react';
import { ItemActions } from './item-actions';

function SimulationRoomDetailsContent(props: { simulationRoomId: string }) {
  const [data] = trpc.simulationRoom.get.useSuspenseQuery({
    id: props.simulationRoomId,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Badge variant="blue" className="mb-2">
            Simulation Room
          </Badge>
          <br />
          {data.name}
        </CardTitle>
        <CardDescription>
          {data.description || 'No description provided.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-2 lg:flex space-x-4">
        <TradingPairSelect value={data.pair} onChange={() => null} disabled />
        <ExecutionStatus status={data.status} />
        <ItemActions item={{ id: data.id, name: data.name }} />
      </CardContent>
      <CardContent className="grid md:grid-cols-2 gap-2 lg:flex space-x-4">
        <DetailedTextDialog
          title="This is the default AI prompt "
          content={data.aiPrompt}
          label="AI Prompt"
        />

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
              <InfoBarList items={data.infoBarIds?.map((v) => v.id) ?? []} />
            </DialogContent>
          </DialogContent>
        </Dialog>
      </CardContent>
      <CardContent className="flex justify-start items-center space-x-4">
        <TradeMoneyResult trades={data.trades ?? []} />
        <TradeCountResult trades={data.trades ?? []} />
      </CardContent>
    </Card>
  );
}
export function SimulationRoomDetails(props: { simulationRoomId: string }) {
  return (
    <Suspense>
      <SimulationRoomDetailsContent simulationRoomId={props.simulationRoomId} />
    </Suspense>
  );
}

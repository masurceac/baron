import { trpc } from '@/core/trpc';
import { InfoBarList } from '@/modules/info-bars/components/info-bar-list';
import { TradingPairSelect } from '@/modules/inputs/trading-pair-select';
import { DetailedTextDialog } from '@/modules/shared/components/detailed-text-dialog';
import {
  TradeCountResult,
  TradeMoneyResult,
} from '@/modules/simulation-execution/components/trade-result';
import { VolumeProfileList } from '@/modules/volume-profile-config/components/volume-profile-list';
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
import { BookIcon, OctagonMinusIcon } from 'lucide-react';
import { Suspense } from 'react';

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
        <Badge variant="outline" title="Trailing Stop">
          <OctagonMinusIcon className="w-4 mr-1" /> Trailing stop{' '}
          {data.trailingStop ? 'enabled' : 'disabled'}
        </Badge>
        <Badge variant="outline">
          <BookIcon className="w-4 mr-1" /> Self Training{' '}
          {data.selfTraining
            ? `enabled (${data.selfTrainingCycles} cycles)`
            : 'disabled'}
        </Badge>
        <Badge variant="outline">
          <BookIcon className="w-4 mr-1" /> Hold Price{' '}
          {data.holdPriceEnabled ? `enabled` : 'disabled'}
        </Badge>
      </CardContent>
      <CardContent className="grid md:grid-cols-2 gap-2 lg:flex space-x-4">
        <DetailedTextDialog
          title="This is the default AI prompt "
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
              <VolumeProfileList items={data.vpcIds?.map((v) => v.id) ?? []} />
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

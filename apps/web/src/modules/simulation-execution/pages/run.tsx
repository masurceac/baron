import { getAppRoute, GetRouteParams } from '@/core/route';
import { trpc } from '@/core/trpc';
import { PageLayout } from '@/modules/shared';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@baron/ui/components/card';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { BackToList } from '../components/back-to-list';
import { ItemForm } from '../components/item-form';
import { Suspense } from 'react';

function RunSimulationExecutionContent() {
  const history = useNavigate();
  const params =
    useParams<GetRouteParams<'/app/simulation/room/:roomId/run'>>();
  const [room] = trpc.simulationRoom.get.useSuspenseQuery({
    id: params.roomId ?? '',
  });

  const createItem = trpc.simulationExecution.runSimulation.useMutation({
    onSuccess: () => {
      toast('Simulation started...');
      history(
        getAppRoute('/app/simulation/room/:roomId/list', {
          roomId: params.roomId ?? '',
        }),
      );
    },
    onError() {
      toast.error('Failed to create Item');
    },
  });

  return (
    <PageLayout title="Create Simulation Room">
      <BackToList />
      <Card className="max-w-screen-lg mx-auto w-full">
        <CardHeader>
          <CardTitle>Create Simulation Room</CardTitle>
          <CardDescription>
            Inside you'll be able to test your Trading Strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ItemForm
            defaultValues={{
              simulationRoomId: params.roomId ?? '',
              aiPrompt: room.aiPrompt ?? '',
              pair: room.pair ?? '',
              trailingStop: room.trailingStop ?? false,
              tradesToExecute: 10,
              vpcIds: room.vpcIds?.map((v) => v.id) ?? [],
              infoBarIds: room.infoBarIds?.map((i) => i.id) ?? [],
              startDate: room.startDate,
              name: `${room.name ?? ''} - `,
              holdPriceEnabled: room.holdPriceEnabled ?? false,
            }}
            onSubmit={(d) => createItem.mutate(d)}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}

export function RunSimulationExecutionPage() {
  return (
    <Suspense>
      <RunSimulationExecutionContent />
    </Suspense>
  );
}

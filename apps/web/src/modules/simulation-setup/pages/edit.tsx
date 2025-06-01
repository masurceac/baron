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

function SimulationSetupEdit() {
  const history = useNavigate();
  const params =
    useParams<GetRouteParams<'/app/simulation/room/:roomId/edit/:setupId'>>();
  const [simulation] = trpc.simulationSetup.getById.useSuspenseQuery({
    id: params.setupId || '',
  });
  const util = trpc.useUtils();
  const editItem = trpc.simulationSetup.edit.useMutation({
    onSuccess: () => {
      toast(`Item created`);
      util.simulationSetup.getById.invalidate({
        id: params.setupId || '',
      });
      toast('Item updated successfully');
      history(
        getAppRoute('/app/simulation/room/:roomId/list', {
          roomId: params.roomId || '',
        }),
      );
    },
    onError() {
      toast.error('Failed to create Item');
    },
  });

  return (
    <PageLayout title="Simulation Setup">
      <BackToList />
      <Card className="max-w-screen-lg mx-auto w-full">
        <CardHeader>
          <CardTitle>Edit Simulation Setup</CardTitle>
          <CardDescription>
            All previous executions will not be affected by this
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ItemForm
            defaultValues={{
              aiPrompt: simulation.aiPrompt || '',
              systemPrompt: simulation.systemPrompt || '',
              tradingPair: simulation.pair,
              trailingStop: simulation.trailingStop,
              vpcIds: simulation.vrpcRelations?.map((rel) => rel.vpcId) ?? [],
              infoBarIds:
                simulation.infoBarRelations?.map((rel) => rel.infoBarId) ?? [],
              simulationRoomId: params.roomId || '',
            }}
            onSubmit={(d) =>
              editItem.mutate({
                id: params.setupId ?? '',
                data: d,
              })
            }
            simulationRoomId={params.roomId || ''}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}

export function SimulationSetupEditPage() {
  return (
    <Suspense>
      <SimulationSetupEdit />
    </Suspense>
  );
}

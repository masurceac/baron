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

export function SimulationSetupCreatePage() {
  const history = useNavigate();
  const params =
    useParams<GetRouteParams<'/app/simulation/room/:roomId/create'>>();
  const createItem = trpc.simulationSetup.create.useMutation({
    onSuccess: () => {
      toast(`Item created`);
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
          <CardTitle>Create Simulation Session</CardTitle>
          <CardDescription>
            Inside you'll be able to test your Trading Strategies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ItemForm
            onSubmit={(d) => createItem.mutate(d)}
            simulationRoomId={params.roomId || ''}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}

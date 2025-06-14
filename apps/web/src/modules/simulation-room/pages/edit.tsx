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

export function SimulationRoomEditPage() {
  const history = useNavigate();
  const params = useParams<GetRouteParams<'/app/simulation/edit/:roomId'>>();
  const [data] = trpc.simulationRoom.get.useSuspenseQuery({
    id: params.roomId ?? '',
  });
  const editItem = trpc.simulationRoom.edit.useMutation({
    onSuccess: () => {
      toast(`Item created`);
      history(getAppRoute('/app/simulation/list'));
    },
    onError() {
      toast.error('Failed to create Item');
    },
  });

  return (
    <PageLayout title="Edit Simulation Room">
      <BackToList />
      <Card className="max-w-screen-lg mx-auto w-full">
        <CardHeader>
          <CardTitle>Edit Simulation Room</CardTitle>
          <CardDescription>
            Edit the details of your Simulation Room here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ItemForm
            defaultValues={{
              ...data,
              infoBarIds: data.infoBarIds?.map((b) => b.id) ?? [],
            }}
            onSubmit={(d) =>
              editItem.mutate({
                id: params.roomId ?? '',
                data: d,
              })
            }
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}

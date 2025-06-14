import { getAppRoute } from '@/core/route';
import { trpc } from '@/core/trpc';
import { PageLayout } from '@/modules/shared';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@baron/ui/components/card';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BackToList } from '../components/back-to-list';
import { ItemForm } from '../components/item-form';

export function SimulationRoomCreatePage() {
  const history = useNavigate();
  const createItem = trpc.simulationRoom.create.useMutation({
    onSuccess: () => {
      toast(`Item created`);
      history(getAppRoute('/app/simulation/list'));
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
            defaultValues={
              {
                name: '',
                description: '',
                pair: 'ETHUSDT',
                aiPrompt: '',
                startDate: new Date(),
                maxTradesToExecute: 10,
                aiModels: [
                  {
                    type: 'deepseek',
                    model: 'deepseek-chat',
                  },
                ],
                aiModelStrategy: 'and',
                aiModelPriceStrategy: 'average',
                predefinedFrvpId: '',
                infoBarIds: [],
                bulkExecutionsCount: 24,
                bulkExecutionsIntervalUnits: 'hour',
                bulkExecutionsIntervalAmount: 1,
              } as any
            }
            onSubmit={(d) => {
              console.log(d);
              createItem.mutate(d);
            }}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}

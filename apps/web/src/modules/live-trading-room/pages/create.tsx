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

export function LiveTradingRoomCreatePage() {
  const history = useNavigate();
  const createItem = trpc.liveTradingRoom.create.useMutation({
    onSuccess: () => {
      toast(`Item created`);
      history(getAppRoute('/app/live-trading/list'));
    },
    onError() {
      toast.error('Failed to create Item');
    },
  });

  return (
    <PageLayout title="Create Live Trading Room">
      <BackToList />
      <Card className="max-w-screen-lg mx-auto w-full">
        <CardHeader>
          <CardTitle>Create Live Trading Room</CardTitle>
          <CardDescription>
            Inside you'll be able to execute your Trading Strategies in
            real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ItemForm
            defaultValues={
              {
                name: '',
                pair: 'ETHUSDT',
                aiPrompt: '',
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

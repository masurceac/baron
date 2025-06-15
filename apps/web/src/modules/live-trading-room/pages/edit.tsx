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

export function LiveTradingRoomEditPage() {
  const params =
    useParams<GetRouteParams<'/app/live-trading/edit/:liveTradingRoomId'>>();
  const history = useNavigate();

  const { data, isLoading } = trpc.liveTradingRoom.get.useQuery(
    { id: params.liveTradingRoomId ?? '' },
    {
      enabled: !!params.liveTradingRoomId,
    },
  );

  const updateItem = trpc.liveTradingRoom.edit.useMutation({
    onSuccess: () => {
      toast(`Item updated`);
      history(getAppRoute('/app/live-trading/list'));
    },
    onError() {
      toast.error('Failed to update Item');
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return <div>Item not found</div>;
  }

  const formData = {
    name: data.liveTradingRoom.name,
    pair: data.liveTradingRoom.pair,
    aiPrompt: data.liveTradingRoom.aiPrompt,
    predefinedFrvpId: data.liveTradingRoom.predefinedFrvpId,
    aiModels: data.liveTradingRoom.aiModels,
    infoBarIds: data.infoBarIds?.map((bar) => bar.id) ?? [],
    aiModelStrategy: data.liveTradingRoom.aiModelStrategy,
    aiModelPriceStrategy: data.liveTradingRoom.aiModelPriceStrategy,
  };

  return (
    <PageLayout title="Edit Live Trading Room">
      <BackToList />
      <Card className="max-w-screen-lg mx-auto w-full">
        <CardHeader>
          <CardTitle>Edit Live Trading Room</CardTitle>
          <CardDescription>
            Inside you'll be able to execute your Trading Strategies in
            real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ItemForm
            defaultValues={formData}
            onSubmit={(d) => {
              updateItem.mutate({ id: params.liveTradingRoomId!, data: d });
            }}
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}

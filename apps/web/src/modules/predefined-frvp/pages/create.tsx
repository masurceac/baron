import { getAppRoute } from '@/core/route';
import { trpc } from '@/core/trpc';
import { PageLayout } from '@/modules/shared';
import { TradingPair } from '@baron/common';
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

export function FRVPCreatePage() {
  const history = useNavigate();
  const createItem = trpc.frvp.create.useMutation({
    onSuccess: () => {
      toast(`Item created`);
      history(getAppRoute('/app/frvp/list'));
    },
    onError() {
      toast.error('Failed to create Item');
    },
  });

  return (
    <PageLayout title="Create FRVP">
      <BackToList />
      <Card className="max-w-screen-lg mx-auto w-full">
        <CardHeader>
          <CardTitle>Create FRVP</CardTitle>
          <CardDescription>
            Create a new FRVP to use in your simulations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ItemForm
            defaultValues={{
              name: '',
              pair: TradingPair.ETHUSDT,
            }}
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

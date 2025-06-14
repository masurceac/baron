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

export function FRVPEditPage() {
  const history = useNavigate();
  const params = useParams<GetRouteParams<'/app/frvp/edit/:frvpId'>>();
  const [item] = trpc.frvp.get.useSuspenseQuery({
    id: params.frvpId ?? '',
  });
  const editItem = trpc.frvp.edit.useMutation({
    onSuccess: () => {
      toast(`Item edited`);
      history(getAppRoute('/app/frvp/list'));
    },
    onError() {
      toast.error('Failed to edit Item');
    },
  });

  return (
    <PageLayout title="Edit FRVP">
      <BackToList />
      <Card className="max-w-screen-lg mx-auto w-full">
        <CardHeader>
          <CardTitle>Edit FRVP</CardTitle>
          <CardDescription>Edit the details of your FRVP here.</CardDescription>
        </CardHeader>
        <CardContent>
          <ItemForm
            defaultValues={{
              name: item.name,
              pair: item.pair,
              lastDate: new Date(item.lastDate),
              profiles: item.profiles.map((profile) => ({
                label: profile.label,
                zones: profile.zones.map((zone) => ({
                  volumeAreaHigh: zone.volumeAreaHigh,
                  volumeAreaLow: zone.volumeAreaLow,
                  pointOfControl: zone.pointOfControl,
                  zoneStartAt: new Date(zone.zoneStartAt),
                  zoneEndAt: new Date(zone.zoneEndAt),
                })),
              })),
            }}
            onSubmit={(d) =>
              editItem.mutate({
                id: params.frvpId ?? '',
                data: d,
              })
            }
          />
        </CardContent>
      </Card>
    </PageLayout>
  );
}

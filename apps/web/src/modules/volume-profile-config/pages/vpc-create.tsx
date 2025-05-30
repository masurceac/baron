import { trpc } from '@/core/trpc';
import { PageLayout } from '@/modules/shared';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@baron/ui/components/card';
import { toast } from 'sonner';
import { VPCForm } from '../components/vpc-form';
import { useNavigate } from 'react-router-dom';
import { getAppRoute } from '@/core/route';
import { BackToList } from '../components/back-to-list';

export function VPCCreatePage() {
  const history = useNavigate();
  const createVPC = trpc.volumeProfileConfig.create.useMutation({
    onSuccess: () => {
      toast(`Volume Profile Config created`);
      history(getAppRoute('/app/volume-profile-config/list'));
    },
    onError() {
      toast.error('Failed to create Volume Profile Config');
    },
  });

  return (
    <PageLayout title="Create Volume Profile Config">
      <BackToList />
      <Card className="max-w-screen-lg mx-auto w-full">
        <CardHeader>
          <CardTitle>Create Volume Profile Config</CardTitle>
          <CardDescription>
            Set up a new volume profile config parameters for the best output.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VPCForm onSubmit={(d) => createVPC.mutate(d)} />
        </CardContent>
      </Card>
    </PageLayout>
  );
}

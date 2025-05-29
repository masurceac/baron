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

export function VPCCreatePage() {
  const history = useNavigate();
  const createVPC = trpc.volumeProfileConfig.create.useMutation({
    onSuccess: () => {
      toast(`Volume Profile Config created`);
      history(getAppRoute('/app'));
    },
  });

  return (
    <PageLayout title="Create Volume Profile Config">
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

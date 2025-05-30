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
import { VPCForm } from '../components/info-bar-form';
import { useNavigate } from 'react-router-dom';
import { getAppRoute } from '@/core/route';
import { BackToList } from '../components/back-to-list';

export function InfoBarCreatePage() {
  const history = useNavigate();
  const createInfoBar = trpc.infoBars.create.useMutation({
    onSuccess: () => {
      toast(`Item created`);
      history(getAppRoute('/app/info-bars/list'));
    },
    onError() {
      toast.error('Failed to create Item');
    },
  });

  return (
    <PageLayout title="Create Informative Bar Settings">
      <BackToList />
      <Card className="max-w-screen-lg mx-auto w-full">
        <CardHeader>
          <CardTitle>Create Informative Bar Settings</CardTitle>
          <CardDescription>
            You will be able to send then to AI the data based on what you
            configure here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VPCForm onSubmit={(d) => createInfoBar.mutate(d)} />
        </CardContent>
      </Card>
    </PageLayout>
  );
}

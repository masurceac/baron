import { PageLayout } from '@/modules/shared';
import { useUser } from '@clerk/clerk-react';
import { AppHomepage } from '../components/app-main';

export function MainPage() {
  const details = useUser();

  if (!details.isLoaded || !details.isSignedIn) {
    return null;
  }

  return (
    <PageLayout title="Homepage">
      <AppHomepage />
    </PageLayout>
  );
}

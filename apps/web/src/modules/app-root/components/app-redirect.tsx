import { getAppRoute } from '@/core/route';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { RedirectTo } from '@baron/ui-spa/redirect-to';

export function AppRedirect() {
  return (
    <>
      <SignedIn>
        <RedirectTo path={getAppRoute('/app')} />
      </SignedIn>
      <SignedOut>
        <RedirectTo path={getAppRoute('/auth/sign-in')} />
      </SignedOut>
    </>
  );
}

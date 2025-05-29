import { getAppRoute } from '@/core/route';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { RedirectTo } from '@baron/ui-spa/redirect-to';
import { Outlet } from 'react-router-dom';

export function AuthGuard() {
  return (
    <>
      <SignedIn>
        <Outlet />
      </SignedIn>
      <SignedOut>
        <RedirectTo path={getAppRoute('/auth/sign-in')} />
      </SignedOut>
    </>
  );
}

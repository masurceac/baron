import { getAppRoute } from '@/core/route';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { RedirectTo } from '@baron/ui-spa/redirect-to';
import { Container } from '@baron/ui/components/container';
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <Container
      className="h-screen py-12 items-center flex justify-center"
      size="screenMd"
    >
      <SignedOut>
        <Outlet />
      </SignedOut>
      <SignedIn>
        <RedirectTo path={getAppRoute('/')} />
      </SignedIn>
    </Container>
  );
}

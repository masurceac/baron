import { getAppRoute } from '@/core/route';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { RedirectTo } from '@baron/ui-spa/redirect-to';
import { Outlet } from 'react-router-dom';
import { SidebarInset, SidebarProvider } from '@baron/ui/components/ui/sidebar';
import { AppSidebar } from '@/modules/shared/components/app-sidebar';

export function AuthGuard() {
  return (
    <>
      <SignedIn>
        <SidebarProvider>
          <AppSidebar variant="inset" />
          <SidebarInset>
            <Outlet />
          </SidebarInset>
        </SidebarProvider>
      </SignedIn>
      <SignedOut>
        <RedirectTo path={getAppRoute('/auth/sign-in')} />
      </SignedOut>
    </>
  );
}

import { TooltipProvider } from '@baron/ui/components/tooltip';
import { Toaster } from '@baron/ui/components/sonner';
import { Outlet } from 'react-router-dom';
import { ClerkRootProvider } from './clerk';
import { TrpcRootProvider } from './trpc';

export function CoreProviders() {
  return (
    <ClerkRootProvider>
      <TrpcRootProvider>
        <TooltipProvider>
          <Outlet />
        </TooltipProvider>
        <Toaster />
      </TrpcRootProvider>
    </ClerkRootProvider>
  );
}

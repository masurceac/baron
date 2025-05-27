import { env } from '@/env';
import { useTheme } from '@baron/ui-spa/theme-provider';
import { ClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAppRoute } from '../route';

export function ClerkRootProvider(props: { children: ReactNode }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  return (
    <ClerkProvider
      appearance={
        theme === 'dark'
          ? {
              baseTheme: dark,
            }
          : undefined
      }
      publishableKey={env.VITE_CLERK_PUBLISHABLE_KEY}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      afterSignOutUrl={getAppRoute('/')}
      signUpUrl={getAppRoute('/auth/sign-up')}
      signInUrl={getAppRoute('/auth/sign-in')}
    >
      {props.children}
    </ClerkProvider>
  );
}

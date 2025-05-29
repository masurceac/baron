import { defineModuleRouting } from '@baron/routes/utils';
import { RouteObject } from 'react-router-dom';
import { SignInPage } from './pages/sign-in';
import { SignUpPage } from './pages/sign-up';
import { AuthLayout } from './components/auth-layout';
import { RedirectToSignIn } from './components/redirect-to-sign-in';

export const authRouter = defineModuleRouting([
  {
    Component: AuthLayout,
    children: [
      {
        path: '',
        Component: RedirectToSignIn,
      },
      {
        path: 'sign-in',
        Component: SignInPage,
      },
      {
        path: 'sign-up',
        Component: SignUpPage,
      },
    ],
  },
] as const satisfies RouteObject[]);

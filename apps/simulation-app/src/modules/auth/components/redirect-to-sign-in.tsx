import { getAppRoute } from '@/core/route';
import { RedirectTo } from '@baron/ui-spa/redirect-to';

export function RedirectToSignIn() {
  return <RedirectTo path={getAppRoute('/auth/sign-in')} />;
}

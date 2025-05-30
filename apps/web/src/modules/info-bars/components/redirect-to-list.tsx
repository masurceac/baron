import { getAppRoute } from '@/core/route';
import { RedirectTo } from '@baron/ui-spa/redirect-to';

export function RedirectToList() {
  return <RedirectTo path={getAppRoute('/app/info-bars/list')} />;
}

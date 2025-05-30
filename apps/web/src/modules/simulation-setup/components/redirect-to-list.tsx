import { getAppRoute, GetRouteParams } from '@/core/route';
import { RedirectTo } from '@baron/ui-spa/redirect-to';
import { useParams } from 'react-router-dom';

export function RedirectToList() {
  const params = useParams<GetRouteParams<'/app/simulation/room/:roomId'>>();

  return (
    <RedirectTo
      path={getAppRoute('/app/simulation/room/:roomId/list', {
        roomId: params.roomId ?? '',
      })}
    />
  );
}

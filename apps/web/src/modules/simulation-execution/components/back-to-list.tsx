import { getAppRoute, GetRouteParams } from '@/core/route';
import { Button } from '@baron/ui/components/button';
import { ArrowLeftIcon } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export function BackToList() {
  const params =
    useParams<GetRouteParams<'/app/simulation/room/:roomId/list'>>();

  return (
    <div>
      <Button asChild variant="link">
        <Link
          to={getAppRoute('/app/simulation/room/:roomId/list', {
            roomId: params.roomId ?? '',
          })}
        >
          <ArrowLeftIcon className="w-4" />
          Back
        </Link>
      </Button>
    </div>
  );
}

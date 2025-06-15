import { getAppRoute } from '@/core/route';
import { Button } from '@baron/ui/components/button';
import { ArrowLeftIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function BackToList() {
  return (
    <div>
      <Button asChild variant="link">
        <Link to={getAppRoute('/app/live-trading/list')}>
          <ArrowLeftIcon className="w-4" />
          Back
        </Link>
      </Button>
    </div>
  );
}

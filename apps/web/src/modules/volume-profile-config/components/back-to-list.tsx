import { getAppRoute } from '@/core/route';
import { ArrowLeftIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@baron/ui/components/button';

export function BackToList() {
  return (
    <div>
      <Button asChild variant="link">
        <Link to={getAppRoute('/app/volume-profile-config/list')}>
          <ArrowLeftIcon className="w-4" />
          Back
        </Link>
      </Button>
    </div>
  );
}

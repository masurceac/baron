import { useUser } from '@clerk/clerk-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@baron/ui/components/card';
import { Link } from 'react-router-dom';
import { getAppRoute } from '@/core/route';
import { Separator } from '@baron/ui/components/separator';
import { ArrowRightIcon } from 'lucide-react';

export function AppHomepage() {
  const details = useUser();

  if (!details.isLoaded || !details.isSignedIn) {
    return null;
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Quick Navigation</CardTitle>
          <CardDescription>
            Browse the main features of the app.
          </CardDescription>
        </CardHeader>
        <Separator />
        <CardContent>
          <Link to={getAppRoute('/app')} className="flex">
            Main App
            <ArrowRightIcon className="w-4 ml-1" />
          </Link>
        </CardContent>
        <CardContent>
          <Link
            to={getAppRoute('/app/volume-profile-config/create')}
            className="flex"
          >
            Volume Profile Config
            <ArrowRightIcon className="w-4 ml-1" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

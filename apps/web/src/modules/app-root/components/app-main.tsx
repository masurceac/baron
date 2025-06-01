import { getAppRoute } from '@/core/route';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@baron/ui/components/card';
import { Separator } from '@baron/ui/components/separator';
import { useUser } from '@clerk/clerk-react';
import { ArrowRightIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SimulationExecutionStats } from './simulation-execution-stats';

export function AppHomepage() {
  const details = useUser();

  if (!details.isLoaded || !details.isSignedIn) {
    return null;
  }

  return (
    <div>
      <Card>
        <CardHeader className="flex items-center justify-between space-x-8">
          <div>
            <CardTitle>Quick Navigation</CardTitle>
            <CardDescription>
              Browse the main features of the app.
            </CardDescription>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <SimulationExecutionStats />
          </div>
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
            to={getAppRoute('/app/volume-profile-config/list')}
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

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@baron/ui/components/card';
import { useUser } from '@clerk/clerk-react';
import { SimulationExecutionStats } from './simulation-execution-stats';

export function AppHomepage() {
  const details = useUser();

  if (!details.isLoaded || !details.isSignedIn) {
    return null;
  }

  return (
    <div>
      <Card>
        <CardHeader className="block lg:flex items-center justify-between space-x-8">
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
      </Card>
    </div>
  );
}

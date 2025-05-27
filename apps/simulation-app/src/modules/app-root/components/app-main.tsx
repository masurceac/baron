import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';

export function AppHomepage() {
  const details = useUser();

  if (!details.isLoaded || !details.isSignedIn) {
    return null;
  }

  return (
    <div>
      <Link to="/">Link to latest sessions</Link>
    </div>
  );
}

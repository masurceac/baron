import { UserButton, UserProfile, useUser } from '@clerk/clerk-react';
import { TypographyH2 } from '@baron/ui/typography/typography-h2';

export function AppHomepage() {
  const details = useUser();

  if (!details.isLoaded || !details.isSignedIn) {
    return null;
  }

  return (
    <>
      <TypographyH2 className="flex justify-between items-center w-full">
        <span>
          Welcome back,<b> {details.user.firstName}</b>!
        </span>
        <UserButton />
      </TypographyH2>
      <div className="flex justify-center">
        <UserProfile />
      </div>
    </>
  );
}

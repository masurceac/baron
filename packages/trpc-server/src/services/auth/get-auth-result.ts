import { ClerkClient } from '@clerk/backend';

export async function getAuthResult(clerkClient: ClerkClient, req?: Request) {
  if (!req) {
    return null;
  }

  const { isSignedIn, toAuth } = await clerkClient.authenticateRequest(req);

  if (!isSignedIn) {
    return null;
  }

  return toAuth();
}

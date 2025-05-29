import { env } from './env';

if (!env.VITE_CLERK_PUBLISHABLE_KEY) {
  alert('Missing Clerk Publishable Key');
}
if (!env.VITE_SERVER_URL) {
  alert('Missing VITE_SERVER_URL');
}

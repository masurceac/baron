import { router } from '@baron/trpc-server';
import { volumeProfileConfigRouter } from './routers/volume-profile-config';

export const appRouter = router({
	volumeProfileConfig: volumeProfileConfigRouter,
});

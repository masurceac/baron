import { volumeProfileConfig } from '@baron/db/schema';
import { volumeProfileConfigSchema } from '@baron/schema';
import { protectedProcedure } from '@baron/trpc-server';
import { getDatabase } from '@baron/trpc-server/async-storage/getters';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';

export const volumeProfileConfigRouter = {
	create: protectedProcedure.input(volumeProfileConfigSchema).mutation(async ({ input }) => {
		const db = getDatabase();

		const configExists = await db
			.select({
				id: volumeProfileConfig.id,
			})
			.from(volumeProfileConfig)
			.where(
				and(
					eq(volumeProfileConfig.maxDeviationPercent, input.maxDeviationPercent),
					eq(volumeProfileConfig.minimumBarsToConsider, input.minimumBarsToConsider),
					eq(volumeProfileConfig.timeframeUnit, input.timeframeUnit),
					eq(volumeProfileConfig.timeframeAmount, input.timeframeAmount),
					eq(volumeProfileConfig.historicalTimeToConsiderAmount, input.historicalTimeToConsiderAmount),
				),
			);

		if (configExists.length > 0) {
			throw new TRPCError({
				code: 'CONFLICT',
			});
		}

		const newConfig = await db
			.insert(volumeProfileConfig)
			.values({
				name: input.name,
				timeframeUnit: input.timeframeUnit,
				timeframeAmount: input.timeframeAmount,
				maxDeviationPercent: input.maxDeviationPercent,
				minimumBarsToConsider: input.minimumBarsToConsider,
				historicalTimeToConsiderAmount: input.historicalTimeToConsiderAmount,
			})
			.returning();

		if (!newConfig || newConfig.length === 0) {
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Failed to create volume profile config',
			});
		}

		return newConfig[0];
	}),
};

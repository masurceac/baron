import { paginate, paginatedSchema } from '@baron/common';
import { volumeProfileConfig } from '@baron/db/schema';
import { volumeProfileConfigSchema } from '@baron/schema';
import { protectedProcedure } from '@baron/trpc-server';
import { getDatabase } from '@baron/trpc-server/async-storage/getters';
import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, ilike, inArray, isNull, SQL } from 'drizzle-orm';
import { z } from 'zod';

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

		const [newConfig] = await db
			.insert(volumeProfileConfig)
			.values({
				name: input.name.trim(),
				timeframeUnit: input.timeframeUnit,
				timeframeAmount: input.timeframeAmount,
				maxDeviationPercent: input.maxDeviationPercent,
				minimumBarsToConsider: input.minimumBarsToConsider,
				historicalTimeToConsiderAmount: input.historicalTimeToConsiderAmount,
				volumeProfilePercentage: input.volumeProfilePercentage ?? 70,
			})
			.returning();

		if (!newConfig) {
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Failed to create volume profile config',
			});
		}

		return newConfig;
	}),
	list: protectedProcedure
		.input(
			z
				.object({
					search: z.string().optional(),
					ids: z.string().array().optional(),
				})
				.merge(paginatedSchema),
		)
		.query(async ({ input }) => {
			const db = getDatabase();

			const where: (SQL | undefined)[] = [];
			if (input.search) {
				where.push(ilike(volumeProfileConfig.name, `%${input.search}%`));
			}

			if (input.ids && input.ids.length > 0) {
				where.push(inArray(volumeProfileConfig.id, input.ids));
			}

			return paginate({
				skip: input.skip ?? 0,
				take: input.take ?? input.ids?.length ?? 10,
				maxTake: 100,
				count: async () => {
					const query = db
						.select({ count: count(volumeProfileConfig.id) })
						.from(volumeProfileConfig)
						.where(and(...where));

					const result = await query;
					return result[0]?.count ?? 0;
				},
				query: async ({ take, skip }) => {
					return db
						.select()
						.from(volumeProfileConfig)
						.where(and(...where))
						.orderBy(desc(volumeProfileConfig.createdAt))
						.limit(take)
						.offset(skip);
				},
			});
		}),

	delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
		const db = getDatabase();

		const deletedConfig = await db
			.delete(volumeProfileConfig)
			.where(and(eq(volumeProfileConfig.id, input.id), isNull(volumeProfileConfig.flag)))
			.returning();

		if (!deletedConfig || deletedConfig.length === 0) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Volume profile config not found',
			});
		}

		return deletedConfig[0];
	}),
};

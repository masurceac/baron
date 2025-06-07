import { getDatabase } from '@/database';
import { paginate, paginatedSchema } from '@baron/common';
import { informativeBarConfig } from '@baron/db/schema';
import { inforBarSchema } from '@baron/schema';
import { protectedProcedure } from '@baron/trpc-server';
import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, ilike, inArray, isNull, SQL } from 'drizzle-orm';
import { z } from 'zod';

export const infoBarsRouter = {
	create: protectedProcedure.input(inforBarSchema).mutation(async ({ input }) => {
		const db = getDatabase();

		const [existingBar] = await db
			.select({ id: informativeBarConfig.id })
			.from(informativeBarConfig)
			.where(
				and(
					eq(informativeBarConfig.timeframeUnit, input.timeframeUnit),
					eq(informativeBarConfig.timeframeAmount, input.timeframeAmount),
					eq(informativeBarConfig.historicalBarsToConsiderAmount, input.historicalBarsToConsiderAmount),
				),
			)
			.limit(1);

		if (existingBar) {
			throw new TRPCError({
				code: 'CONFLICT',
				message: 'An informative bar with the same configuration already exists.',
			});
		}

		const [newBar] = await db
			.insert(informativeBarConfig)
			.values({
				name: input.name.trim(),
				timeframeUnit: input.timeframeUnit,
				timeframeAmount: input.timeframeAmount,
				historicalBarsToConsiderAmount: input.historicalBarsToConsiderAmount,
			})
			.returning();

		if (!newBar) {
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Failed to create informative bar configuration.',
			});
		}

		return newBar;
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
				where.push(ilike(informativeBarConfig.name, `%${input.search}%`));
			}

			if (input.ids && input.ids.length > 0) {
				where.push(inArray(informativeBarConfig.id, input.ids));
			} else if (input.ids?.length === 0) {
				where.push(eq(informativeBarConfig.id, 'never'));
			}

			return paginate({
				skip: input.skip ?? 0,
				take: input.take ?? input.ids?.length ?? 10,
				maxTake: 100,
				count: async () => {
					const query = db
						.select({ count: count(informativeBarConfig.id) })
						.from(informativeBarConfig)
						.where(and(...where));

					const result = await query;
					return result[0]?.count ?? 0;
				},
				query: async ({ take, skip }) => {
					return db
						.select()
						.from(informativeBarConfig)
						.where(and(...where))
						.orderBy(desc(informativeBarConfig.createdAt))
						.limit(take)
						.offset(skip);
				},
			});
		}),

	delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
		const db = getDatabase();

		const deletedConfig = await db
			.delete(informativeBarConfig)
			.where(and(eq(informativeBarConfig.id, input.id), isNull(informativeBarConfig.flag)))
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

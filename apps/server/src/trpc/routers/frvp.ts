import { getDatabase } from '@/database';
import { paginate, paginatedSchema } from '@baron/common';
import { predefinedFrvp } from '@baron/db/schema';
import { createPredefinedFrvpSchema } from '@baron/schema';
import { protectedProcedure } from '@baron/trpc-server';
import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, ilike, SQL } from 'drizzle-orm';
import { z } from 'zod';

export const frvpRouter = {
	create: protectedProcedure.input(createPredefinedFrvpSchema).mutation(async ({ input }) => {
		const db = getDatabase();

		const [existingFrvp] = await db
			.select({ id: predefinedFrvp.id })
			.from(predefinedFrvp)
			.where(eq(predefinedFrvp.name, input.name))
			.limit(1);

		if (existingFrvp) {
			throw new TRPCError({
				code: 'CONFLICT',
			});
		}

		const [frvp] = await db
			.insert(predefinedFrvp)
			.values({
				name: input.name,
				pair: input.pair,
				lastDate: input.lastDate,
				profiles: input.profiles,
			})
			.returning();

		if (!frvp) {
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
			});
		}

		return frvp;
	}),

	edit: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				data: createPredefinedFrvpSchema,
			}),
		)
		.mutation(async ({ input }) => {
			const db = getDatabase();
			const { id, data } = input;

			const [frvp] = await db
				.update(predefinedFrvp)
				.set({
					name: data.name,
					pair: data.pair,
					lastDate: data.lastDate,
					profiles: data.profiles,
				})
				.where(eq(predefinedFrvp.id, id))
				.returning();

			if (!frvp) {
				throw new TRPCError({
					code: 'NOT_FOUND',
				});
			}

			return frvp;
		}),

	get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
		const db = getDatabase();

		const [frvp] = await db.select().from(predefinedFrvp).where(eq(predefinedFrvp.id, input.id)).limit(1);

		if (!frvp) {
			throw new TRPCError({
				code: 'NOT_FOUND',
			});
		}
		return frvp;
	}),

	list: protectedProcedure
		.input(
			z
				.object({
					search: z.string().optional(),
				})
				.merge(paginatedSchema),
		)
		.query(async ({ input }) => {
			const db = getDatabase();

			const where: (SQL | undefined)[] = [];
			if (input.search) {
				where.push(ilike(predefinedFrvp.name, `%${input.search}%`));
			}

			return paginate({
				skip: input.skip,
				take: input.take,
				maxTake: 100,
				count: async () => {
					const query = db
						.select({ count: count(predefinedFrvp.id) })
						.from(predefinedFrvp)
						.where(and(...where));

					const result = await query;
					return result[0]?.count ?? 0;
				},
				query: async ({ take, skip }) => {
					return db
						.select()
						.from(predefinedFrvp)
						.where(and(...where))
						.orderBy(desc(predefinedFrvp.createdAt))
						.limit(take)
						.offset(skip);
				},
			});
		}),

	delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
		const db = getDatabase();

		const deletedFRVP = await db.delete(predefinedFrvp).where(eq(predefinedFrvp.id, input.id)).returning();

		if (!deletedFRVP || deletedFRVP.length === 0) {
			throw new TRPCError({
				code: 'NOT_FOUND',
			});
		}

		return deletedFRVP[0];
	}),
};

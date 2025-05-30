import { paginate, paginatedSchema } from '@baron/common';
import { simulationRoom } from '@baron/db/schema';
import { simulationRoomSchema } from '@baron/schema';
import { protectedProcedure } from '@baron/trpc-server';
import { getAuth, getClerkClient, getDatabase } from '@baron/trpc-server/async-storage/getters';
import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, ilike, SQL } from 'drizzle-orm';
import { z } from 'zod';

export const simulationRoomRouter = {
	create: protectedProcedure.input(simulationRoomSchema).mutation(async ({ input }) => {
		const db = getDatabase();

		const [existingSimulation] = await db
			.select({ id: simulationRoom.id })
			.from(simulationRoom)
			.where(eq(simulationRoom.name, input.name))
			.limit(1);

		if (existingSimulation) {
			throw new TRPCError({
				code: 'CONFLICT',
				message: 'A simulation room with the same name already exists.',
			});
		}

		const auth = getAuth();
		const user = await getClerkClient().users.getUser(auth.userId!);

		const [newRoom] = await db
			.insert(simulationRoom)
			.values({
				name: input.name.trim(),
				description: input.description.trim(),
				authorId: user.id,
				authorName: user.fullName ?? user.username ?? 'Unknown User',
			})
			.returning();

		if (!newRoom) {
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
				message: 'Failed to create informative bar configuration.',
			});
		}

		return newRoom;
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
				where.push(ilike(simulationRoom.name, `%${input.search}%`));
			}

			return paginate({
				skip: input.skip,
				take: input.take,
				maxTake: 100,
				count: async () => {
					const query = db
						.select({ count: count(simulationRoom.id) })
						.from(simulationRoom)
						.where(and(...where));

					const result = await query;
					return result[0]?.count ?? 0;
				},
				query: async ({ take, skip }) => {
					return db
						.select({
							id: simulationRoom.id,
							createdAt: simulationRoom.createdAt,
							name: simulationRoom.name,
							description: simulationRoom.description,
							authorId: simulationRoom.authorId,
							authorName: simulationRoom.authorName,
						})
						.from(simulationRoom)
						.where(and(...where))
						.orderBy(desc(simulationRoom.createdAt))
						.limit(take)
						.offset(skip);
				},
			});
		}),

	delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
		const db = getDatabase();

		const deletedRoom = await db.delete(simulationRoom).where(eq(simulationRoom.id, input.id)).returning();

		if (!deletedRoom || deletedRoom.length === 0) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Room not found',
			});
		}

		return deletedRoom[0];
	}),
};

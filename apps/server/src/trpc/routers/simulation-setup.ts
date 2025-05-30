import { paginate, paginatedSchema } from '@baron/common';
import {
	informativeBarConfig,
	informativeBarConfigToSimulationSetup,
	simulationRoom,
	simulationSetup,
	volumeProfileConfig,
	volumeProfileConfigToSimulationSetup,
} from '@baron/db/schema';
import { simulationSetupSchema } from '@baron/schema';
import { protectedProcedure } from '@baron/trpc-server';
import { getDatabase } from '@baron/trpc-server/async-storage/getters';
import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, inArray, SQL } from 'drizzle-orm';
import { z } from 'zod';

export const simulationSetupRouter = {
	create: protectedProcedure.input(simulationSetupSchema).mutation(async ({ input }) => {
		const db = getDatabase();

		const simulation = await db.transaction(async (tx) => {
			const [simulation] = await tx
				.insert(simulationSetup)
				.values({
					pair: input.tradingPair,
					aiPrompt: input.aiPrompt.trim(),
					systemPrompt: input.systemPrompt.trim(),
					trailingStop: input.trailingStop,
					simulationRoomId: input.simulationRoomId,
				})
				.returning();

			if (!simulation) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'Failed to create simulation setup',
				});
			}

			const vpcs = await tx
				.select({ id: volumeProfileConfig.id })
				.from(volumeProfileConfig)
				.where(inArray(volumeProfileConfig.id, input.vpcIds));

			if (vpcs.length !== input.vpcIds.length) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'One or more VPCs not found',
				});
			}

			const infoBarsSetup = await tx
				.select({ id: informativeBarConfig.id })
				.from(informativeBarConfig)
				.where(inArray(informativeBarConfig.id, input.infoBarIds));

			if (infoBarsSetup.length !== input.infoBarIds.length) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'One or more informative bars not found',
				});
			}
			await tx.insert(volumeProfileConfigToSimulationSetup).values(
				input.vpcIds.map((vpcId) => ({
					simulationSetupId: simulation.id,
					volumeProfileConfigId: vpcId,
				})),
			);

			await tx.insert(informativeBarConfigToSimulationSetup).values(
				input.infoBarIds.map((infoBarId) => ({
					simulationSetupId: simulation.id,
					informativeBarConfigId: infoBarId,
				})),
			);

			return simulation;
		});

		return simulation;
	}),

	list: protectedProcedure.input(z.object({ simulationRoomId: z.string() }).merge(paginatedSchema)).query(async ({ input }) => {
		const db = getDatabase();
		const where: (SQL | undefined)[] = [eq(simulationSetup.simulationRoomId, input.simulationRoomId)];

		return paginate({
			skip: input.skip,
			take: input.take,
			maxTake: 100,
			count: async () => {
				const query = db
					.select({ count: count(simulationRoom.id) })
					.from(simulationSetup)
					.where(and(...where));

				const result = await query;
				return result[0]?.count ?? 0;
			},
			query: async ({ take, skip }) => {
				return db
					.select({
						id: simulationSetup.id,
						createdAt: simulationSetup.createdAt,
						pair: simulationSetup.pair,
						trailingStop: simulationSetup.trailingStop,
						aiPrompt: simulationSetup.aiPrompt,
					})
					.from(simulationSetup)
					.where(and(...where))
					.orderBy(desc(simulationSetup.createdAt))
					.limit(take)
					.offset(skip);
			},
		});
	}),

	delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
		const db = getDatabase();

		const deletedRoom = await db.delete(simulationSetup).where(eq(simulationSetup.id, input.id)).returning();

		if (!deletedRoom || deletedRoom.length === 0) {
			throw new TRPCError({
				code: 'NOT_FOUND',
			});
		}

		return deletedRoom[0];
	}),
};

import { paginate, paginatedSchema } from '@baron/common';
import { queryJoin } from '@baron/db/client';
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

	edit: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				data: simulationSetupSchema,
			}),
		)
		.mutation(async ({ input }) => {
			const db = getDatabase();
			const { id, data } = input;
			const [simulationSetupData] = await db
				.select({
					id: simulationSetup.id,
				})
				.from(simulationSetup)
				.where(eq(simulationSetup.id, id))
				.limit(1);
			if (!simulationSetupData) {
				throw new TRPCError({
					code: 'NOT_FOUND',
				});
			}

			const updatedSimulation = await db.transaction(async (tx) => {
				const [updatedSimulationSetup] = await tx
					.update(simulationSetup)
					.set({
						pair: data.tradingPair,
						aiPrompt: data.aiPrompt.trim(),
						systemPrompt: data.systemPrompt.trim(),
						trailingStop: data.trailingStop,
					})
					.where(eq(simulationSetup.id, id))
					.returning();

				if (!updatedSimulationSetup) {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
					});
				}

				const vpcs = await tx
					.select({ id: volumeProfileConfig.id })
					.from(volumeProfileConfig)
					.where(inArray(volumeProfileConfig.id, data.vpcIds));

				if (vpcs.length !== data.vpcIds.length) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'One or more VPCs not found',
					});
				}

				const infoBarsSetup = await tx
					.select({ id: informativeBarConfig.id })
					.from(informativeBarConfig)
					.where(inArray(informativeBarConfig.id, data.infoBarIds));

				if (infoBarsSetup.length !== data.infoBarIds.length) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'One or more informative bars not found',
					});
				}

				await tx.delete(volumeProfileConfigToSimulationSetup).where(eq(volumeProfileConfigToSimulationSetup.simulationSetupId, id));
				await tx.delete(informativeBarConfigToSimulationSetup).where(eq(informativeBarConfigToSimulationSetup.simulationSetupId, id));

				await tx.insert(volumeProfileConfigToSimulationSetup).values(
					data.vpcIds.map((vpcId) => ({
						simulationSetupId: id,
						volumeProfileConfigId: vpcId,
					})),
				);
				await tx.insert(informativeBarConfigToSimulationSetup).values(
					data.infoBarIds.map((infoBarId) => ({
						simulationSetupId: id,
						informativeBarConfigId: infoBarId,
					})),
				);
				return updatedSimulationSetup;
			});

			return updatedSimulation;
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

	getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
		const db = getDatabase();
		const [simulation] = await db
			.select({
				id: simulationSetup.id,
				createdAt: simulationSetup.createdAt,
				pair: simulationSetup.pair,
				trailingStop: simulationSetup.trailingStop,
				aiPrompt: simulationSetup.aiPrompt,
				systemPrompt: simulationSetup.systemPrompt,
				vrpcRelations: queryJoin(
					db,
					{
						id: volumeProfileConfigToSimulationSetup.id,
						vpcId: volumeProfileConfigToSimulationSetup.volumeProfileConfigId,
					},
					(query) =>
						query
							.from(volumeProfileConfigToSimulationSetup)
							.where(eq(volumeProfileConfigToSimulationSetup.simulationSetupId, simulationSetup.id)),
				),
				infoBarRelations: queryJoin(
					db,
					{
						id: informativeBarConfigToSimulationSetup.id,
						infoBarId: informativeBarConfigToSimulationSetup.informativeBarConfigId,
					},
					(query) =>
						query
							.from(informativeBarConfigToSimulationSetup)
							.where(eq(informativeBarConfigToSimulationSetup.simulationSetupId, simulationSetup.id)),
				),
			})
			.from(simulationSetup)
			.where(eq(simulationSetup.id, input.id))
			.limit(1);
		if (!simulation) {
			throw new TRPCError({
				code: 'NOT_FOUND',
			});
		}
		return simulation;
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

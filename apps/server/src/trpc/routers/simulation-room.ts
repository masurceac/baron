import { getDatabase } from '@/database';
import { SimulationRoomExecutionWorkflowParams } from '@/workflows/types';
import { addTimeUnits, paginate, paginatedSchema, SimulationExecutionStatus, TimeUnit } from '@baron/common';
import { queryJoin } from '@baron/db/client';
import {
	informativeBarConfig,
	predefinedFrvp,
	simulationExecution,
	simulationExecutionTrade,
	simulationRoom,
	simulationRoomToInformativeBar,
} from '@baron/db/schema';
import { createId } from '@paralleldrive/cuid2';
import { simulationRoomSchema } from '@baron/schema';
import { protectedProcedure } from '@baron/trpc-server';
import { getAuth, getClerkClient } from '@baron/trpc-server/async-storage/getters';
import { TRPCError } from '@trpc/server';
import { env } from 'cloudflare:workers';
import { and, count, desc, eq, ilike, inArray, or, SQL, sum } from 'drizzle-orm';
import { z } from 'zod';

async function triggerRoomExecution(roomId: string) {
	const db = getDatabase();

	const [room] = await db
		.update(simulationRoom)
		.set({
			status: SimulationExecutionStatus.Running,
			groupIdentifier: createId(),
		})
		.where(eq(simulationRoom.id, roomId))
		.returning();

	if (!room) {
		throw new TRPCError({
			code: 'NOT_FOUND',
		});
	}

	const executionsToCreate = Array.from({ length: room.bulkExecutionsCount }).map((_, index) => ({
		simulationRoomId: room.id,
		startDate: addTimeUnits(room.startDate, room.bulkExecutionsIntervalUnits, room.bulkExecutionsIntervalAmount * index),
		aiPrompt: room.aiPrompt,
		groupIdentifier: room.groupIdentifier,
		trailingStopLoss: room.trailingStopLoss,
		crazyMode: room.crazyMode,
		name: room.name,
	}));

	const executions = await db.insert(simulationExecution).values(executionsToCreate).returning();
	await Promise.all(
		executions.map((execution) =>
			env.SIMULATION_ROOM_EXECUTION_WORKFLOW.create({
				params: {
					simulationRoomExecutionId: execution.id,
				} satisfies SimulationRoomExecutionWorkflowParams,
			}),
		),
	);
}

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

		const roomResult = await db.transaction(async (tx) => {
			const [room] = await tx
				.insert(simulationRoom)
				.values({
					name: input.name.trim(),
					description: input.description?.trim() ?? null,
					authorId: user.id,
					authorName: user.fullName ?? user.username ?? 'Unknown User',
					aiPrompt: input.aiPrompt.trim(),
					pair: input.pair,
					startDate: input.startDate,
					groupIdentifier: createId(),
					maxTradesToExecute: input.maxTradesToExecute,
					trailingStopLoss: input.trailingStopLoss,
					crazyMode: input.crazyMode,
					aiModels: input.aiModels,
					predefinedFrvpId: input.predefinedFrvpId,
					aiModelStrategy: input.aiModelStrategy,
					aiModelPriceStrategy: input.aiModelPriceStrategy,

					bulkExecutionsCount: input.bulkExecutionsCount,
					bulkExecutionsIntervalUnits: input.bulkExecutionsIntervalUnits,
					bulkExecutionsIntervalAmount: input.bulkExecutionsIntervalAmount ?? 0,
				})
				.returning();

			if (!room) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
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

			await tx.insert(simulationRoomToInformativeBar).values(
				input.infoBarIds.map((infoBarId) => ({
					simulationRoomId: room.id,
					informativeBarConfigId: infoBarId,
				})),
			);

			return room;
		});

		if (!roomResult) {
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
			});
		}

		await triggerRoomExecution(roomResult.id);

		return roomResult;
	}),

	edit: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				data: simulationRoomSchema,
			}),
		)
		.mutation(async ({ input }) => {
			const db = getDatabase();
			const { id, data } = input;
			const [roomData] = await db
				.select({
					id: simulationRoom.id,
				})
				.from(simulationRoom)
				.where(eq(simulationRoom.id, id))
				.limit(1);
			if (!roomData) {
				throw new TRPCError({
					code: 'NOT_FOUND',
				});
			}

			const updatedSimulation = await db.transaction(async (tx) => {
				const [updatedRoom] = await tx
					.update(simulationRoom)
					.set({
						name: input.data.name.trim(),
						description: input.data.description?.trim() ?? null,
						aiPrompt: input.data.aiPrompt.trim(),
						pair: input.data.pair,
						startDate: input.data.startDate,
						maxTradesToExecute: input.data.maxTradesToExecute,
						trailingStopLoss: input.data.trailingStopLoss,
						crazyMode: input.data.crazyMode,
						aiModels: input.data.aiModels,
						predefinedFrvpId: input.data.predefinedFrvpId,
						aiModelStrategy: input.data.aiModelStrategy,
						aiModelPriceStrategy: input.data.aiModelPriceStrategy,

						bulkExecutionsCount: input.data.bulkExecutionsCount,
						bulkExecutionsIntervalUnits: input.data.bulkExecutionsIntervalUnits ?? TimeUnit.Hour,
						bulkExecutionsIntervalAmount: input.data.bulkExecutionsIntervalAmount ?? 0,
					})
					.where(eq(simulationRoom.id, id))
					.returning();

				if (!updatedRoom) {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
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

				await tx.delete(simulationRoomToInformativeBar).where(eq(simulationRoomToInformativeBar.simulationRoomId, id));

				await tx.insert(simulationRoomToInformativeBar).values(
					data.infoBarIds.map((infoBarId) => ({
						simulationRoomId: id,
						informativeBarConfigId: infoBarId,
					})),
				);
				return updatedRoom;
			});

			return updatedSimulation;
		}),

	get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
		const db = getDatabase();
		const [room] = await db
			.select({
				simulationRoom: simulationRoom,
				predefinedFrvp: predefinedFrvp,
				trades: queryJoin(
					db,
					{
						id: simulationExecutionTrade.id,
						balanceResult: simulationExecutionTrade.balanceResult,
					},
					(query) =>
						query
							.from(simulationExecutionTrade)
							.innerJoin(simulationExecution, eq(simulationExecutionTrade.simulationExecutionId, simulationExecution.id))
							.where(eq(simulationExecution.simulationRoomId, simulationRoom.id)),
				),
				infoBarIds: queryJoin(db, { id: informativeBarConfig.id }, (query) =>
					query
						.from(simulationRoomToInformativeBar)
						.innerJoin(informativeBarConfig, eq(simulationRoomToInformativeBar.informativeBarConfigId, informativeBarConfig.id))
						.where(eq(simulationRoomToInformativeBar.simulationRoomId, simulationRoom.id)),
				),
				groupedTrades: queryJoin(
					db,
					{
						groupIdentifier: simulationExecution.groupIdentifier,
						totalBalance: sum(simulationExecutionTrade.balanceResult),
						name: simulationExecution.name,
					},
					(query) =>
						query
							.from(simulationExecutionTrade)
							.innerJoin(simulationExecution, eq(simulationExecutionTrade.simulationExecutionId, simulationExecution.id))
							.where(eq(simulationExecution.simulationRoomId, simulationRoom.id))
							.groupBy(simulationExecution.groupIdentifier, simulationExecution.name),
				),
			})
			.from(simulationRoom)
			.innerJoin(predefinedFrvp, eq(simulationRoom.predefinedFrvpId, predefinedFrvp.id))
			.where(eq(simulationRoom.id, input.id))
			.limit(1);

		if (!room) {
			throw new TRPCError({
				code: 'NOT_FOUND',
			});
		}
		return room;
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
							startDate: simulationRoom.startDate,
							status: simulationRoom.status,
							name: simulationRoom.name,
							description: simulationRoom.description,
							authorId: simulationRoom.authorId,
							authorName: simulationRoom.authorName,
							aiPrompt: simulationRoom.aiPrompt,
							aiModels: simulationRoom.aiModels,
							aiModelStrategy: simulationRoom.aiModelStrategy,
							aiModelPriceStrategy: simulationRoom.aiModelPriceStrategy,
							trades: queryJoin(
								db,
								{
									id: simulationExecutionTrade.id,
									balanceResult: simulationExecutionTrade.balanceResult,
								},
								(query) =>
									query
										.from(simulationExecutionTrade)
										.innerJoin(simulationExecution, eq(simulationExecutionTrade.simulationExecutionId, simulationExecution.id))
										.where(eq(simulationExecution.simulationRoomId, simulationRoom.id)),
							),
						})
						.from(simulationRoom)
						.where(and(...where))
						.orderBy(desc(simulationRoom.createdAt))
						.limit(take)
						.offset(skip);
				},
			});
		}),

	triggerExecution: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
		await triggerRoomExecution(input.id);

		return {
			success: true,
		};
	}),

	stopExecution: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
		const db = getDatabase();
		await db
			.update(simulationRoom)
			.set({
				status: SimulationExecutionStatus.Canceled,
			})
			.where(eq(simulationRoom.id, input.id));

		await db
			.update(simulationExecution)
			.set({
				status: SimulationExecutionStatus.Canceled,
			})
			.where(
				and(
					eq(simulationExecution.simulationRoomId, input.id),
					or(
						eq(simulationExecution.status, SimulationExecutionStatus.Pending),
						eq(simulationExecution.status, SimulationExecutionStatus.Running),
					),
				),
			);
		return {
			success: true,
		};
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

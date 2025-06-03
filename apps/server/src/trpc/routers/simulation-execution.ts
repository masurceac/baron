import { getEnv } from '@/async-storage';
import { paginate, paginatedSchema } from '@baron/common';
import { queryJoin, queryJoinOne } from '@baron/db/client';
import { SimulationExecutionStatus } from '@baron/db/enum';
import {
	simulationExecution,
	simulationExecutionToInformativeBarConfig,
	simulationExecutionToVolumeProfileConfig,
	simulationExecutionTrade,
	simulationRoom,
	simulationRoomToInformativeBar,
	simulationRoomToVolumeProfileConfig,
} from '@baron/db/schema';
import { simulationRunSchema } from '@baron/schema';
import { protectedProcedure } from '@baron/trpc-server';
import { getDatabase } from '@baron/trpc-server/async-storage/getters';
import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, SQL } from 'drizzle-orm';
import { z } from 'zod';

export const simulationExecutionRouter = {
	runSimulation: protectedProcedure.input(simulationRunSchema).mutation(async ({ input }) => {
		const db = getDatabase();

		const [roomResult] = await db
			.select({
				id: simulationRoom.id,
				aiPrompt: simulationRoom.aiPrompt,
				systemPrompt: simulationRoom.systemPrompt,
				pair: simulationRoom.pair,
				trailingStop: simulationRoom.trailingStop,
				volumeProfiles: queryJoin(
					db,
					{
						id: simulationRoomToVolumeProfileConfig.id,
						volumeProfileConfigId: simulationRoomToVolumeProfileConfig.volumeProfileConfigId,
					},
					(query) =>
						query
							.from(simulationRoomToVolumeProfileConfig)
							.where(eq(simulationRoomToVolumeProfileConfig.simulationRoomId, simulationRoom.id)),
				),
				infoBars: queryJoin(
					db,
					{
						id: simulationRoomToInformativeBar.id,
						informativeBarConfigId: simulationRoomToInformativeBar.informativeBarConfigId,
					},
					(query) =>
						query.from(simulationRoomToInformativeBar).where(eq(simulationRoomToInformativeBar.simulationRoomId, simulationRoom.id)),
				),
			})
			.from(simulationRoom)
			.where(eq(simulationRoom.id, input.simulationRoomId))
			.limit(1);

		if (!roomResult || !roomResult.infoBars?.length || !roomResult.volumeProfiles?.length) {
			throw new TRPCError({
				code: 'NOT_FOUND',
			});
		}

		const executionResult = await db.transaction(async (tx) => {
			const [execution] = await tx
				.insert(simulationExecution)
				.values({
					simulationRoomId: roomResult.id,
					startDate: input.startDate,
					tradesToExecute: input.iterations ?? 10,
					aiPrompt: input.aiPrompt,
					systemPrompt: input.systemPrompt,
					pair: input.pair,
					trailingStop: input.trailingStop ?? false,
					name: input.name.trim(),
				})
				.returning();

			if (!execution) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
				});
			}
			await tx.insert(simulationExecutionToVolumeProfileConfig).values(
				roomResult.volumeProfiles!.map((profile) => ({
					simulationExecutionId: execution.id,
					volumeProfileConfigId: profile.volumeProfileConfigId,
				})),
			);

			await tx.insert(simulationExecutionToInformativeBarConfig).values(
				roomResult.infoBars!.map((bar) => ({
					simulationExecutionId: execution.id,
					informativeBarConfigId: bar.informativeBarConfigId,
				})),
			);

			return execution;
		});

		const env = getEnv();

		await env.PROCESS_SIMULATION_EXECUTION.create({
			id: executionResult.id,
			params: {
				simulationExecutionId: executionResult.id,
			},
		});

		return executionResult;
	}),

	list: protectedProcedure.input(z.object({ simulationRoomId: z.string() }).merge(paginatedSchema)).query(async ({ input }) => {
		const db = getDatabase();
		const where: (SQL | undefined)[] = [eq(simulationExecution.simulationRoomId, input.simulationRoomId)];

		return paginate({
			skip: input.skip,
			take: input.take,
			maxTake: 100,
			count: async () => {
				const query = db
					.select({ count: count(simulationExecution.id) })
					.from(simulationExecution)
					.where(and(...where));

				const result = await query;
				return result[0]?.count ?? 0;
			},
			query: async ({ take, skip }) => {
				return db
					.select({
						id: simulationExecution.id,
						name: simulationExecution.name,
						createdAt: simulationExecution.createdAt,
						pair: simulationExecution.pair,
						stepMinutes: simulationExecution.stepMinutes,
						tradesToExecute: simulationExecution.tradesToExecute,
						startDate: simulationExecution.startDate,
						status: simulationExecution.status,
						trades: queryJoin(
							db,
							{
								id: simulationExecutionTrade.id,
								balanceResult: simulationExecutionTrade.balanceResult,
							},
							(query) =>
								query.from(simulationExecutionTrade).where(eq(simulationExecutionTrade.simulationExecutionId, simulationExecution.id)),
						),
					})
					.from(simulationExecution)
					.where(and(...where))
					.orderBy(desc(simulationExecution.createdAt))
					.limit(take)
					.offset(skip);
			},
		});
	}),

	getDetails: protectedProcedure.input(z.object({ executionId: z.string() })).query(async ({ input }) => {
		const db = getDatabase();

		const [execution] = await db
			.select({
				id: simulationExecution.id,
				name: simulationExecution.name,
				createdAt: simulationExecution.createdAt,
				simulationRoomId: simulationExecution.simulationRoomId,
				startDate: simulationExecution.startDate,
				aiPrompt: simulationExecution.aiPrompt,
				systemPrompt: simulationExecution.systemPrompt,
				tradesToExecute: simulationExecution.tradesToExecute,
				trailingStop: simulationExecution.trailingStop,
				status: simulationExecution.status,
				stepMinutes: simulationExecution.stepMinutes,
				pair: simulationExecution.pair,
				trades: queryJoin(
					db,
					{
						id: simulationExecutionTrade.id,
						balanceResult: simulationExecutionTrade.balanceResult,
					},
					(query) => query.from(simulationExecutionTrade).where(eq(simulationExecutionTrade.simulationExecutionId, simulationExecution.id)),
				),
				volumeProfiles: queryJoin(
					db,
					{
						id: simulationExecutionToVolumeProfileConfig.id,
						volumeProfileConfigId: simulationExecutionToVolumeProfileConfig.volumeProfileConfigId,
					},
					(query) =>
						query
							.from(simulationExecutionToVolumeProfileConfig)
							.where(eq(simulationExecutionToVolumeProfileConfig.simulationExecutionId, simulationExecution.id)),
				),
				infoBars: queryJoin(
					db,
					{
						id: simulationExecutionToInformativeBarConfig.id,
						informativeBarConfigId: simulationExecutionToInformativeBarConfig.informativeBarConfigId,
					},
					(query) =>
						query
							.from(simulationExecutionToInformativeBarConfig)
							.where(eq(simulationExecutionToInformativeBarConfig.simulationExecutionId, simulationExecution.id)),
				),
			})
			.from(simulationExecution)
			.where(eq(simulationExecution.id, input.executionId))
			.limit(1);

		if (!execution) {
			throw new TRPCError({
				code: 'NOT_FOUND',
			});
		}

		return execution;
	}),

	getAppStats: protectedProcedure.query(async () => {
		const db = getDatabase();

		const [stats] = await db
			.select({
				total: count(simulationExecution.id),
				pending: queryJoinOne(
					db,
					{
						count: count(simulationExecution.id),
					},
					(query) => query.from(simulationExecution).where(eq(simulationExecution.status, SimulationExecutionStatus.Pending)),
				),
				completed: queryJoinOne(
					db,
					{
						count: count(simulationExecution.id),
					},
					(query) => query.from(simulationExecution).where(eq(simulationExecution.status, SimulationExecutionStatus.Completed)),
				),
				failed: queryJoinOne(
					db,
					{
						count: count(simulationExecution.id),
					},
					(query) => query.from(simulationExecution).where(eq(simulationExecution.status, SimulationExecutionStatus.Failed)),
				),
				running: queryJoinOne(
					db,
					{
						count: count(simulationExecution.id),
					},
					(query) => query.from(simulationExecution).where(eq(simulationExecution.status, SimulationExecutionStatus.Running)),
				),
			})
			.from(simulationExecution);

		if (!stats) {
			throw new TRPCError({
				code: 'NOT_FOUND',
			});
		}

		return stats;
	}),
};

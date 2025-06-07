import { getDatabase } from '@/database';
import { runSimulation } from '@/services/run-simulation';
import { paginate, paginatedSchema } from '@baron/common';
import { queryJoin, queryJoinOne } from '@baron/db/client';
import { SimulationExecutionStatus } from '@baron/db/enum';
import {
	simulationExecution,
	simulationExecutionToInformativeBarConfig,
	simulationExecutionToVolumeProfileConfig,
	simulationExecutionTrade,
} from '@baron/db/schema';
import { simulationRunSchema } from '@baron/schema';
import { protectedProcedure } from '@baron/trpc-server';
import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, SQL } from 'drizzle-orm';
import { z } from 'zod';

export const simulationExecutionRouter = {
	runSimulation: protectedProcedure.input(simulationRunSchema).mutation(async ({ input }) => {
		return runSimulation(input);
	}),
	stopExecution: protectedProcedure.input(z.object({ executionId: z.string() })).mutation(async ({ input }) => {
		const db = getDatabase();

		const [execution] = await db
			.select({ id: simulationExecution.id, status: simulationExecution.status })
			.from(simulationExecution)
			.where(eq(simulationExecution.id, input.executionId))
			.limit(1);

		if (!execution) {
			throw new TRPCError({
				code: 'NOT_FOUND',
			});
		}

		if (execution.status !== SimulationExecutionStatus.Running) {
			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: 'Simulation execution is not running.',
			});
		}

		await db
			.update(simulationExecution)
			.set({ status: SimulationExecutionStatus.Completed })
			.where(eq(simulationExecution.id, input.executionId));

		return { success: true };
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

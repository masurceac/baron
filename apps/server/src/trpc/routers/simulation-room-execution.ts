import { getDatabase } from '@/database';
import { paginate, paginatedSchema, SimulationExecutionStatus } from '@baron/common';
import { queryJoin, queryJoinOne } from '@baron/db/client';
import {
	simulationExecutionToInformativeBarConfig,
	simulationExecutionTrade,
	simulationRoom,
	simulationExecution,
} from '@baron/db/schema';
import { protectedProcedure } from '@baron/trpc-server';
import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, SQL } from 'drizzle-orm';
import { z } from 'zod';

export const simulationRoomExecutionRouter = {
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
						createdAt: simulationExecution.createdAt,
						startDate: simulationExecution.startDate,
						status: simulationExecution.status,
						simulationRoomId: simulationExecution.simulationRoomId,
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
				createdAt: simulationExecution.createdAt,
				simulationRoomId: simulationExecution.simulationRoomId,
				startDate: simulationExecution.startDate,
				aiPrompt: simulationExecution.aiPrompt,
				status: simulationRoom.status,
				trades: queryJoin(
					db,
					{
						id: simulationExecutionTrade.id,
						balanceResult: simulationExecutionTrade.balanceResult,
					},
					(query) =>
						query.from(simulationExecutionTrade).where(eq(simulationExecutionTrade.simulationExecutionId, simulationExecution.id)),
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
			.innerJoin(simulationRoom, eq(simulationRoom.id, simulationExecution.simulationRoomId))
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
					(query) =>
						query
							.from(simulationExecution)
							.innerJoin(simulationRoom, eq(simulationRoom.id, simulationExecution.simulationRoomId))
							.where(eq(simulationRoom.status, SimulationExecutionStatus.Pending)),
				),
				completed: queryJoinOne(
					db,
					{
						count: count(simulationExecution.id),
					},
					(query) =>
						query
							.from(simulationExecution)
							.innerJoin(simulationRoom, eq(simulationRoom.id, simulationExecution.simulationRoomId))
							.where(eq(simulationRoom.status, SimulationExecutionStatus.Completed)),
				),
				failed: queryJoinOne(
					db,
					{
						count: count(simulationExecution.id),
					},
					(query) =>
						query
							.from(simulationExecution)
							.innerJoin(simulationRoom, eq(simulationRoom.id, simulationExecution.simulationRoomId))
							.where(eq(simulationRoom.status, SimulationExecutionStatus.Failed)),
				),
				running: queryJoinOne(
					db,
					{
						count: count(simulationExecution.id),
					},
					(query) =>
						query
							.from(simulationExecution)
							.innerJoin(simulationRoom, eq(simulationRoom.id, simulationExecution.simulationRoomId))
							.where(eq(simulationRoom.status, SimulationExecutionStatus.Running)),
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

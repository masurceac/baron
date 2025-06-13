import { getDatabase } from '@/database';
import { paginate, paginatedSchema, SimulationExecutionStatus } from '@baron/common';
import { queryJoin, queryJoinOne } from '@baron/db/client';
import {
	simulationExecutionToInformativeBarConfig,
	simulationExecutionTrade,
	simulationRoom,
	simulationRoomExecution,
} from '@baron/db/schema';
import { protectedProcedure } from '@baron/trpc-server';
import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, SQL } from 'drizzle-orm';
import { z } from 'zod';

export const simulationRoomExecutionRouter = {
	list: protectedProcedure.input(z.object({ simulationRoomId: z.string() }).merge(paginatedSchema)).query(async ({ input }) => {
		const db = getDatabase();
		const where: (SQL | undefined)[] = [eq(simulationRoomExecution.simulationRoomId, input.simulationRoomId)];

		return paginate({
			skip: input.skip,
			take: input.take,
			maxTake: 100,
			count: async () => {
				const query = db
					.select({ count: count(simulationRoomExecution.id) })
					.from(simulationRoomExecution)
					.where(and(...where));

				const result = await query;
				return result[0]?.count ?? 0;
			},
			query: async ({ take, skip }) => {
				return db
					.select({
						id: simulationRoomExecution.id,
						createdAt: simulationRoomExecution.createdAt,
						startDate: simulationRoomExecution.startDate,
						simulationRoomId: simulationRoomExecution.simulationRoomId,
						trades: queryJoin(
							db,
							{
								id: simulationExecutionTrade.id,
								balanceResult: simulationExecutionTrade.balanceResult,
							},
							(query) =>
								query.from(simulationExecutionTrade).where(eq(simulationExecutionTrade.simulationExecutionId, simulationRoomExecution.id)),
						),
					})
					.from(simulationRoomExecution)
					.where(and(...where))
					.orderBy(desc(simulationRoomExecution.createdAt))
					.limit(take)
					.offset(skip);
			},
		});
	}),

	getDetails: protectedProcedure.input(z.object({ executionId: z.string() })).query(async ({ input }) => {
		const db = getDatabase();

		const [execution] = await db
			.select({
				id: simulationRoomExecution.id,
				createdAt: simulationRoomExecution.createdAt,
				simulationRoomId: simulationRoomExecution.simulationRoomId,
				startDate: simulationRoomExecution.startDate,
				aiPrompt: simulationRoomExecution.aiPrompt,
				status: simulationRoom.status,
				trades: queryJoin(
					db,
					{
						id: simulationExecutionTrade.id,
						balanceResult: simulationExecutionTrade.balanceResult,
					},
					(query) =>
						query.from(simulationExecutionTrade).where(eq(simulationExecutionTrade.simulationExecutionId, simulationRoomExecution.id)),
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
							.where(eq(simulationExecutionToInformativeBarConfig.simulationExecutionId, simulationRoomExecution.id)),
				),
			})
			.from(simulationRoomExecution)
			.innerJoin(simulationRoom, eq(simulationRoom.id, simulationRoomExecution.simulationRoomId))
			.where(eq(simulationRoomExecution.id, input.executionId))
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
				total: count(simulationRoomExecution.id),
				pending: queryJoinOne(
					db,
					{
						count: count(simulationRoomExecution.id),
					},
					(query) =>
						query
							.from(simulationRoomExecution)
							.innerJoin(simulationRoom, eq(simulationRoom.id, simulationRoomExecution.simulationRoomId))
							.where(eq(simulationRoom.status, SimulationExecutionStatus.Pending)),
				),
				completed: queryJoinOne(
					db,
					{
						count: count(simulationRoomExecution.id),
					},
					(query) =>
						query
							.from(simulationRoomExecution)
							.innerJoin(simulationRoom, eq(simulationRoom.id, simulationRoomExecution.simulationRoomId))
							.where(eq(simulationRoom.status, SimulationExecutionStatus.Completed)),
				),
				failed: queryJoinOne(
					db,
					{
						count: count(simulationRoomExecution.id),
					},
					(query) =>
						query
							.from(simulationRoomExecution)
							.innerJoin(simulationRoom, eq(simulationRoom.id, simulationRoomExecution.simulationRoomId))
							.where(eq(simulationRoom.status, SimulationExecutionStatus.Failed)),
				),
				running: queryJoinOne(
					db,
					{
						count: count(simulationRoomExecution.id),
					},
					(query) =>
						query
							.from(simulationRoomExecution)
							.innerJoin(simulationRoom, eq(simulationRoom.id, simulationRoomExecution.simulationRoomId))
							.where(eq(simulationRoom.status, SimulationExecutionStatus.Running)),
				),
			})
			.from(simulationRoomExecution);

		if (!stats) {
			throw new TRPCError({
				code: 'NOT_FOUND',
			});
		}

		return stats;
	}),
};

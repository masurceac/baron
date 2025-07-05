import { getDatabase } from '@/database';
import { paginate, paginatedSchema, SimulationExecutionStatus } from '@baron/common';
import { queryJoin, queryJoinOne } from '@baron/db/client';
import { simulationExecutionToInformativeBarConfig, simulationExecutionTrade, simulationRoom, simulationExecution } from '@baron/db/schema';
import { protectedProcedure } from '@baron/trpc-server';
import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, SQL, sql } from 'drizzle-orm';
import { z } from 'zod';
import { InferModel } from 'drizzle-orm';

// Add type alias for Trade
// This is the type for a row in simulationExecutionTrade
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Trade = InferModel<typeof simulationExecutionTrade>;

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
						name: simulationExecution.name,
						startDate: simulationExecution.startDate,
						status: simulationExecution.status,
						groupIdentifier: simulationExecution.groupIdentifier,
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
					.orderBy(
						desc(sql`MIN(${simulationExecution.createdAt}) OVER (PARTITION BY ${simulationExecution.groupIdentifier})`),
						simulationExecution.groupIdentifier,
						simulationExecution.startDate,
					)
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
					(query) => query.from(simulationExecutionTrade).where(eq(simulationExecutionTrade.simulationExecutionId, simulationExecution.id)),
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

	listNonIntersectingTrades: protectedProcedure.input(z.object({ groupIdentifier: z.string() })).query(async ({ input }) => {
		const db = getDatabase();
		// Get all trades for all executions with the given groupIdentifier
		const trades = await db
			.select()
			.from(simulationExecutionTrade)
			.innerJoin(simulationExecution, eq(simulationExecutionTrade.simulationExecutionId, simulationExecution.id))
			.where(eq(simulationExecution.groupIdentifier, input.groupIdentifier));

		// Flatten the result to just the trade objects
		const tradeList: Trade[] = trades.map((row) => row.simulation_execution_trade);

		// Sort trades by entryDate (or exitDate)
		const sorted = [...tradeList].sort((a, b) => a.entryDate.getTime() - b.entryDate.getTime());

		// Greedily select a maximal set of non-overlapping trades
		const linearHistory: Trade[] = [];
		let lastExit: Date | null = null;
		for (const trade of sorted) {
			if (!lastExit || trade.entryDate > lastExit) {
				linearHistory.push(trade);
				lastExit = trade.exitDate;
			}
		}

		return linearHistory;
	}),
};

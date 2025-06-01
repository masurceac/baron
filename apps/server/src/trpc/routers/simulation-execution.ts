import { paginate, paginatedSchema } from '@baron/common';
import { queryJoin } from '@baron/db/client';
import {
	informativeBarConfigToSimulationSetup,
	simulationExecution,
	simulationExecutionToInformativeBarConfig,
	simulationExecutionToVolumeProfileConfig,
	simulationExecutionTrade,
	simulationSetup,
	volumeProfileConfigToSimulationSetup,
} from '@baron/db/schema';
import { simulationRunSchema } from '@baron/schema';
import { protectedProcedure } from '@baron/trpc-server';
import { getDatabase } from '@baron/trpc-server/async-storage/getters';
import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, SQL } from 'drizzle-orm';
import { z } from 'zod';

export const simulationExecutionRouter = {
	runSimulationSetup: protectedProcedure.input(simulationRunSchema).mutation(async ({ input }) => {
		const db = getDatabase();

		const [simulationSetupResult] = await db
			.select({
				id: simulationSetup.id,
				simulationRoomId: simulationSetup.simulationRoomId,
				aiPrompt: simulationSetup.aiPrompt,
				systemPrompt: simulationSetup.systemPrompt,
				pair: simulationSetup.pair,
				trailingStop: simulationSetup.trailingStop,
				volumeProfiles: queryJoin(
					db,
					{
						id: volumeProfileConfigToSimulationSetup.id,
						volumeProfileConfigId: volumeProfileConfigToSimulationSetup.volumeProfileConfigId,
					},
					(query) =>
						query
							.from(volumeProfileConfigToSimulationSetup)
							.where(eq(volumeProfileConfigToSimulationSetup.simulationSetupId, simulationSetup.id)),
				),
				infoBars: queryJoin(
					db,
					{
						id: informativeBarConfigToSimulationSetup.id,
						informativeBarConfigId: informativeBarConfigToSimulationSetup.informativeBarConfigId,
					},
					(query) =>
						query
							.from(informativeBarConfigToSimulationSetup)
							.where(eq(informativeBarConfigToSimulationSetup.simulationSetupId, simulationSetup.id)),
				),
			})
			.from(simulationSetup)
			.where(eq(simulationSetup.id, input.simulationSetupId))
			.limit(1);

		if (!simulationSetupResult || !simulationSetupResult.infoBars?.length || !simulationSetupResult.volumeProfiles?.length) {
			throw new TRPCError({
				code: 'NOT_FOUND',
			});
		}

		const executionResult = await db.transaction(async (tx) => {
			const [execution] = await tx
				.insert(simulationExecution)
				.values({
					simulationSetupId: input.simulationSetupId,
					simulationRoomId: simulationSetupResult.simulationRoomId,
					startDate: input.startDate,
					tradesToExecute: input.iterations ?? 10,
					aiPrompt: simulationSetupResult.aiPrompt,
					systemPrompt: simulationSetupResult.systemPrompt,
					pair: simulationSetupResult.pair,
					trailingStop: simulationSetupResult.trailingStop,
				})
				.returning();

			if (!execution) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
				});
			}
			await tx.insert(simulationExecutionToVolumeProfileConfig).values(
				simulationSetupResult.volumeProfiles!.map((profile) => ({
					simulationExecutionId: execution.id,
					volumeProfileConfigId: profile.volumeProfileConfigId,
				})),
			);

			await tx.insert(simulationExecutionToInformativeBarConfig).values(
				simulationSetupResult.infoBars!.map((bar) => ({
					simulationExecutionId: execution.id,
					informativeBarConfigId: bar.informativeBarConfigId,
				})),
			);

			return execution;
		});

		return executionResult;
	}),

	list: protectedProcedure.input(z.object({ simulationSetupId: z.string() }).merge(paginatedSchema)).query(async ({ input }) => {
		const db = getDatabase();
		const where: (SQL | undefined)[] = [eq(simulationExecution.simulationSetupId, input.simulationSetupId)];

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
				simulationSetupId: simulationExecution.simulationSetupId,
				simulationRoomId: simulationExecution.simulationRoomId,
				startDate: simulationExecution.startDate,
				aiPrompt: simulationExecution.aiPrompt,
				systemPrompt: simulationExecution.systemPrompt,
				tradesToExecute: simulationExecution.tradesToExecute,
				trailingStop: simulationExecution.trailingStop,
				status: simulationExecution.status,
				stepMinutes: simulationExecution.stepMinutes,
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
};

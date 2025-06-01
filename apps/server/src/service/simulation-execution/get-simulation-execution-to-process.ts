import { queryJoin, queryJoinOne } from '@baron/db/client';
import { SimulationExecutionStatus } from '@baron/db/enum';
import {
	informativeBarConfig,
	simulationExecution,
	simulationExecutionLog,
	simulationExecutionToInformativeBarConfig,
	simulationExecutionToVolumeProfileConfig,
	simulationExecutionTrade,
	volumeProfileConfig,
} from '@baron/db/schema';
import { getDatabase } from '@baron/trpc-server/async-storage/getters';
import { and, count, desc, eq } from 'drizzle-orm';

export async function getSimulationExecutionToProcess(simulationExecutionId: string) {
	const db = getDatabase();
	const [executionConfig] = await db
		.select({
			id: simulationExecution.id,
			startDate: simulationExecution.startDate,
			stepMinutes: simulationExecution.stepMinutes,
			tradesToExecute: simulationExecution.tradesToExecute,
			status: simulationExecution.status,
			pair: simulationExecution.pair,
			aiPrompt: simulationExecution.aiPrompt,
			systemPrompt: simulationExecution.systemPrompt,
			trailingStop: simulationExecution.trailingStop,
			vpc: queryJoin(
				db,
				{
					id: simulationExecutionToVolumeProfileConfig.volumeProfileConfigId,
					vpcId: volumeProfileConfig.id,
					vpcTimeframeUnit: volumeProfileConfig.timeframeUnit,
					vpcTimeframeAmount: volumeProfileConfig.timeframeAmount,
					vpcMaxDeviationPercent: volumeProfileConfig.maxDeviationPercent,
					vpcMinimumBarsToConsider: volumeProfileConfig.minimumBarsToConsider,
					vpcHistoricalTimeToConsiderAmount: volumeProfileConfig.historicalTimeToConsiderAmount,
					vpcVolumeProfilePercentage: volumeProfileConfig.volumeProfilePercentage,
				},
				(query) =>
					query
						.from(simulationExecutionToVolumeProfileConfig)
						.leftJoin(volumeProfileConfig, eq(volumeProfileConfig.id, simulationExecutionToVolumeProfileConfig.volumeProfileConfigId)),
			),
			infoBars: queryJoin(
				db,
				{
					id: informativeBarConfig.id,
					timeframeAmount: informativeBarConfig.timeframeAmount,
					timeframeUnit: informativeBarConfig.timeframeUnit,
					historicalBarsToConsiderAmount: informativeBarConfig.historicalBarsToConsiderAmount,
				},
				(query) =>
					query
						.from(simulationExecutionToInformativeBarConfig)
						.leftJoin(informativeBarConfig, eq(informativeBarConfig.id, simulationExecutionToInformativeBarConfig.informativeBarConfigId)),
			),
			trades: queryJoinOne(
				db,
				{
					count: count(simulationExecutionTrade.id),
				},
				(query) => query.from(simulationExecutionTrade).where(eq(simulationExecutionTrade.simulationExecutionId, simulationExecution.id)),
			),
			lastTrade: queryJoinOne(
				db,
				{
					id: simulationExecutionTrade.id,
					exitDate: simulationExecutionTrade.exitDate,
				},
				(query) =>
					query
						.from(simulationExecutionTrade)
						.where(eq(simulationExecutionTrade.simulationExecutionId, simulationExecution.id))
						.orderBy(desc(simulationExecutionTrade.exitDate))
						.limit(1),
			),
			lastLog: queryJoinOne(db, { id: simulationExecutionLog.id, date: simulationExecutionLog.date }, (query) =>
				query
					.from(simulationExecutionLog)
					.where(eq(simulationExecutionLog.simulationExecutionId, simulationExecution.id))
					.orderBy(desc(simulationExecutionLog.date))
					.limit(1),
			),
		})
		.from(simulationExecution)
		.where(and(eq(simulationExecution.id, simulationExecutionId), eq(simulationExecution.status, SimulationExecutionStatus.Pending)));

	if (
		!executionConfig ||
		!executionConfig.vpc ||
		executionConfig.vpc.length === 0 ||
		!executionConfig.infoBars ||
		executionConfig.infoBars.length === 0
	) {
		throw new Error(`Simulation execution with ID ${simulationExecutionId} not found or not pending.`);
	}

	return executionConfig;
}

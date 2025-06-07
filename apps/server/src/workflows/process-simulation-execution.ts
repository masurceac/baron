import { checkTradeSuccess } from '@/services/check-trade-success';
import { getFrvpProfilesWithDb } from '@/services/get-frvp-profiles-with-db';
import { getDeepSeekResponse } from '@baron/ai/api';
import { getOderSuggestionPromptVariables, openOrderAIResponseJsonOrgSchema, openOrderAiResponseSchema } from '@baron/ai/order-suggestion';
import { fetchBars } from '@baron/bars-api';
import { TimeUnit, TradeDirection, TradeLogDirection, ZoneVolumeProfile } from '@baron/common';
import { getDrizzleClient, queryJoin, queryJoinOne } from '@baron/db/client';
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
import { getStartDate } from '@baron/fixed-range-volume-profile';
import { env, WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';
import { addMinutes, isBefore, sub } from 'date-fns';
import { and, count, desc, eq } from 'drizzle-orm';

type Params = {
	simulationExecutionId: string;
};

export class ProcessSimulationExecutionWorkflow extends WorkflowEntrypoint<Env, {}> {
	override async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		const db = getDrizzleClient(env.DATABASE_CONNECTION_STRING);

		const executionConfig = await step.do('get simulation execution', async () => {
			return await this.getSimulationExecutionConfig(event.payload.simulationExecutionId);
		});

		await step.do('update simulation execution status to running', async () => {
			await db
				.update(simulationExecution)
				.set({
					status: SimulationExecutionStatus.Running,
				})
				.where(eq(simulationExecution.id, executionConfig.id));
		});

		for (let i = 0; i < 1000; i++) {
			const tradeTime = await step.do('get simulation execution start date', async () => {
				const [lastTrade] = await db
					.select({
						exitDate: simulationExecutionTrade.exitDate,
					})
					.from(simulationExecutionTrade)
					.where(eq(simulationExecutionTrade.simulationExecutionId, executionConfig.id))
					.orderBy(desc(simulationExecutionTrade.exitDate))
					.limit(1);
				const [lastLog] = await db

					.select({
						date: simulationExecutionLog.date,
					})
					.from(simulationExecutionLog)
					.where(eq(simulationExecutionLog.simulationExecutionId, executionConfig.id))
					.orderBy(desc(simulationExecutionLog.date))
					.limit(1);

				if (!lastTrade || !lastLog) {
					return new Date(executionConfig.startDate);
				}

				if (isBefore(lastTrade.exitDate, lastLog.date)) {
					return addMinutes(lastLog.date, executionConfig.stepMinutes);
				}

				return addMinutes(lastTrade.exitDate, executionConfig.stepMinutes);
			});

			console.log('Processing ' + event.payload.simulationExecutionId);
			const bars = await step.do(`fetch bars ${tradeTime.toISOString()}`, async () => {
				console.log('fetching bars for time:', tradeTime.toISOString());
				const result = await fetchBars({
					start: sub(tradeTime, {
						minutes: 5,
					}),
					end: tradeTime,
					timeframeAmount: 1,
					timeframeUnit: TimeUnit.Min,
					pair: executionConfig.pair,
				});
				console.log('end bars for time:', tradeTime.toISOString());
				return result;
			});
			const entryPrice = bars[bars.length - 1]?.Close ?? 0;
			if (!executionConfig.vpc || executionConfig.vpc.length === 0) {
				throw new NonRetryableError(`No volume profile configs found for simulation execution ${executionConfig.id}`);
			}

			const vpcList: Array<{
				key: string;
				profiles: ZoneVolumeProfile[];
			}> = [];

			for (const vpc of executionConfig.vpc) {
				const item = await step.do(`get vpc profiles for ${vpc.id}`, async () => {
					const profiles = await getFrvpProfilesWithDb({
						historicalBarsToConsider: vpc.vpcHistoricalTimeToConsiderAmount,
						end: tradeTime,
						pair: executionConfig.pair,
						timeframeUnit: vpc.vpcTimeframeUnit,
						timeframeAmount: vpc.vpcTimeframeAmount,
						maxDeviationPercent: vpc.vpcMaxDeviationPercent,
						minBarsToConsiderConsolidation: vpc.vpcMinimumBarsToConsider,
						volumePercentageRange: vpc.vpcVolumeProfilePercentage,
						currentPrice: bars.at(-1)?.Close ?? 0,
					});
					return {
						key: `${vpc.vpcTimeframeAmount}_${vpc.vpcTimeframeUnit}`,
						profiles,
					};
				});
				vpcList.push(item);
			}

			const infoBars = await step.do(`get informative bars ${tradeTime.toISOString()} ${executionConfig.id}`, async () => {
				if (!executionConfig.infoBars || executionConfig.infoBars.length === 0) {
					throw new NonRetryableError('InfoBars');
				}
				return Promise.all(
					executionConfig.infoBars.map(async (infoBar) => {
						const start = getStartDate(tradeTime, infoBar.timeframeUnit, infoBar.historicalBarsToConsiderAmount);
						console.log(
							`Fetching informative bars for ${infoBar.timeframeAmount} ${infoBar.timeframeUnit} from ${start.toISOString()} to ${tradeTime.toISOString()}`,
						);
						const bars = await fetchBars({
							start,
							end: tradeTime,
							timeframeAmount: infoBar.timeframeAmount,
							timeframeUnit: infoBar.timeframeUnit,
							pair: executionConfig.pair,
						});
						console.log('end');
						return {
							key: `${infoBar.timeframeAmount}_${infoBar.timeframeUnit}`,
							bars,
						};
					}),
				);
			});

			const aiPromptResult = await step.do(`generate AI prompt for simulation execution ${executionConfig.id}`, async () => {
				const previousTrades = await db
					.select()
					.from(simulationExecutionTrade)
					.where(eq(simulationExecutionTrade.simulationExecutionId, executionConfig.id));

				const promptEnd = getOderSuggestionPromptVariables({
					support_resistance_zones: vpcList.reduce((acc, vpc) => ({ ...acc, [vpc.key]: vpc.profiles }), {}),
					price_action_bars: infoBars.reduce((acc, ib) => ({ ...acc, [ib.key]: ib.bars }), {}),
					current_price: Math.trunc(entryPrice * 100) / 100,
					previous_trades: previousTrades,
				});
				const prompt = executionConfig.aiPrompt.concat(`\n${promptEnd}`);
				console.log('Asking AI...');

				const aiResponse = await getDeepSeekResponse({
					prompt,
					apiKey: env.DEEPSEEK_API_KEY_ID,
					responseValidationSchema: openOrderAiResponseSchema,
					responseSchema: openOrderAIResponseJsonOrgSchema,
				});
				if (!aiResponse) {
					throw new Error('AI response is empty or does not contain open_order');
				}

				return aiResponse;
			});

			await step.do('handle prompt result', async () => {});

			if (aiPromptResult.type !== 'hold') {
				await step.do('insert trade', async () => {
					const success = await checkTradeSuccess({
						aiOrder: aiPromptResult,
						pair: executionConfig.pair,
						entryTimestamp: tradeTime.toISOString(),
						entryPrice: entryPrice,
					});

					const [trade] = await db
						.insert(simulationExecutionTrade)
						.values({
							simulationExecutionId: executionConfig.id,
							direction: success.order.aiOrder.type === 'buy' ? TradeDirection.Buy : TradeDirection.Sell,
							entryPrice: entryPrice,
							entryDate: tradeTime,
							exitPrice: success.exitPrice,
							exitDate: new Date(success.timestamp),
							stopLossPrice: success.order.aiOrder.stopLossPrice ?? -1,
							takeProfitPrice: success.order.aiOrder.takeProfitPrice ?? -1,
							balanceResult: success.resultBalance,
							reason: aiPromptResult.reason ?? '',
						})
						.returning();
					await db.insert(simulationExecutionLog).values({
						simulationExecutionId: executionConfig.id,
						direction:
							aiPromptResult.type === 'buy'
								? TradeLogDirection.Buy
								: aiPromptResult.type === 'sell'
									? TradeLogDirection.Sell
									: TradeLogDirection.Hold,
						reason: aiPromptResult.reason ?? '',
						date: tradeTime,
						simulationExecutionTradeId: trade?.id,
					});
				});
			} else {
				await db.insert(simulationExecutionLog).values({
					simulationExecutionId: executionConfig.id,
					direction: TradeLogDirection.Hold,
					reason: aiPromptResult.reason ?? '',
					date: tradeTime,
				});
			}

			const tradesCount = await step.do('get trades count', async () => {
				const tradesCountResult = await db
					.select({ count: count(simulationExecutionTrade.id) })
					.from(simulationExecutionTrade)
					.where(eq(simulationExecutionTrade.simulationExecutionId, executionConfig.id));
				return tradesCountResult[0]?.count ?? 0;
			});

			if (tradesCount >= executionConfig.tradesToExecute) {
				break;
			}
		}

		await db
			.update(simulationExecution)
			.set({
				status: SimulationExecutionStatus.Completed,
			})
			.where(eq(simulationExecution.id, event.payload.simulationExecutionId));

		const instance = await env.SELF_TRAINING_ROOM.get(executionConfig.simulationRoomId);
		if (instance) {
			await instance.sendEvent({ type: 'proceed-execution', payload: {} });
		}
	}

	private async getSimulationExecutionConfig(simulationExecutionId: string) {
		const db = getDrizzleClient(env.DATABASE_CONNECTION_STRING);
		const [executionConfigResult] = await db
			.select({
				id: simulationExecution.id,
				startDate: simulationExecution.startDate,
				stepMinutes: simulationExecution.stepMinutes,
				tradesToExecute: simulationExecution.tradesToExecute,
				status: simulationExecution.status,
				pair: simulationExecution.pair,
				aiPrompt: simulationExecution.aiPrompt,
				trailingStop: simulationExecution.trailingStop,
				simulationRoomId: simulationExecution.simulationRoomId,
				vpc: queryJoin(
					db,
					{
						id: volumeProfileConfig.id,
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
							.leftJoin(volumeProfileConfig, eq(volumeProfileConfig.id, simulationExecutionToVolumeProfileConfig.volumeProfileConfigId))
							.where(eq(simulationExecutionToVolumeProfileConfig.simulationExecutionId, simulationExecution.id)),
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
							.leftJoin(informativeBarConfig, eq(informativeBarConfig.id, simulationExecutionToInformativeBarConfig.informativeBarConfigId))
							.where(eq(simulationExecutionToInformativeBarConfig.simulationExecutionId, simulationExecution.id)),
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
			!executionConfigResult ||
			!executionConfigResult.vpc ||
			executionConfigResult.vpc.length === 0 ||
			!executionConfigResult.infoBars ||
			executionConfigResult.infoBars.length === 0
		) {
			throw new NonRetryableError(`Simulation execution with ID ${simulationExecutionId} not found or not pending.`);
		}

		return executionConfigResult;
	}
}

import { checkTradeSuccess } from '@/services/check-trade-success';
import { getDeepSeekResponse } from '@baron/ai/api';
import { OpenOrderSystemVariables, OpenOrderVariables } from '@baron/ai/prompt';
import { openOrderAIResponseJsonOrgSchema, openOrderAiResponseSchema } from '@baron/ai/schema';
import { fetchBars } from '@baron/bars-api';
import { assertNever, TimeUnit, TradeDirection, TradeLogDirection } from '@baron/common';
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
	zoneVolumeProfile,
} from '@baron/db/schema';
import { getFrvpProfiles } from '@baron/fixed-range-volume-profile';
import { env, WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';
import { add, addMinutes, isBefore, sub } from 'date-fns';
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

		let tradesCount = executionConfig.trades?.count ?? 0;

		if (tradesCount === executionConfig.tradesToExecute) {
			console.log(
				`Simulation execution with ID ${event.payload.simulationExecutionId} already has ${tradesCount} trades, skipping processing.`,
			);
			return;
		}

		let tradeTime = await step.do('get simulation execution start date', async () => {
			const lastTrade = executionConfig.lastTrade?.exitDate
				? add(executionConfig.lastTrade.exitDate, {
						minutes: executionConfig.stepMinutes,
					})
				: null;
			const lastLog = executionConfig.lastLog?.date
				? add(executionConfig.lastLog.date, {
						minutes: executionConfig.stepMinutes,
					})
				: null;

			if (!lastTrade && !lastLog) {
				return executionConfig.startDate;
			}

			if (lastTrade && lastLog) {
				if (isBefore(lastTrade, lastLog)) {
					return lastTrade;
				}
				return lastLog;
			}

			return lastLog ?? executionConfig.startDate;
		});

		while (tradesCount < executionConfig.tradesToExecute) {
			console.log('Processing ' + event.payload.simulationExecutionId);
			const bars = await step.do(`fetch bars ${tradeTime.toISOString()}`, async () => {
				const result = await fetchBars({
					start: sub(tradeTime, {
						minutes: 5,
					}),
					end: tradeTime,
					timeframeAmount: 1,
					timeframeUnit: TimeUnit.Min,
					pair: executionConfig.pair,
				});
				return result;
			});
			const entryPrice = bars[bars.length - 1]?.Close ?? 0;
			if (!executionConfig.vpc || executionConfig.vpc.length === 0) {
				throw new NonRetryableError(`No volume profile configs found for simulation execution ${executionConfig.id}`);
			}
			const vpcList = await Promise.all(
				executionConfig.vpc.map((vpc) =>
					step.do(`get VPC ${vpc.vpcId} ${tradeTime.toISOString()} ${executionConfig.id}`, async () => {
						console.log('Processing VPC:', vpc.vpcId);
						const getStartDate = () => {
							switch (vpc.vpcTimeframeUnit) {
								case TimeUnit.Min:
									return sub(tradeTime, {
										minutes: vpc.vpcHistoricalTimeToConsiderAmount,
									});
								case TimeUnit.Hour:
									return sub(tradeTime, {
										hours: vpc.vpcHistoricalTimeToConsiderAmount,
									});
								case TimeUnit.Day:
									return sub(tradeTime, {
										days: vpc.vpcHistoricalTimeToConsiderAmount,
									});
								case TimeUnit.Week:
									return sub(tradeTime, {
										days: vpc.vpcHistoricalTimeToConsiderAmount,
									});
								case TimeUnit.Month:
									return sub(tradeTime, {
										days: vpc.vpcHistoricalTimeToConsiderAmount,
									});
								default:
									assertNever(vpc.vpcTimeframeUnit);
							}
						};
						const profiles = await getFrvpProfiles(
							{
								start: getStartDate(),
								end: tradeTime,
								pair: executionConfig.pair,
								timeframeUnit: vpc.vpcTimeframeUnit,
								timeframeAmount: vpc.vpcTimeframeAmount,
								maxDeviationPercent: vpc.vpcMaxDeviationPercent,
								minBarsToConsiderConsolidation: vpc.vpcMinimumBarsToConsider,
								volumePercentageRange: vpc.vpcVolumeProfilePercentage,
								currentPrice: bars.at(-1)?.Close ?? 0,
							},
							{
								writeFrvp: async (input) => {
									try {
										await db.insert(zoneVolumeProfile).values({
											volumeAreaHigh: input.zone.VAH,
											volumeAreaLow: input.zone.VAL,
											pointOfControl: input.zone.POC,
											zoneStartAt: input.start,
											zoneEndAt: input.end,
											tradingPair: input.pair,
											timeUnit: input.timeframeUnit,
											timeAmount: input.timeframeAmount,
											maxDeviationPercent: input.maxDeviationPercent,
											minimumBarsToConsider: input.minBarsToConsider,
											volumeProfilePercentage: input.volumePercentageRange,
										});
									} catch (e) {
										console.log(e);
									}
								},
								readFrvp: async (input) => {
									const [exist] = await db
										.select()
										.from(zoneVolumeProfile)
										.where(
											and(
												eq(zoneVolumeProfile.tradingPair, input.pair),
												eq(zoneVolumeProfile.timeUnit, input.timeframeUnit),
												eq(zoneVolumeProfile.timeAmount, input.timeframeAmount),
												eq(zoneVolumeProfile.zoneStartAt, input.start),
												eq(zoneVolumeProfile.zoneEndAt, input.end),
											),
										);
									if (!exist) {
										return null;
									}
									return {
										VAH: exist.volumeAreaHigh,
										VAL: exist.volumeAreaLow,
										POC: exist.pointOfControl,
									};
								},
							},
						);

						return {
							key: `${vpc.vpcTimeframeAmount}_${vpc.vpcTimeframeUnit}`,
							profiles,
						};
					}),
				),
			);

			const infoBars = await step.do(
				`get informative bars ${tradeTime.toISOString()} ${executionConfig.id}`,
				async () => {
					if (!executionConfig.infoBars || executionConfig.infoBars.length === 0) {
						throw new NonRetryableError('InfoBars');
					}
					return Promise.all(
						executionConfig.infoBars.map(async (infoBar) => {
							const start = sub(tradeTime, {
								minutes: infoBar.historicalBarsToConsiderAmount,
							});
							const bars = await fetchBars({
								start,
								end: tradeTime,
								timeframeAmount: infoBar.timeframeAmount,
								timeframeUnit: infoBar.timeframeUnit,
								pair: executionConfig.pair,
							});
							return {
								key: `${infoBar.timeframeAmount}_${infoBar.timeframeUnit}`,
								bars,
							};
						}),
					);
				},
			);

			const aiPromptResult = await step.do(`generate AI prompt for simulation execution ${executionConfig.id}`, async () => {
				const orderKeys: OpenOrderVariables = {
					json_input: JSON.stringify(
						{
							support_resistance_zones: vpcList.reduce((acc, vpc) => ({ ...acc, [vpc.key]: vpc.profiles }), {}),
							bars: infoBars.reduce((acc, ib) => ({ ...acc, [ib.key]: ib.bars }), {}),
							current_price: entryPrice,
						},
						null,
						2,
					),
					response_schema: JSON.stringify(openOrderAIResponseJsonOrgSchema, null, 2),
				};

				const systemKeys: OpenOrderSystemVariables = {
					trading_pair: executionConfig.pair,
				};
				const prompt = Object.keys(orderKeys).reduce(
					(acc, key) => acc.replace(`{{${key}}}`, orderKeys[key as keyof typeof orderKeys]),
					executionConfig.aiPrompt,
				);
				const system = Object.keys(systemKeys).reduce(
					(acc, key) => acc.replace(`{{${key}}}`, systemKeys[key as keyof typeof systemKeys]),
					executionConfig.systemPrompt,
				);
				console.log('Asking AI...');

				const aiResponse = await getDeepSeekResponse({
					prompt,
					system,
					apiKey: env.DEEPSEEK_API_KEY_ID,
					schema: openOrderAiResponseSchema,
				});
				if (!aiResponse) {
					throw new Error('AI response is empty or does not contain open_order');
				}

				return aiResponse;
			});

			await step.do('handle prompt result', async () => {
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
				});
			});

			if (aiPromptResult.type !== 'hold') {
				await step.do('insert trade', async () => {
					const success = await checkTradeSuccess({
						aiOrder: aiPromptResult,
						pair: executionConfig.pair,
						entryTimestamp: tradeTime.toISOString(),
						entryPrice: entryPrice,
					});

					await db.insert(simulationExecutionTrade).values({
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
					});
					tradesCount++;
					tradeTime = addMinutes(new Date(success.timestamp), 1);
				});
			} else {
				tradeTime = addMinutes(tradeTime, executionConfig.stepMinutes);
			}
		}

		await db
			.update(simulationExecution)
			.set({
				status: SimulationExecutionStatus.Completed,
			})
			.where(eq(simulationExecution.id, event.payload.simulationExecutionId));
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
				systemPrompt: simulationExecution.systemPrompt,
				trailingStop: simulationExecution.trailingStop,
				vpc: queryJoin(
					db,
					{
						id: volumeProfileConfig.id,
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

import { getDeepSeekResponse } from '@baron/ai/api';
import { OpenOrderSystemVariables, OpenOrderVariables } from '@baron/ai/prompt';
import { openOrderAIResponseJsonOrgSchema, openOrderAiResponseSchema } from '@baron/ai/schema';
import { fetchBars } from '@baron/bars-api';
import { assertNever, TimeUnit, TradeDirection } from '@baron/common';
import { queryJoin, queryJoinOne } from '@baron/db/client';
import { SimulationExecutionStatus } from '@baron/db/enum';
import {
	informativeBarConfig,
	simulationExecution,
	simulationExecutionToInformativeBarConfig,
	simulationExecutionToVolumeProfileConfig,
	simulationExecutionTrade,
	volumeProfileConfig,
	zoneVolumeProfile,
} from '@baron/db/schema';
import { getFrvpProfiles } from '@baron/fixed-range-volume-profile';
import { getDatabase } from '@baron/trpc-server/async-storage/getters';
import { addMinutes, sub } from 'date-fns';
import { and, count, eq } from 'drizzle-orm';
import { checkTradeSuccess } from './check-trade-success';

export async function processSimulationExecution(simulationExecutionId: string) {
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

	let tradesCount = executionConfig.trades?.count ?? 0;

	if (tradesCount === executionConfig.tradesToExecute) {
		console.log(`Simulation execution with ID ${simulationExecutionId} already has ${tradesCount} trades, skipping processing.`);
		return;
	}

	const getFRVPResult = async (endDate: Date) => {
		if (!executionConfig.vpc || executionConfig.vpc.length === 0) {
			throw 'VPC';
		}
		return Promise.all(
			executionConfig.vpc.map(async (vpc) => {
				console.log('Processing VPC:', vpc.vpcId);
				const getStartDate = () => {
					switch (vpc.vpcTimeframeUnit) {
						case TimeUnit.Min:
							return sub(endDate, {
								minutes: vpc.vpcHistoricalTimeToConsiderAmount,
							});
						case TimeUnit.Hour:
							return sub(endDate, {
								hours: vpc.vpcHistoricalTimeToConsiderAmount,
							});
						case TimeUnit.Day:
							return sub(endDate, {
								days: vpc.vpcHistoricalTimeToConsiderAmount,
							});
						case TimeUnit.Week:
							return sub(endDate, {
								days: vpc.vpcHistoricalTimeToConsiderAmount,
							});
						case TimeUnit.Month:
							return sub(endDate, {
								days: vpc.vpcHistoricalTimeToConsiderAmount,
							});
						default:
							assertNever(vpc.vpcTimeframeUnit);
					}
				};
				const profiles = await getFrvpProfiles(
					{
						start: getStartDate(),
						end: endDate,
						pair: executionConfig.pair,
						timeframeUnit: vpc.vpcTimeframeUnit,
						timeframeAmount: vpc.vpcTimeframeAmount,
						maxDeviationPercent: vpc.vpcMaxDeviationPercent,
						minBarsToConsiderConsolidation: vpc.vpcMinimumBarsToConsider,
						volumePercentageRange: vpc.vpcVolumeProfilePercentage,
					},
					{
						writeFrvp: async (input) => {
							try {
								console.log('inserting');
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
		);
	};

	const getInfoBars = async (endDate: Date) => {
		if (!executionConfig.infoBars || executionConfig.infoBars.length === 0) {
			throw 'InfoBars';
		}
		return await Promise.all(
			executionConfig.infoBars.map(async (infoBar) => {
				const getStart = () => {
					switch (infoBar.timeframeUnit) {
						case TimeUnit.Min:
							return sub(endDate, {
								minutes: infoBar.historicalBarsToConsiderAmount * infoBar.timeframeAmount,
							});
						case TimeUnit.Hour:
							return sub(endDate, {
								hours: infoBar.historicalBarsToConsiderAmount * infoBar.timeframeAmount,
							});
						case TimeUnit.Day:
							return sub(endDate, {
								days: infoBar.historicalBarsToConsiderAmount * infoBar.timeframeAmount,
							});
						case TimeUnit.Week:
							return sub(endDate, {
								days: infoBar.historicalBarsToConsiderAmount * infoBar.timeframeAmount,
							});
						case TimeUnit.Month:
							return sub(endDate, {
								days: infoBar.historicalBarsToConsiderAmount * infoBar.timeframeAmount,
							});
						default:
							assertNever(infoBar.timeframeUnit);
					}
				};

				const bars = await fetchBars({
					start: getStart(),
					end: endDate,
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
	};

	let tradeTime = new Date(executionConfig.startDate);

	while (tradesCount < executionConfig.tradesToExecute) {
		const lastBars = await fetchBars({
			start: sub(tradeTime, {
				minutes: 5,
			}),
			end: tradeTime,
			timeframeAmount: 1,
			timeframeUnit: TimeUnit.Min,
			pair: executionConfig.pair,
		});

		const entryPrice = lastBars[lastBars.length - 1]?.Close ?? 0;

		const vrpList = await getFRVPResult(tradeTime);
		const infoBars = await getInfoBars(tradeTime);
		const orderKeys: OpenOrderVariables = {
			json_input: JSON.stringify(
				{
					support_resistance_zones: vrpList.reduce((acc, vpc) => ({ ...acc, [vpc.key]: vpc.profiles }), {}),
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
			apiKey: 'sk-9aa29761ad444693bda9632ad4558ec8',
			schema: openOrderAiResponseSchema,
		});

		if (!aiResponse) {
			throw new Error('AI response is null or undefined');
		}

		console.log(tradeTime.toISOString());
		console.log(aiResponse);

		if (aiResponse.type !== 'hold') {
			const success = await checkTradeSuccess({
				aiOrder: aiResponse,
				pair: executionConfig.pair,
				entryTimestamp: tradeTime.toISOString(),
				entryPrice: entryPrice,
			});
			console.log(success);

			await db.insert(simulationExecutionTrade).values({
				simulationExecutionId: executionConfig.id,
				direction: success.order.aiOrder.type === 'buy' ? TradeDirection.Buy : TradeDirection.Sell,
				entryPrice: entryPrice,
				entryDate: tradeTime,
				exitPrice: success.exitPrice,
				exitDate: new Date(success.timestamp),
				stopLossPrice: success.order.aiOrder.stopLossPrice!,
				takeProfitPrice: success.order.aiOrder.takeProfitPrice!,
				balanceResult: success.resultBalance,
				reason: aiResponse.reason ?? '',
			});
			tradesCount++;
			tradeTime = addMinutes(new Date(success.timestamp), 1);
		} else {
			console.log('Hold');
			tradeTime = addMinutes(tradeTime, executionConfig.stepMinutes);
		}
	}
}

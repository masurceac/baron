import { checkTradeSuccess } from '@/services/check-trade-success';
import { getFrvpProfilesService } from '@/services/get-frvp-profiles-with-db';
import { getDeepSeekResponse } from '@baron/ai/api';
import { getOderSuggestionPromptVariables, openOrderAIResponseJsonOrgSchema, openOrderAiResponseSchema } from '@baron/ai/order-suggestion';
import { fetchBars } from '@baron/bars-api';
import { TimeUnit, TradeDirection, TradeLogDirection, ZoneVolumeProfile } from '@baron/common';
import { getDrizzleClient } from '@baron/db/client';
import { SimulationExecutionStatus } from '@baron/db/enum';
import {
	informativeBarConfig,
	simulationExecution,
	simulationExecutionIteration,
	simulationExecutionLog,
	simulationExecutionToInformativeBarConfig,
	simulationExecutionToVolumeProfileConfig,
	simulationExecutionTrade,
	simulationRoom,
	volumeProfileConfig,
} from '@baron/db/schema';
import { getStartDate } from '@baron/fixed-range-volume-profile';
import { env, WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';
import { add, addMinutes, sub } from 'date-fns';
import { and, count, desc, eq, gt } from 'drizzle-orm';
import { SimulationIterationgWorkflowArgs } from './types';
import { triggerIteration, triggerSelfTrainingRoom } from './utils';

export class SimulationIterationWorkflow extends WorkflowEntrypoint<Env, {}> {
	override async run(event: WorkflowEvent<SimulationIterationgWorkflowArgs>, step: WorkflowStep) {
		const db = getDrizzleClient(env.DATABASE_CONNECTION_STRING);

		const currentIteration = await step.do(`Retrieve iteration ${event.payload.simulationIterationId}`, async () => {
			const [iteration] = await db
				.select({
					id: simulationExecutionIteration.id,
					simulationExecutionId: simulationExecutionIteration.simulationExecutionId,
					date: simulationExecutionIteration.date,
					simulationExecutionStatus: simulationExecution.status,
				})
				.from(simulationExecutionIteration)
				.innerJoin(simulationExecution, eq(simulationExecution.id, simulationExecutionIteration.simulationExecutionId))
				.where(eq(simulationExecutionIteration.id, event.payload.simulationIterationId));

			if (!iteration) {
				throw new NonRetryableError(`Iteration ${event.payload.simulationIterationId} not found`);
			}

			if (iteration.simulationExecutionStatus !== SimulationExecutionStatus.Running) {
				throw new NonRetryableError(`Simulation ${iteration.simulationExecutionId} is not running`);
			}

			const [olderIteration] = await db
				.select()
				.from(simulationExecutionIteration)
				.where(
					and(
						eq(simulationExecutionIteration.simulationExecutionId, iteration.simulationExecutionId),
						gt(simulationExecutionIteration.date, iteration.date),
					),
				);

			if (olderIteration) {
				throw new NonRetryableError(
					`Iteration ${event.payload.simulationIterationId} is not latest for ${iteration.simulationExecutionId}`,
				);
			}

			return iteration;
		});

		const lastLog = await step.do('Get last log', async () => {
			const [log] = await db
				.select()
				.from(simulationExecutionLog)
				.where(eq(simulationExecutionLog.simulationExecutionId, currentIteration.simulationExecutionId))
				.orderBy(desc(simulationExecutionLog.createdAt))
				.limit(1);

			return log;
		});

		const executionConfig = await step.do(`Get execution config ${simulationExecution.id}`, async () => {
			const [config] = await db
				.select({
					id: simulationExecution.id,
					stepMinutes: simulationExecution.stepMinutes,
					pair: simulationExecution.pair,
					aiPrompt: simulationExecution.aiPrompt,
					tradesToExecute: simulationExecution.tradesToExecute,
					selfTrainingRoom: simulationRoom.selfTraining,
					selfTrainingCycles: simulationRoom.selfTrainingCycles,
					holdPriceEnabled: simulationExecution.holdPriceEnabled,
					simulationRoomId: simulationExecution.simulationRoomId,
				})
				.from(simulationExecution)
				.innerJoin(simulationRoom, eq(simulationRoom.id, simulationExecution.simulationRoomId))
				.where(eq(simulationExecution.id, currentIteration.simulationExecutionId));

			if (!config) {
				throw new NonRetryableError(`Execution ${currentIteration.simulationExecutionId} not found`);
			}

			return config;
		});

		const currentStartTime = await step.do('Get start time', async (): Promise<Date> => {
			const [lastTrade] = await db
				.select({
					exitDate: simulationExecutionTrade.exitDate,
				})
				.from(simulationExecutionTrade)
				.where(
					and(
						eq(simulationExecutionTrade.simulationExecutionId, currentIteration.simulationExecutionId),
						gt(simulationExecutionTrade.exitDate, currentIteration.date),
					),
				)
				.orderBy(desc(simulationExecutionTrade.exitDate))
				.limit(1);

			if (!lastTrade) {
				return currentIteration.date;
			}

			return addMinutes(lastTrade.exitDate, executionConfig.stepMinutes);
		});

		const skipToNext = await step.do('Check if we need to skip to next iteration', async () => {
			if (!executionConfig.holdPriceEnabled) {
				console.log('early return');
				return false;
			}
			if (!lastLog?.holdUntilPriceBreaksUp || !lastLog.holdUntilPriceBreaksDown) {
				return false;
			}

			const timeInOneHour = add(currentStartTime, {
				minutes: 60,
			});
			const bars = await fetchBars({
				start: currentStartTime,
				end: timeInOneHour,
				timeframeAmount: 1,
				timeframeUnit: TimeUnit.Min,
				pair: executionConfig.pair,
			});

			if (!bars?.length) {
				return false;
			}

			if (bars.at(0)?.High! >= lastLog.holdUntilPriceBreaksUp! || bars.at(0)?.Low! <= lastLog.holdUntilPriceBreaksDown!) {
				return false;
			}

			const nextBar = bars.find((b) => b.High >= lastLog.holdUntilPriceBreaksUp! || b.Low <= lastLog.holdUntilPriceBreaksDown!);
			if (nextBar) {
				console.log('Price Found');
				await this.triggerNextIteration({
					simulationExecutionId: currentIteration.simulationExecutionId,
					startTime: new Date(nextBar.Timestamp),
				});
			} else {
				console.log('Price not found, skipping to next hour ' + timeInOneHour.toISOString());
				await this.triggerNextIteration({
					simulationExecutionId: currentIteration.simulationExecutionId,
					startTime: timeInOneHour,
				});
			}
			return true;
		});

		if (skipToNext) {
			return;
		}

		const currentPrice = await step.do(`Get price at ${currentStartTime.toISOString()}`, async () => {
			const result = await fetchBars({
				start: sub(currentStartTime, {
					minutes: 5,
				}),
				end: currentStartTime,
				timeframeAmount: 1,
				timeframeUnit: TimeUnit.Min,
				pair: executionConfig.pair,
			});

			if (!result?.length) {
				throw new NonRetryableError(`No bars found for ${executionConfig.pair} at ${currentStartTime.toISOString()}`);
			}

			const entryPrice = result[result.length - 1]?.Close ?? 0;
			return entryPrice;
		});

		const vpcConfigs = await step.do('Get volume profile configs', async () => {
			return db
				.select({
					id: volumeProfileConfig.id,
					historicalBarsToConsider: volumeProfileConfig.historicalTimeToConsiderAmount,
					timeframeUnit: volumeProfileConfig.timeframeUnit,
					timeframeAmount: volumeProfileConfig.timeframeAmount,
					maxDeviationPercent: volumeProfileConfig.maxDeviationPercent,
					minBarsToConsiderConsolidation: volumeProfileConfig.minimumBarsToConsider,
					volumePercentageRange: volumeProfileConfig.volumeProfilePercentage,
				})
				.from(volumeProfileConfig)
				.innerJoin(
					simulationExecutionToVolumeProfileConfig,
					eq(volumeProfileConfig.id, simulationExecutionToVolumeProfileConfig.volumeProfileConfigId),
				)
				.where(eq(simulationExecutionToVolumeProfileConfig.simulationExecutionId, currentIteration.simulationExecutionId));
		});

		const vpcList: Array<{
			key: string;
			profiles: ZoneVolumeProfile[];
		}> = await step.do('Get VPC profiles', async () => {
			return await Promise.all(
				vpcConfigs.map(async (vpc) => {
					const profiles = await getFrvpProfilesService({
						end: currentStartTime,
						pair: executionConfig.pair,
						historicalBarsToConsider: vpc.historicalBarsToConsider,
						timeframeUnit: vpc.timeframeUnit,
						timeframeAmount: vpc.timeframeAmount,
						maxDeviationPercent: vpc.maxDeviationPercent,
						minBarsToConsiderConsolidation: vpc.minBarsToConsiderConsolidation,
						volumePercentageRange: vpc.volumePercentageRange ?? 70,
						currentPrice: currentPrice,
					});
					return {
						key: `${vpc.timeframeAmount}_${vpc.timeframeUnit}`,
						profiles,
					};
				}),
			);
		});

		const infoBarConfigs = await step.do('Get informative bar configs', async () => {
			return db
				.select({
					id: informativeBarConfig.id,
					timeframeUnit: informativeBarConfig.timeframeUnit,
					timeframeAmount: informativeBarConfig.timeframeAmount,
					historicalBarsToConsiderAmount: informativeBarConfig.historicalBarsToConsiderAmount,
				})
				.from(informativeBarConfig)
				.innerJoin(
					simulationExecutionToInformativeBarConfig,
					eq(informativeBarConfig.id, simulationExecutionToInformativeBarConfig.informativeBarConfigId),
				)
				.where(eq(simulationExecutionToInformativeBarConfig.simulationExecutionId, currentIteration.simulationExecutionId));
		});

		const infoBars = await step.do('get informative bars', async () => {
			if (infoBarConfigs.length === 0) {
				throw new NonRetryableError('Missing info bars');
			}
			return Promise.all(
				infoBarConfigs.map(async (infoBar) => {
					const start = getStartDate(currentStartTime, infoBar.timeframeUnit, infoBar.historicalBarsToConsiderAmount);

					const bars = await fetchBars({
						start,
						end: currentStartTime,
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
		});

		const aiPromptResult = await step.do(`Get AI prompt`, async () => {
			const previousTrades = await db
				.select()
				.from(simulationExecutionTrade)
				.where(eq(simulationExecutionTrade.simulationExecutionId, executionConfig.id));

			const promptEnd = getOderSuggestionPromptVariables({
				support_resistance_zones: vpcList.reduce((acc, vpc) => ({ ...acc, [vpc.key]: vpc.profiles }), {}),
				price_action_bars: infoBars.reduce((acc, ib) => ({ ...acc, [ib.key]: ib.bars }), {}),
				current_price: Math.trunc(currentPrice * 100) / 100,
				previous_trades: previousTrades,
			});
			const prompt = executionConfig.aiPrompt.concat(`\n${promptEnd}`);
			console.log('Asking AI...');

			const aiResponse = await getDeepSeekResponse({
				prompt,
				apiKey: env.DEEPSEEK_API_KEY_ID,
				responseValidationSchema: openOrderAiResponseSchema,
				responseSchema: openOrderAIResponseJsonOrgSchema,
				model: 'deepseek-chat',
			});
			if (!aiResponse) {
				throw new Error('AI response is empty or does not contain open_order');
			}

			return aiResponse;
		});

		if (aiPromptResult.type === 'hold') {
			await step.do('Log hold action', async () => {
				await db.insert(simulationExecutionLog).values({
					simulationExecutionId: executionConfig.id,
					direction: TradeLogDirection.Hold,
					reason: aiPromptResult.reason ?? '',
					date: currentStartTime,
					holdUntilPriceBreaksUp: executionConfig.holdPriceEnabled ? (aiPromptResult.waitUntilPriceBreaksUp ?? null) : null,
					holdUntilPriceBreaksDown: executionConfig.holdPriceEnabled ? (aiPromptResult.waitUntilPriceBreaksDown ?? null) : null,
				});
			});
		} else {
			await step.do('Validate and save trade', async () => {
				const tradeCheckResult = await checkTradeSuccess({
					aiOrder: aiPromptResult,
					pair: executionConfig.pair,
					entryTimestamp: currentStartTime.toISOString(),
					entryPrice: currentPrice,
				});

				const [trade] = await db
					.insert(simulationExecutionTrade)
					.values({
						simulationExecutionId: executionConfig.id,
						direction: tradeCheckResult.order.aiOrder.type === 'buy' ? TradeDirection.Buy : TradeDirection.Sell,
						entryPrice: currentPrice,
						entryDate: currentStartTime,
						exitPrice: tradeCheckResult.exitPrice,
						exitDate: new Date(tradeCheckResult.timestamp),
						stopLossPrice: tradeCheckResult.order.aiOrder.stopLossPrice ?? -1,
						takeProfitPrice: tradeCheckResult.order.aiOrder.takeProfitPrice ?? -1,
						balanceResult: tradeCheckResult.resultBalance,
						reason: aiPromptResult.reason ?? '',
						status: tradeCheckResult.type,
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
					date: currentStartTime,
					simulationExecutionTradeId: trade?.id,
				});
			});
		}

		const tradesHistory = await step.do('Get trades count', async () => {
			const trades = await db
				.select({
					id: simulationExecutionTrade.id,
					balanceResult: simulationExecutionTrade.balanceResult,
				})
				.from(simulationExecutionTrade)
				.where(eq(simulationExecutionTrade.simulationExecutionId, currentIteration.simulationExecutionId));

			return trades;
		});

		const stepCompleted = await step.do('Check completeness', async () => {
			return tradesHistory.length >= executionConfig.tradesToExecute;
		});

		if (stepCompleted) {
			await step.do('Mark simulation as completed', async () => {
				await db
					.update(simulationExecution)
					.set({ status: SimulationExecutionStatus.Completed })
					.where(eq(simulationExecution.id, currentIteration.simulationExecutionId));
				const [completedExecutionsCount] = await db
					.select({ count: count(simulationExecution.id) })
					.from(simulationExecution)
					.where(
						and(
							eq(simulationExecution.status, SimulationExecutionStatus.Completed),
							eq(simulationExecution.simulationRoomId, executionConfig.simulationRoomId),
						),
					);

				const allSimulationsCompleted =
					(completedExecutionsCount?.count ?? 1) % (executionConfig.selfTrainingCycles ?? executionConfig.tradesToExecute) === 0;

				if (executionConfig.selfTrainingRoom && !allSimulationsCompleted && tradesHistory.some((t) => t.balanceResult < 0)) {
					await triggerSelfTrainingRoom(executionConfig.simulationRoomId);
				}
			});
		} else {
			const totalLogs = await step.do('Get total logs count', async () => {
				const [countResult] = await db
					.select({ count: count(simulationExecutionLog.id) })
					.from(simulationExecutionLog)
					.where(eq(simulationExecutionLog.simulationExecutionId, currentIteration.simulationExecutionId));

				return countResult?.count ?? 0;
			});
			if (totalLogs % 500 === 0) {
				await step.do('Logs exceeded maximum 500. Terminating', async () => {
					await db
						.update(simulationExecution)
						.set({ status: SimulationExecutionStatus.LimitReached })
						.where(eq(simulationExecution.id, currentIteration.simulationExecutionId));
				});

				return;
			}
			await step.do('Create and submit next iteration', async () => {
				await this.triggerNextIteration({
					simulationExecutionId: currentIteration.simulationExecutionId,
					startTime: addMinutes(currentStartTime, executionConfig.stepMinutes),
				});
			});
		}
	}

	private async triggerNextIteration(input: { simulationExecutionId: string; startTime: Date }) {
		const db = getDrizzleClient(env.DATABASE_CONNECTION_STRING);
		console.log(`NEXT ${input.startTime.toISOString()}`);
		const [iteration] = await db
			.insert(simulationExecutionIteration)
			.values({
				simulationExecutionId: input.simulationExecutionId,
				date: input.startTime,
			})
			.returning();

		if (!iteration) {
			throw new NonRetryableError('Failed to create next iteration');
		}
		await triggerIteration(iteration.id);
	}
}

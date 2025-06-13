import { checkTradeSuccess } from '@/services/check-trade-success';
import { getDeepSeekResponse, getGeminiAiResponse, getOpenAiResponse } from '@baron/ai/api';
import { getOderSuggestionPromptVariables, openOrderAIResponseJsonOrgSchema, openOrderAiResponseSchema } from '@baron/ai/order-suggestion';
import { fetchBars } from '@baron/bars-api';
import { addTimeUnits, SimulationExecutionStatus, subtractTimeUnits, TimeUnit, TradeDirection, TradeLogDirection } from '@baron/common';
import { getDrizzleClient, queryJoin } from '@baron/db/client';
import {
	informativeBarConfig,
	predefinedFrvp,
	simulationExecution,
	simulationExecutionLog,
	simulationExecutionTrade,
	simulationRoom,
	simulationRoomToInformativeBar,
} from '@baron/db/schema';
import { AiModelEnum, AiModelPriceStrategyEnum, AiModelStrategyEnum } from '@baron/schema';
import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';
import { addMinutes, isAfter, isBefore, sub } from 'date-fns';
import { and, count, desc, eq } from 'drizzle-orm';
import { SimulationRoomExecutionWorkflowParams } from './types';

export class SimulationRoomExecutionWorkflow extends WorkflowEntrypoint<Env, SimulationRoomExecutionWorkflowParams> {
	override async run(event: WorkflowEvent<SimulationRoomExecutionWorkflowParams>, step: WorkflowStep) {
		const db = getDrizzleClient(this.env.DATABASE_CONNECTION_STRING);
		const execution = await step.do('get-simulation-execution', async () => {
			return await this.getSimulationExecution(event.payload.simulationRoomExecutionId);
		});

		const lastLog = await step.do('get-last-log', async () => {
			const [log] = await db
				.select()
				.from(simulationExecutionLog)
				.where(eq(simulationExecutionLog.simulationExecutionId, execution.id))
				.orderBy(desc(simulationExecutionLog.date))
				.limit(1);

			if (!log) {
				return null;
			}

			return log;
		});

		const lastTrade = await step.do('get-last-trade', async () => {
			const [trade] = await db
				.select()
				.from(simulationExecutionTrade)
				.where(eq(simulationExecutionTrade.simulationExecutionId, execution.id))
				.orderBy(desc(simulationExecutionTrade.exitDate))
				.limit(1);

			if (!trade) {
				return null;
			}

			return trade;
		});

		const executionTime = await step.do('Get start time', async (): Promise<Date> => {
			const tradeTime = lastTrade ? lastTrade.exitDate : execution.startDate;
			const logTime = lastLog ? lastLog.date : execution.startDate;

			const getTime = () => {
				if (isAfter(tradeTime, logTime)) {
					return tradeTime;
				}

				return logTime;
			};
			const time = getTime();

			if (!lastTrade && !lastLog) {
				return execution.startDate;
			}

			return addMinutes(time, 1);
		});

		console.log('executionTime', executionTime.toISOString());

		const shouldContinue = await step.do('should continue', async () => {
			const limitDate = addTimeUnits(
				execution.startDate,
				execution.simulationRoom.bulkExecutionsIntervalUnits,
				execution.simulationRoom.bulkExecutionsIntervalAmount,
			);
			console.log('dates below');
			console.log(limitDate.toISOString());
			console.log(executionTime.toISOString());

			return isBefore(executionTime, limitDate);
		});
		if (!shouldContinue) {
			console.log('nah');
			await step.do('update status', async () => {
				await db
					.update(simulationExecution)
					.set({
						status: SimulationExecutionStatus.Completed,
					})
					.where(eq(simulationExecution.id, execution.id));

				const [roomPendingExecutions] = await db
					.select({ count: count(simulationExecution.id) })
					.from(simulationExecution)
					.where(
						and(
							eq(simulationExecution.simulationRoomId, execution.simulationRoom.id),
							eq(simulationExecution.status, SimulationExecutionStatus.Pending),
						),
					);
				if (roomPendingExecutions?.count === 0) {
					await db
						.update(simulationRoom)
						.set({
							status: SimulationExecutionStatus.Completed,
						})
						.where(eq(simulationRoom.id, execution.simulationRoom.id));
				}
			});

			return;
		}

		const infoBars = await step.do('get informative bars', async () => {
			if (execution.infoBars?.length === 0) {
				throw new NonRetryableError('Missing info bars');
			}
			return Promise.all(
				execution.infoBars?.map(async (infoBar) => {
					const start = subtractTimeUnits(executionTime, infoBar.timeframeUnit, infoBar.historicalBarsToConsiderAmount);

					const bars = await fetchBars({
						start,
						end: executionTime,
						timeframeAmount: infoBar.timeframeAmount,
						timeframeUnit: infoBar.timeframeUnit,
						pair: execution.simulationRoom.pair,
					});

					return {
						key: `${infoBar.timeframeAmount}_${infoBar.timeframeUnit}`,
						bars,
					};
				}) ?? [],
			);
		});
		const currentPrice = await step.do(`Get latest price`, async () => {
			const result = await fetchBars({
				start: sub(new Date(), {
					minutes: 5,
				}),
				end: addMinutes(new Date(), 10),
				timeframeAmount: 1,
				timeframeUnit: TimeUnit.Min,
				pair: execution.simulationRoom.pair,
			});

			if (!result?.length) {
				throw new NonRetryableError(`No bars found for`);
			}

			const entryPrice = result[result.length - 1]?.Close ?? 0;
			return entryPrice;
		});

		const aiPromptResult = await step.do(`${execution.simulationRoom.name}: Asking AI prompt`, async () => {
			const promptEnd = getOderSuggestionPromptVariables({
				support_resistance_zones: execution.predefinedFrvp.profiles,
				price_action_bars: infoBars.reduce((acc, ib) => ({ ...acc, [ib.key]: ib.bars }), {}),
				current_price: Math.trunc(currentPrice * 100) / 100,
			});
			const prompt = execution.simulationRoom.aiPrompt.concat(`\n${promptEnd}`);

			console.log('Asking AI....');

			const prompts = await Promise.all(
				execution.simulationRoom.aiModels.map(async (aiModel) => {
					switch (aiModel.type) {
						case AiModelEnum.DeepSeek: {
							return getDeepSeekResponse({
								prompt,
								apiKey: this.env.DEEPSEEK_API_KEY_ID,
								responseValidationSchema: openOrderAiResponseSchema,
								responseSchema: openOrderAIResponseJsonOrgSchema,
								model: aiModel.model,
							});
						}
						case AiModelEnum.OpenAI: {
							return getOpenAiResponse({
								prompt,
								apiKey: this.env.OPENAI_API_KEY,
								responseValidationSchema: openOrderAiResponseSchema,
								responseSchema: openOrderAIResponseJsonOrgSchema,
								model: aiModel.model,
							});
						}
						case AiModelEnum.Gemini: {
							return getGeminiAiResponse({
								prompt,
								apiKey: this.env.GOOGLE_GEMINI_API_KEY,
								responseValidationSchema: openOrderAiResponseSchema,
								responseSchema: openOrderAIResponseJsonOrgSchema,
								model: aiModel.model,
							});
						}
					}
				}),
			);

			if (prompts.some((p) => !p)) {
				throw new Error('AI response is empty or does not contain open_order');
			}

			return prompts as Exclude<(typeof prompts)[number], null | undefined>[];
		});

		const getPositionToOpen = await step.do(`Get position to open`, async () => {
			const getPrices = (items: typeof aiPromptResult) => {
				const stopLossPrice =
					aiModelPriceStrategy === AiModelPriceStrategyEnum.Min
						? Math.min(...items.map((p) => p.stopLossPrice!))
						: aiModelPriceStrategy === AiModelPriceStrategyEnum.Max
							? Math.max(...items.map((p) => p.stopLossPrice!))
							: items.reduce((acc, p) => acc + p.stopLossPrice!, 0) / items.length;
				const takeProfitPrice =
					aiModelPriceStrategy === AiModelPriceStrategyEnum.Min
						? Math.min(...items.map((p) => p.takeProfitPrice!))
						: aiModelPriceStrategy === AiModelPriceStrategyEnum.Max
							? Math.max(...items.map((p) => p.takeProfitPrice!))
							: items.reduce((acc, p) => acc + p.takeProfitPrice!, 0) / items.length;
				return {
					stopLossPrice,
					takeProfitPrice,
				};
			};

			const aiModelStrategy = execution.simulationRoom.aiModelStrategy;
			const aiModelPriceStrategy = execution.simulationRoom.aiModelPriceStrategy;
			if (aiModelStrategy === AiModelStrategyEnum.And) {
				const shouldBuy = aiPromptResult.every((p) => p.type === TradeLogDirection.Buy);
				if (shouldBuy) {
					const prices = getPrices(aiPromptResult);
					return {
						...prices,
						type: TradeLogDirection.Buy,
					};
				}

				const shouldSell = aiPromptResult.every((p) => p.type === TradeLogDirection.Sell);
				if (shouldSell) {
					const prices = getPrices(aiPromptResult);
					return {
						...prices,
						type: TradeLogDirection.Sell,
					};
				}

				return null;
			}

			if (aiModelStrategy === AiModelStrategyEnum.Or) {
				const someBuy = aiPromptResult.some((p) => p.type === TradeLogDirection.Buy);
				const someSell = aiPromptResult.some((p) => p.type === TradeLogDirection.Sell);

				if (someBuy && someSell) {
					return null;
				}
				if (someBuy) {
					const prices = getPrices(aiPromptResult.filter((p) => p.type === TradeLogDirection.Buy));
					return {
						...prices,
						type: TradeLogDirection.Buy,
					};
				}

				if (someSell) {
					const prices = getPrices(aiPromptResult.filter((p) => p.type === TradeLogDirection.Sell));
					return {
						...prices,
						type: TradeLogDirection.Sell,
					};
				}

				return null;
			}

			return null;
		});

		if (!getPositionToOpen) {
			await step.do('create hold log', async () => {
				await db.insert(simulationExecutionLog).values({
					simulationExecutionId: execution.id,
					date: executionTime,
					direction: TradeLogDirection.Hold,
					reason: aiPromptResult.at(0)?.reason ?? '',
				});
			});
		} else {
			await step.do('create trade log', async () => {
				const tradeCheckResult = await checkTradeSuccess({
					aiOrder: getPositionToOpen,
					pair: execution.simulationRoom.pair,
					entryTimestamp: executionTime.toISOString(),
					entryPrice: currentPrice,
				});
				const [trade] = await db
					.insert(simulationExecutionTrade)
					.values({
						simulationExecutionId: execution.id,
						direction: tradeCheckResult.order.aiOrder.type === 'buy' ? TradeDirection.Buy : TradeDirection.Sell,
						entryPrice: currentPrice,
						entryDate: executionTime,
						exitPrice: tradeCheckResult.exitPrice,
						exitDate: new Date(tradeCheckResult.timestamp),
						stopLossPrice: tradeCheckResult.order.aiOrder.stopLossPrice ?? -1,
						takeProfitPrice: tradeCheckResult.order.aiOrder.takeProfitPrice ?? -1,
						balanceResult: tradeCheckResult.resultBalance,
						reason: aiPromptResult.at(0)?.reason ?? '',
						status: tradeCheckResult.type,
					})
					.returning();

				await db.insert(simulationExecutionLog).values({
					simulationExecutionId: execution.id,
					direction:
						getPositionToOpen.type === 'buy'
							? TradeLogDirection.Buy
							: getPositionToOpen.type === 'sell'
								? TradeLogDirection.Sell
								: TradeLogDirection.Hold,
					reason: aiPromptResult.at(0)?.reason ?? '',
					date: executionTime,
					simulationExecutionTradeId: trade?.id,
				});
			});
		}

		// schedule next
		await step.do('schedule next', async () => {
			await this.env.SIMULATION_ROOM_EXECUTION_WORKFLOW.create({
				params: {
					simulationRoomExecutionId: execution.id,
				} satisfies SimulationRoomExecutionWorkflowParams,
			});
		});
	}

	async getSimulationExecution(id: string) {
		const db = getDrizzleClient(this.env.DATABASE_CONNECTION_STRING);
		const [execution] = await db
			.select({
				id: simulationExecution.id,
				startDate: simulationExecution.startDate,
				simulationRoom: simulationRoom,
				predefinedFrvp: predefinedFrvp,
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
							.from(simulationRoomToInformativeBar)
							.innerJoin(informativeBarConfig, eq(informativeBarConfig.id, simulationRoomToInformativeBar.informativeBarConfigId))
							.where(eq(simulationRoomToInformativeBar.simulationRoomId, simulationRoom.id)),
				),
			})
			.from(simulationExecution)
			.innerJoin(simulationRoom, eq(simulationExecution.simulationRoomId, simulationRoom.id))
			.innerJoin(predefinedFrvp, eq(predefinedFrvp.id, simulationRoom.predefinedFrvpId))
			.where(eq(simulationExecution.id, id));

		if (!execution) {
			throw new NonRetryableError('Simulation execution not found');
		}

		return execution;
	}
}

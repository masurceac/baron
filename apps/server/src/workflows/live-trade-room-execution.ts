import { getDeepSeekResponse, getGeminiAiResponse, getOpenAiResponse } from '@baron/ai/api';
import { getOderSuggestionPromptVariables, openOrderAIResponseJsonOrgSchema, openOrderAiResponseSchema } from '@baron/ai/order-suggestion';
import { fetchBars } from '@baron/bars-api';
import { SimulationExecutionStatus, subtractTimeUnits, TimeUnit, TradeDirection, TradeLogDirection } from '@baron/common';
import { getDrizzleClient, queryJoin } from '@baron/db/client';
import {
	informativeBarConfig,
	liveTradingRoom,
	liveTradingRoomLog,
	liveTradingRoomSignal,
	liveTradingRoomToInformativeBarConfig,
	predefinedFrvp,
} from '@baron/db/schema';
import { AiModelEnum, AiModelPriceStrategyEnum, AiModelStrategyEnum } from '@baron/schema';
import { env, WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';
import { add, sub } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import { LiveTradeRoomExecutionWorkflowParams } from './types';

export class LiveTradeRoomExecutionWorkflow extends WorkflowEntrypoint<Env, LiveTradeRoomExecutionWorkflowParams> {
	override async run(event: WorkflowEvent<LiveTradeRoomExecutionWorkflowParams>, step: WorkflowStep) {
		const db = getDrizzleClient(this.env.DATABASE_CONNECTION_STRING);
		const roomDetails = await step.do('get-trading-room', async () => {
			return await this.getLiveTradeRoom(event.payload.tradeRoomId);
		});

		const executionTime = new Date();

		console.log('executionTime', executionTime.toISOString());

		const infoBars = await step.do('get informative bars', async () => {
			if (roomDetails.infoBars?.length === 0) {
				throw new NonRetryableError('Missing info bars');
			}
			return Promise.all(
				roomDetails.infoBars?.map(async (infoBar) => {
					const start = subtractTimeUnits(executionTime, infoBar.timeframeUnit, infoBar.historicalBarsToConsiderAmount);

					const bars = await fetchBars({
						start,
						end: executionTime,
						timeframeAmount: infoBar.timeframeAmount,
						timeframeUnit: infoBar.timeframeUnit,
						pair: roomDetails.tradingRoom.pair,
						alpaca: {
							keyId: env.ALPACA_KEY_ID!,
							secretKey: env.ALPACA_SECRET_KEY!,
						},
					});

					return {
						key: `${infoBar.timeframeAmount}_${infoBar.timeframeUnit}`,
						bars,
					};
				}) ?? [],
			);
		});
		const currentPrice = await step.do(`Get price at ${executionTime.toISOString()}`, async () => {
			const result = await fetchBars({
				start: sub(executionTime, {
					minutes: 5,
				}),
				end: add(executionTime, { minutes: 5 }),
				timeframeAmount: 1,
				timeframeUnit: TimeUnit.Min,
				pair: roomDetails.tradingRoom.pair,
				alpaca: {
					keyId: env.ALPACA_KEY_ID!,
					secretKey: env.ALPACA_SECRET_KEY!,
				},
			});

			if (!result?.length) {
				throw new NonRetryableError(`No bars found for ${roomDetails.tradingRoom.pair} at ${executionTime.toISOString()}`);
			}

			const entryPrice = result[result.length - 1]?.Close ?? 0;
			return entryPrice;
		});

		console.log('currentPrice');
		console.log(currentPrice);

		const aiPromptResult = await step.do(`${roomDetails.tradingRoom.name}: Asking AI prompt`, async () => {
			// todo: share with simulation room workflow
			const promptEnd = getOderSuggestionPromptVariables({
				support_resistance_zones: roomDetails.predefinedFrvp.profiles,
				price_action_bars: infoBars.reduce((acc, ib) => ({ ...acc, [ib.key]: ib.bars }), {}),
				current_price: Math.trunc(currentPrice * 100) / 100,
			});
			const prompt = roomDetails.tradingRoom.aiPrompt.concat(`\n${promptEnd}`);

			console.log('Asking AI....');

			const prompts = await Promise.all(
				roomDetails.tradingRoom.aiModels.map(async (aiModel) => {
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

		console.log(aiPromptResult);

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

			const aiModelStrategy = roomDetails.tradingRoom.aiModelStrategy;
			const aiModelPriceStrategy = roomDetails.tradingRoom.aiModelPriceStrategy;
			if (aiModelStrategy === AiModelStrategyEnum.And) {
				const shouldBuy = aiPromptResult.every((p) => p.type === TradeLogDirection.Buy);
				if (shouldBuy) {
					const prices = getPrices(aiPromptResult);
					return {
						...prices,
						type: TradeDirection.Buy,
					};
				}

				const shouldSell = aiPromptResult.every((p) => p.type === TradeLogDirection.Sell);
				if (shouldSell) {
					const prices = getPrices(aiPromptResult);
					return {
						...prices,
						type: TradeDirection.Sell,
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
						type: TradeDirection.Buy,
					};
				}

				if (someSell) {
					const prices = getPrices(aiPromptResult.filter((p) => p.type === TradeLogDirection.Sell));
					return {
						...prices,
						type: TradeDirection.Sell,
					};
				}

				return null;
			}

			return null;
		});

		await db.insert(liveTradingRoomLog).values({
			liveTradingRoomId: roomDetails.tradingRoom.id,
			suggestions: aiPromptResult,
		});

		if (getPositionToOpen) {
			await db.insert(liveTradingRoomSignal).values({
				liveTradingRoomId: roomDetails.tradingRoom.id,
				suggestions: aiPromptResult,
			});

			await step.do('send signal', async () => {
				const durableObject = await this.env.TRADE_ROOM_DO.idFromName(roomDetails.tradingRoom.id);
				const stub = await this.env.TRADE_ROOM_DO.get(durableObject);
				stub.emitEnterTradeEvent({
					trade: {
						...getPositionToOpen,
						pair: roomDetails.tradingRoom.pair,
						reason: aiPromptResult.map((p) => p.reason).join('\nEND REASON\n'),
					},
				});
			});
		}

		await step.sleep('wait 1 minute', '1 minute');
		// schedule next
		await step.do('schedule next', async () => {
			await this.env.LIVE_TRADE_ROOM_EXECUTION_WORKFLOW.create({
				params: {
					tradeRoomId: roomDetails.tradingRoom.id,
				} satisfies LiveTradeRoomExecutionWorkflowParams,
			});
		});
	}

	async getLiveTradeRoom(id: string) {
		const db = getDrizzleClient(this.env.DATABASE_CONNECTION_STRING);
		const [tradeRoom] = await db
			.select({
				tradingRoom: liveTradingRoom,
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
							.from(liveTradingRoomToInformativeBarConfig)
							.innerJoin(informativeBarConfig, eq(informativeBarConfig.id, liveTradingRoomToInformativeBarConfig.informativeBarConfigId))
							.where(eq(liveTradingRoomToInformativeBarConfig.liveTradingRoomId, liveTradingRoom.id)),
				),
			})
			.from(liveTradingRoom)
			.innerJoin(predefinedFrvp, eq(predefinedFrvp.id, liveTradingRoom.predefinedFrvpId))
			.where(and(eq(liveTradingRoom.id, id), eq(liveTradingRoom.status, SimulationExecutionStatus.Running)));

		if (!tradeRoom) {
			throw new NonRetryableError('Conditions not met');
		}

		return tradeRoom;
	}
}

import { getDrizzleClient } from '@baron/db/client';
import {
	informativeBarConfig,
	orderSetup,
	orderSetupLog,
	orderSetupToInformativeBarConfig,
	orderSetupToVolumeProfileConfig,
	volumeProfileConfig,
} from '@baron/db/schema';
import { cancelOrder, getFuturesOpenOrder, getFuturesPosition, openMarketFuturesOrderWithTPSL, setLeverage } from '@baron/order-api';
import { env, WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';
import { desc, eq } from 'drizzle-orm';
import { OrderPlacementWorkflowArgs } from './types';
import { getFrvpProfilesService } from '@/services/get-frvp-profiles-with-db';
import { TimeUnit, TradeDirection, TradeLogDirection, TradingStrategyStatus, ZoneVolumeProfile } from '@baron/common';
import { fetchBars } from '@baron/bars-api';
import { addMinutes, sub } from 'date-fns';
import { getStartDate } from '@baron/fixed-range-volume-profile';
import { getOderSuggestionPromptVariables, openOrderAIResponseJsonOrgSchema, openOrderAiResponseSchema } from '@baron/ai/order-suggestion';
import { getDeepSeekResponse, getGrokResponse, getOpenAiResponse } from '@baron/ai/api';

export class OrderPlacementWorkflow extends WorkflowEntrypoint<Env, {}> {
	override async run(event: WorkflowEvent<OrderPlacementWorkflowArgs>, step: WorkflowStep) {
		const db = getDrizzleClient(env.DATABASE_CONNECTION_STRING);
		console.log('Running OrderPlacementWorkflow');
		const setup = await step.do('Get order setup', async () => {
			return this.getOrderSetup(event.payload.orderSetupId);
		});

		const orderActive = await step.do('check order active', async () => {
			const position = await getFuturesPosition({
				pair: setup.pair,
				keys: {
					apiKey: setup.settings.settings.apiKey,
					apiSecret: setup.settings.settings.apiSecret,
				},
			});

			if (position) {
				return true;
			}

			const order = await getFuturesOpenOrder({
				pair: setup.pair,
				keys: {
					apiKey: setup.settings.settings.apiKey,
					apiSecret: setup.settings.settings.apiSecret,
				},
			});
			if (order) {
				await cancelOrder({
					pair: setup.pair,
					clientOrderId: order.clientOrderId,
					keys: {
						apiKey: setup.settings.settings.apiKey,
						apiSecret: setup.settings.settings.apiSecret,
					},
				});
			}

			return false;
		});

		if (orderActive) {
			await step.do('order already active. Exiting', async () => {
				console.log('Order already active. Exiting');
			});
			return;
		}

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
				.innerJoin(orderSetupToVolumeProfileConfig, eq(volumeProfileConfig.id, orderSetupToVolumeProfileConfig.volumeProfileConfigId))
				.where(eq(orderSetupToVolumeProfileConfig.orderSetupId, setup.id));
		});
		const currentPrice = await step.do(`Get latest price`, async () => {
			const result = await fetchBars({
				start: sub(new Date(), {
					minutes: 5,
				}),
				end: addMinutes(new Date(), 1),
				timeframeAmount: 1,
				timeframeUnit: TimeUnit.Min,
				pair: setup.pair,
			});

			if (!result?.length) {
				throw new NonRetryableError(`No bars found for`);
			}

			const entryPrice = result[result.length - 1]?.Close ?? 0;
			return entryPrice;
		});
		const vpcList: Array<{
			key: string;
			profiles: ZoneVolumeProfile[];
		}> = await step.do('Get VPC profiles', async () => {
			return await Promise.all(
				vpcConfigs.map(async (vpc) => {
					const profiles = await getFrvpProfilesService({
						end: addMinutes(new Date(), 1),
						pair: setup.pair,
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
				.innerJoin(orderSetupToInformativeBarConfig, eq(informativeBarConfig.id, orderSetupToInformativeBarConfig.informativeBarConfigId))
				.where(eq(orderSetupToInformativeBarConfig.orderSetupId, setup.id));
		});


		console.log(JSON.stringify(vpcList, null, 2));
		const infoBars = await step.do('get informative bars', async () => {
			if (infoBarConfigs.length === 0) {
				throw new NonRetryableError('Missing info bars');
			}
			return Promise.all(
				infoBarConfigs.map(async (infoBar) => {
					const start = getStartDate(addMinutes(new Date(), 1), infoBar.timeframeUnit, infoBar.historicalBarsToConsiderAmount);

					const bars = await fetchBars({
						start,
						end: addMinutes(new Date(), 1),
						timeframeAmount: infoBar.timeframeAmount,
						timeframeUnit: infoBar.timeframeUnit,
						pair: setup.pair,
					});

					return {
						key: `${infoBar.timeframeAmount}_${infoBar.timeframeUnit}`,
						bars,
					};
				}),
			);
		});

		const previousTrades = await step.do('Get previous trades', async () => {
			return db
				.select()
				.from(orderSetupLog)
				.where(eq(orderSetupLog.orderSetupId, setup.id))
				.orderBy(desc(orderSetupLog.createdAt))
				.limit(10);
		});

		const aiPromptResult = await step.do(`${setup.name}: Asking AI prompt`, async () => {
			const promptEnd = getOderSuggestionPromptVariables({
				support_resistance_zones: vpcList.reduce((acc, vpc) => ({ ...acc, [vpc.key]: vpc.profiles }), {}),
				price_action_bars: infoBars.reduce((acc, ib) => ({ ...acc, [ib.key]: ib.bars }), {}),
				current_price: Math.trunc(currentPrice * 100) / 100,
				previous_trades: previousTrades,
			});
			const prompt = setup.aiPrompt.concat(`\n${promptEnd}`);

			console.log('Asking AI....');

			const deepSeekResponse = await getDeepSeekResponse({
				prompt,
				apiKey: env.DEEPSEEK_API_KEY_ID,
				responseValidationSchema: openOrderAiResponseSchema,
				responseSchema: openOrderAIResponseJsonOrgSchema,
				model: 'deepseek-chat',
			});

			if (deepSeekResponse?.type === 'hold') {
				return [deepSeekResponse];
			}

			console.log('Confirming The Trade....');
			const prompts = await Promise.all([
				getOpenAiResponse({
					prompt,
					apiKey: env.OPENAI_API_KEY,
					responseValidationSchema: openOrderAiResponseSchema,
					responseSchema: openOrderAIResponseJsonOrgSchema,
					model: 'gpt-4.1',
				}),
				deepSeekResponse,
				// getGrokResponse({
				// 	prompt,
				// 	apiKey: env.GROK_API_KEY,
				// 	responseValidationSchema: openOrderAiResponseSchema,
				// 	responseSchema: openOrderAIResponseJsonOrgSchema,
				// 	model: 'grok-3',
				// }),
				// getGeminiAiResponse({
				// 	prompt,
				// 	apiKey: env.GOOGLE_GEMINI_API_KEY,
				// 	responseValidationSchema: openOrderAiResponseSchema,
				// 	responseSchema: openOrderAIResponseJsonOrgSchema,
				// 	model: 'gemini-2.5-pro-preview-06-05',
				// }),
			]);

			if (prompts.some((p) => !p)) {
				throw new Error('AI response is empty or does not contain open_order');
			}

			return prompts as Exclude<(typeof prompts)[number], null | undefined>[];
		});

		const haveSameDirection =
			aiPromptResult.every((p) => p.type === TradeLogDirection.Buy) || aiPromptResult.every((p) => p.type === TradeLogDirection.Sell);
		if (haveSameDirection && aiPromptResult.every((p) => p.stopLossPrice && p.takeProfitPrice)) {
			const direction = aiPromptResult[0]!.type === TradeLogDirection.Buy ? TradeDirection.Buy : TradeDirection.Sell;
			// average
			const stopLoss = aiPromptResult.reduce((acc, p) => acc + (p.stopLossPrice ?? 0), 0) / aiPromptResult.length;
			const takeProfit = aiPromptResult.reduce((acc, p) => acc + (p.takeProfitPrice ?? 0), 0) / aiPromptResult.length;

			const inPosition = await step.do('Ensure no active position', async () => {
				const position = await getFuturesPosition({
					pair: setup.pair,
					keys: {
						apiKey: setup.settings.settings.apiKey,
						apiSecret: setup.settings.settings.apiSecret,
					},
				});
				if (position) {
					return true;
				}
				return false;
			});
			if (inPosition) {
				return;
			}
			await step.do('Place order ', async () => {
				console.log('Placing order ' + setup.name, aiPromptResult);
				try {
					await setLeverage({
						pair: setup.pair,
						leverage: setup.leverage,
						keys: {
							apiKey: setup.settings.settings.apiKey,
							apiSecret: setup.settings.settings.apiSecret,
						},
					});
					const quantity = Math.trunc(((setup.positionSizeUsd * setup.leverage) / currentPrice) * 1000) / 1000;
					const order = await openMarketFuturesOrderWithTPSL({
						pair: setup.pair,
						quantity: quantity,
						direction: direction,
						stopLossPrice: stopLoss,
						takeProfitPrice: takeProfit,
						keys: {
							apiKey: setup.settings.settings.apiKey,
							apiSecret: setup.settings.settings.apiSecret,
						},
					});
					await db.insert(orderSetupLog).values({
						orderSetupId: setup.id,
						direction: direction,
						reason: aiPromptResult.map((i) => i.reason + '\n END REASON\n').join('') ?? 'No reason provided',
						stopLossPrice: stopLoss,
						takeProfitPrice: takeProfit,
						remoteOrderId: order.clientOrderId,
						currentPrice: currentPrice,
					});
					return order;
				} catch (error) {
					console.error('Unable to place order');
					console.error(error);
					throw new NonRetryableError(`Unable to place order`);
				}
			});
		} else {
			await step.do('Hold order', async () => {
				console.log('Holding for now. No order placed.');
			});
		}
		aiPromptResult.forEach((p) => console.log(p));
		console.log(currentPrice);
	}

	private async getOrderSetup(orderSetupId: string) {
		const db = getDrizzleClient(env.DATABASE_CONNECTION_STRING);
		const [setupResult] = await db.select().from(orderSetup).where(eq(orderSetup.id, orderSetupId)).limit(1);
		if (!setupResult) {
			throw new NonRetryableError(`Order setup ${orderSetupId} not found.`);
		}
		if (setupResult.status !== TradingStrategyStatus.Running) {
			throw new NonRetryableError(`Order setup ${orderSetupId} is not in a running state.`);
		}
		return setupResult;
	}
}

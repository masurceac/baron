import { getDrizzleClient } from '@baron/db/client';
import {
	informativeBarConfig,
	orderSetup,
	orderSetupToInformativeBarConfig,
	orderSetupToVolumeProfileConfig,
	volumeProfileConfig,
} from '@baron/db/schema';
import { getFuturesOpenOrder, getFuturesPosition, openMarketFuturesOrder, setLeverage } from '@baron/order-api';
import { env, WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';
import { eq } from 'drizzle-orm';
import { OrderPlacementWorkflowArgs } from './types';
import { getFrvpProfilesWithDb } from '@/services/get-frvp-profiles-with-db';
import { TimeUnit, TradeDirection, TradeLogDirection, ZoneVolumeProfile } from '@baron/common';
import { fetchBars } from '@baron/bars-api';
import { sub } from 'date-fns';
import { getStartDate } from '@baron/fixed-range-volume-profile';
import { getOderSuggestionPromptVariables, openOrderAIResponseJsonOrgSchema, openOrderAiResponseSchema } from '@baron/ai/order-suggestion';
import { getDeepSeekResponse } from '@baron/ai/api';

export class OrderPlacementWorkflow extends WorkflowEntrypoint<Env, {}> {
	override async run(event: WorkflowEvent<OrderPlacementWorkflowArgs>, step: WorkflowStep) {
		const db = getDrizzleClient(env.DATABASE_CONNECTION_STRING);
		console.log('Running OrderPlacementWorkflow');
		const setup = await step.do('get simulation room', async () => {
			return this.getOrderSetup(event.payload.orderSetupId);
		});
		const orderActive = await step.do('check order active', async () => {
			const order = await getFuturesOpenOrder({
				pair: setup.pair,
				keys: {
					apiKey: setup.settings.settings.apiKey,
					apiSecret: setup.settings.settings.apiSecret,
				},
			});
			if (order) {
				return true;
			}
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
				end: new Date(),
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
					const profiles = await getFrvpProfilesWithDb({
						end: new Date(),
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

		const infoBars = await step.do('get informative bars', async () => {
			if (infoBarConfigs.length === 0) {
				throw new NonRetryableError('Missing info bars');
			}
			return Promise.all(
				infoBarConfigs.map(async (infoBar) => {
					const start = getStartDate(new Date(), infoBar.timeframeUnit, infoBar.historicalBarsToConsiderAmount);

					const bars = await fetchBars({
						start,
						end: new Date(),
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

		const aiPromptResult = await step.do(`Get AI prompt`, async () => {
			const promptEnd = getOderSuggestionPromptVariables({
				support_resistance_zones: vpcList.reduce((acc, vpc) => ({ ...acc, [vpc.key]: vpc.profiles }), {}),
				price_action_bars: infoBars.reduce((acc, ib) => ({ ...acc, [ib.key]: ib.bars }), {}),
				current_price: Math.trunc(currentPrice * 100) / 100,
				previous_trades: [],
			});
			const prompt = setup.aiPrompt.concat(`\n${promptEnd}`);
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
		if (aiPromptResult.type !== TradeLogDirection.Hold) {
			await step.do('Place order', async () => {
				console.log('Placing order', aiPromptResult);
				await setLeverage({
					pair: setup.pair,
					leverage: setup.leverage,
					keys: {
						apiKey: setup.settings.settings.apiKey,
						apiSecret: setup.settings.settings.apiSecret,
					},
				});

				const order = await openMarketFuturesOrder({
					pair: setup.pair,
					quantity: 1,
					direction: aiPromptResult.type === 'buy' ? TradeDirection.Buy : TradeDirection.Sell,
					keys: {
						apiKey: setup.settings.settings.apiKey,
						apiSecret: setup.settings.settings.apiSecret,
					},
				});
				return order;
			});
		} else {
			await step.do('Hold order', async () => {
				console.log('Holding order, no action taken');
			});
		}
	}

	private async getOrderSetup(orderSetupId: string) {
		const db = getDrizzleClient(env.DATABASE_CONNECTION_STRING);
		const [setupResult] = await db.select().from(orderSetup).where(eq(orderSetup.id, orderSetupId)).limit(1);
		if (!setupResult) {
			throw new NonRetryableError(`Order setup ${orderSetupId} not found.`);
		}
		if (setupResult.status !== 'running') {
			throw new NonRetryableError(`Order setup ${orderSetupId} is not in a running state.`);
		}
		return setupResult;
	}
}

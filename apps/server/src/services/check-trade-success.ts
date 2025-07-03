import { OpenOrderAiResponse } from '@baron/ai/order-suggestion';
import { fetchBars } from '@baron/bars-api';
import { TimeUnit, TradeResult, TradingPair } from '@baron/common';
import { env } from 'cloudflare:workers';
import { add } from 'date-fns';

type TradeType = {
	aiOrder: Pick<OpenOrderAiResponse, 'type' | 'takeProfitPrice' | 'stopLossPrice'>;
	entryPrice: number;
	entryTimestamp: string;
	loopNumber?: number;
	pair: TradingPair;
	trailingStop?: boolean;
};
export async function checkTradeSuccess(order: TradeType): Promise<{
	order: TradeType;
	type: TradeResult;
	timestamp: string;
	exitPrice: number;
	resultBalance: number;
}> {
	let stopLossPrice: number = order.aiOrder.stopLossPrice ?? 0;
	let takeProfitPrice: number = order.aiOrder.takeProfitPrice ?? 0;

	if (order.aiOrder.type === 'hold' || !takeProfitPrice || !stopLossPrice) {
		throw 'Order is not valid for success check';
	}
	let referencePrice = order.entryPrice;

	const trailingEnd = add(new Date(order.entryTimestamp), { hours: 3 });

	const bars = await fetchBars({
		start: new Date(order.entryTimestamp),
		end: trailingEnd,
		timeframeAmount: 1,
		timeframeUnit: TimeUnit.Min,
		pair: order.pair,
		alpaca: {
			keyId: env.ALPACA_KEY_ID!,
			secretKey: env.ALPACA_SECRET_KEY!,
		},
		polygon: {
			keyId: '',
		},
	});
	for (const bar of bars) {
		const barTimestamp = new Date(bar.Timestamp).getTime();
		const entryTimestamp = new Date(order.entryTimestamp).getTime();

		// Check if the bar is after the entry timestamp
		if (barTimestamp <= entryTimestamp) {
			continue;
		}

		// Check for success conditions based on order direction
		if (order.aiOrder.type === 'buy') {
			if (bar.Low <= stopLossPrice) {
				const balance = stopLossPrice - referencePrice;
				return {
					order: order,
					type: balance > 0 ? TradeResult.Success : TradeResult.Failure,
					timestamp: bar.Timestamp,
					exitPrice: stopLossPrice,
					resultBalance: balance,
				};
			} else if (bar.High >= takeProfitPrice) {
				return {
					order: order,
					type: TradeResult.Success,
					timestamp: bar.Timestamp,
					exitPrice: takeProfitPrice,
					resultBalance: takeProfitPrice - referencePrice,
				};
			}
			if (order.trailingStop) {
				const priceMovingInRightDirection = bar.High > referencePrice;
				if (priceMovingInRightDirection) {
					const highDelta = Math.abs(bar.High - referencePrice);
					referencePrice = bar.High;
					takeProfitPrice += highDelta;
					stopLossPrice += highDelta;
				}
			}
		} else if (order.aiOrder.type === 'sell') {
			if (bar.High >= stopLossPrice) {
				const balance = referencePrice - stopLossPrice;
				return {
					order: order,
					type: balance > 0 ? TradeResult.Success : TradeResult.Failure,
					timestamp: bar.Timestamp,
					exitPrice: stopLossPrice,
					resultBalance: balance,
				};
			} else if (bar.Low <= takeProfitPrice) {
				return {
					order: order,
					type: TradeResult.Success,
					timestamp: bar.Timestamp,
					exitPrice: takeProfitPrice,
					resultBalance: referencePrice - takeProfitPrice,
				};
			}
			if (order.trailingStop) {
				const priceMovingInRightDirection = bar.Low < referencePrice;
				if (priceMovingInRightDirection) {
					const lowDelta = Math.abs(bar.Low - referencePrice);
					referencePrice = bar.Low;
					takeProfitPrice -= lowDelta;
					stopLossPrice -= lowDelta;
				}
			}
		}
	}

	if (order.loopNumber && order.loopNumber > 8) {
		return {
			order: order,
			type: TradeResult.Unknown,
			timestamp: bars.at(-1)?.Timestamp!,
			exitPrice: bars.at(-1)?.Close ?? 0,
			resultBalance: 0,
		};
	}

	const nestedResult = await checkTradeSuccess({
		...order,
		aiOrder: {
			...order.aiOrder,
			stopLossPrice,
			takeProfitPrice,
		},
		entryPrice: referencePrice,
		loopNumber: (order.loopNumber || 0) + 1,
		entryTimestamp: trailingEnd.toISOString(),
	});
	if (nestedResult) {
		return nestedResult;
	}

	throw 'No success or failure condition met within the provided bars';
}

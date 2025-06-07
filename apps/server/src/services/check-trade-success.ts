import { OpenOrderAiResponse } from '@baron/ai/order-suggestion';
import { fetchBars } from '@baron/bars-api';
import { TimeUnit, TradeResult, TradingPair } from '@baron/common';
import { add } from 'date-fns';

type TradeType = {
	aiOrder: OpenOrderAiResponse;
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
	if (order.loopNumber && order.loopNumber > 8) {
		throw 'Loop limit exceeded';
	}

	if (order.aiOrder.type === 'hold' || !order.aiOrder.takeProfitPrice || !order.aiOrder.stopLossPrice) {
		throw 'Order is not valid for success check';
	}

	let trailingStop = order.aiOrder.stopLossPrice;
	let trailingStep = Math.abs(order.entryPrice - order.aiOrder.stopLossPrice) * (order.aiOrder.type === 'buy' ? 1 : -1);

	const trailingEnd = add(new Date(order.entryTimestamp), { hours: 3 });

	console.log('Checking success for order');
	console.log(order);

	const bars = await fetchBars({
		start: new Date(order.entryTimestamp),
		end: trailingEnd,
		timeframeAmount: 1,
		timeframeUnit: TimeUnit.Min,
		pair: order.pair,
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
			if (bar.High >= order.aiOrder.takeProfitPrice) {
				return {
					order: order,
					type: TradeResult.Success,
					timestamp: bar.Timestamp,
					exitPrice: order.aiOrder.takeProfitPrice,
					resultBalance: order.aiOrder.takeProfitPrice - order.entryPrice,
				};
			} else if (bar.Low <= order.aiOrder.stopLossPrice) {
				const balance = order.aiOrder.stopLossPrice - order.entryPrice;
				return {
					order: order,
					type: balance > 0 ? TradeResult.Success : TradeResult.Failure,
					timestamp: bar.Timestamp,
					exitPrice: order.aiOrder.stopLossPrice,
					resultBalance: balance,
				};
			}
			if (order.trailingStop) {
				if (bar.High > trailingStop - trailingStep) {
					trailingStop = bar.High - trailingStep;
					order.aiOrder.stopLossPrice = trailingStop;
				}
			}
		} else if (order.aiOrder.type === 'sell') {
			if (bar.Low <= order.aiOrder.takeProfitPrice) {
				return {
					order: order,
					type: TradeResult.Success,
					timestamp: bar.Timestamp,
					exitPrice: order.aiOrder.takeProfitPrice,
					resultBalance: order.entryPrice - order.aiOrder.takeProfitPrice,
				};
			} else if (bar.High >= order.aiOrder.stopLossPrice) {
				const balance = order.entryPrice - order.aiOrder.stopLossPrice;
				return {
					order: order,
					type: balance > 0 ? TradeResult.Success : TradeResult.Failure,
					timestamp: bar.Timestamp,
					exitPrice: order.aiOrder.stopLossPrice,
					resultBalance: balance,
				};
			}
			if (order.trailingStop) {
				if (bar.Low < trailingStop) {
					trailingStop = bar.Low + trailingStep;
					order.aiOrder.stopLossPrice = trailingStop;
				}
			}
		}
	}
	const nestedResult = await checkTradeSuccess({
		...order,
		loopNumber: (order.loopNumber || 0) + 1,
		entryTimestamp: trailingEnd.toISOString(),
	});
	if (nestedResult) {
		return nestedResult;
	}

	throw 'No success or failure condition met within the provided bars';
}

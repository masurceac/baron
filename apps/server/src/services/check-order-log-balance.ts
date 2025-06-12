import { getDatabase } from '@/database';
import { orderSetup, orderSetupLog } from '@baron/db/schema';
import { checkTradeSuccess } from './check-trade-success';
import { eq } from 'drizzle-orm';
import { TradeDirection } from '@baron/common';

export async function checkOrderLogBalance() {
	const db = getDatabase();

	const logs = await db.select().from(orderSetupLog).innerJoin(orderSetup, eq(orderSetup.id, orderSetupLog.orderSetupId));

	for (const log of logs) {
		try {
			const s = await checkTradeSuccess({
				aiOrder: {
					type: log.order_setup_log.direction === TradeDirection.Buy ? 'buy' : 'sell',
					takeProfitPrice: log.order_setup_log.takeProfitPrice,
					stopLossPrice: log.order_setup_log.stopLossPrice,
				},
				entryPrice: log.order_setup_log.currentPrice,
				entryTimestamp: log.order_setup_log.createdAt.toISOString(),
				pair: log.order_setup.pair,
			});
			await db.update(orderSetupLog).set({
				balanceResult: s.resultBalance,
			});
		} catch (e) {}
	}
}

import { OrderPlacementWorkflowArgs } from '@/workflows/types';
import { TradingStrategyStatus } from '@baron/common';
import { getDrizzleClient } from '@baron/db/client';
import { orderSetup } from '@baron/db/schema';
import { createId } from '@paralleldrive/cuid2';
import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';

export async function cronHandler(): Promise<void> {
	const db = getDrizzleClient(env.DATABASE_CONNECTION_STRING);

	const runningOrderSetups = await db.select().from(orderSetup).where(eq(orderSetup.status, TradingStrategyStatus.Running));
	for (const setup of runningOrderSetups) {
		const s = await env.ORDER_PLACEMENT_WORKFLOW.create({
			id: createId(),
			params: {
				orderSetupId: setup.id,
			} satisfies OrderPlacementWorkflowArgs,
		});
		console.log(await s.status());
	}
	console.log('finish');
}

import { TradingStrategyStatus } from '@baron/common';
import { getDrizzleClient } from '@baron/db/client';
import { orderSetup } from '@baron/db/schema';
import { createId } from '@paralleldrive/cuid2';
import { env, WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import { OrderPlacementWorkflowArgs } from './types';
import { eq } from 'drizzle-orm';

export class OrderPlacementTriggerWorkflow extends WorkflowEntrypoint<Env, {}> {
	override async run(_: WorkflowEvent<{}>, step: WorkflowStep) {
		const db = getDrizzleClient(env.DATABASE_CONNECTION_STRING);

		for (let i = 0; i < 1000; i++) {
			console.log('Running OrderPlacementTriggerWorkflow iteration', i);
			await step.do('Handle order placement', async () => {
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
			});
			await step.sleep('Wait 2 minutes', '2 minute');
		}
	}
}

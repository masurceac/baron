import { createId } from '@paralleldrive/cuid2';
import { env } from 'cloudflare:workers';

export async function triggerOrderPlacement(): Promise<void> {
	if (env.ENV === 'local') {
		console.log('Placement trigger');
		const r = await env.ORDER_PLACEMENT_TRIGGER.create({
			id: createId(),
			params: {},
		});
		console.log(await r.status());
		console.log('finish');
	}
}

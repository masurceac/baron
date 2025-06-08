import { createId } from '@paralleldrive/cuid2';
import { env } from 'cloudflare:workers';
import { SelfTrainingRoomWorkflowArgs, SimulationIterationgWorkflowArgs } from './types';

const getExistingWorkflow = async (workflowId: string) => {
	try {
		const workflow = await env.SIMULATION_ITERATION_WORKFLOW.get(workflowId);
		return workflow;
	} catch {
		return null;
	}
};

export async function triggerIteration(iterationId: string) {
	const iterationExists = await getExistingWorkflow(iterationId);
	if (iterationExists) {
		const { status } = await iterationExists.status();
		if (status === 'errored' || status === 'complete') {
			await env.SIMULATION_ITERATION_WORKFLOW.create({
				id: `${iterationId}-retried-${createId()}`,
				params: {
					simulationIterationId: iterationId,
				} satisfies SimulationIterationgWorkflowArgs,
			});
		}
	} else {
		await env.SIMULATION_ITERATION_WORKFLOW.create({
			id: iterationId,
			params: {
				simulationIterationId: iterationId,
			} satisfies SimulationIterationgWorkflowArgs,
		});
	}
}

export async function triggerSelfTrainingRoom(roomId: string) {
	await env.SELF_TRAINING_ROOM.create({
		id: createId(),
		params: {
			simulationRoomId: roomId,
		} satisfies SelfTrainingRoomWorkflowArgs,
	});
}

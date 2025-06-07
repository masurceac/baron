import { createId } from '@paralleldrive/cuid2';
import { env } from 'cloudflare:workers';
import { SelfTrainingRoomWorkflowArgs, SimulationIterationgWorkflowArgs } from './types';

export async function triggerIteration(iterationId: string) {
	await env.SIMULATION_ITERATION_WORKFLOW.create({
		id: iterationId,
		params: {
			simulationIterationId: iterationId,
		} satisfies SimulationIterationgWorkflowArgs,
	});
}

export async function triggerSelfTrainingRoom(roomId: string) {
	await env.SELF_TRAINING_ROOM.create({
		id: createId(),
		params: {
			simulationRoomId: roomId,
		} satisfies SelfTrainingRoomWorkflowArgs,
	});
}

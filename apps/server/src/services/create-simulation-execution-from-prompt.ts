import { getDatabase } from '@/database';
import { runSimulation } from '@/services/run-simulation';
import {
	simulationExecutionToInformativeBarConfig,
	simulationExecutionToVolumeProfileConfig,
	simulationRoom,
	volumeProfileConfig,
} from '@baron/db/schema';
import { TRPCError } from '@trpc/server';
import { eq, inArray } from 'drizzle-orm';

export async function createSimulationExecutionFromPrompt(input: { simulationRoomId: string; prompt: string }) {
	const db = getDatabase();

	const [simulationRoomResult] = await db.select().from(simulationRoom).where(eq(simulationRoom.id, input.simulationRoomId));
	const linkedVP = await db
		.select({
			volumeProfileConfigId: simulationExecutionToVolumeProfileConfig.volumeProfileConfigId,
		})
		.from(simulationExecutionToVolumeProfileConfig)
		.where(eq(simulationExecutionToVolumeProfileConfig.simulationExecutionId, input.simulationRoomId));
	const linkedInfoBars = await db
		.select({
			informativeBarConfigId: simulationExecutionToInformativeBarConfig.informativeBarConfigId,
		})
		.from(simulationExecutionToInformativeBarConfig)
		.where(eq(simulationExecutionToInformativeBarConfig.simulationExecutionId, input.simulationRoomId));
	const vpcList = await db
		.select()
		.from(volumeProfileConfig)
		.where(
			inArray(
				volumeProfileConfig.id,
				linkedVP.map((v) => v.volumeProfileConfigId),
			),
		);

	if (!simulationRoomResult) {
		throw new TRPCError({
			code: 'NOT_FOUND',
		});
	}

	await runSimulation({
		aiPrompt: input.prompt,
		simulationRoomId: simulationRoomResult.id,
		startDate: simulationRoomResult.startDate,
		pair: simulationRoomResult.pair,
		tradesToExecute: simulationRoomResult.tradesToExecute,
		trailingStop: simulationRoomResult.trailingStop,
		vpcIds: vpcList.map((vpc) => vpc.id),
		name: simulationRoomResult.name + ' - AI Test',
		infoBarIds: linkedInfoBars.map((i) => i.informativeBarConfigId),
	});

	return true;
}

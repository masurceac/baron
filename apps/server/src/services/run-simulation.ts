import { getDatabase } from '@/database';
import { queryJoin } from '@baron/db/client';
import {
	simulationExecution,
	simulationExecutionToInformativeBarConfig,
	simulationExecutionToVolumeProfileConfig,
	simulationRoom,
	simulationRoomToInformativeBar,
	simulationRoomToVolumeProfileConfig,
} from '@baron/db/schema';
import { simulationRunSchema } from '@baron/schema';
import { TRPCError } from '@trpc/server';
import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export async function runSimulation(input: z.infer<typeof simulationRunSchema>) {
	const db = getDatabase();

	const [roomResult] = await db
		.select({
			id: simulationRoom.id,
			aiPrompt: simulationRoom.aiPrompt,
			pair: simulationRoom.pair,
			trailingStop: simulationRoom.trailingStop,
			volumeProfiles: queryJoin(
				db,
				{
					id: simulationRoomToVolumeProfileConfig.id,
					volumeProfileConfigId: simulationRoomToVolumeProfileConfig.volumeProfileConfigId,
				},
				(query) =>
					query
						.from(simulationRoomToVolumeProfileConfig)
						.where(eq(simulationRoomToVolumeProfileConfig.simulationRoomId, simulationRoom.id)),
			),
			infoBars: queryJoin(
				db,
				{
					id: simulationRoomToInformativeBar.id,
					informativeBarConfigId: simulationRoomToInformativeBar.informativeBarConfigId,
				},
				(query) => query.from(simulationRoomToInformativeBar).where(eq(simulationRoomToInformativeBar.simulationRoomId, simulationRoom.id)),
			),
		})
		.from(simulationRoom)
		.where(eq(simulationRoom.id, input.simulationRoomId))
		.limit(1);

	if (!roomResult || !roomResult.infoBars?.length || !roomResult.volumeProfiles?.length) {
		throw new TRPCError({
			code: 'NOT_FOUND',
		});
	}

	const executionResult = await db.transaction(async (tx) => {
		const [execution] = await tx
			.insert(simulationExecution)
			.values({
				simulationRoomId: roomResult.id,
				startDate: input.startDate,
				tradesToExecute: input.tradesToExecute ?? 10,
				aiPrompt: input.aiPrompt,
				pair: input.pair,
				trailingStop: input.trailingStop ?? false,
				name: input.name.trim(),
			})
			.returning();

		if (!execution) {
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
			});
		}
		await tx.insert(simulationExecutionToVolumeProfileConfig).values(
			roomResult.volumeProfiles!.map((profile) => ({
				simulationExecutionId: execution.id,
				volumeProfileConfigId: profile.volumeProfileConfigId,
			})),
		);

		await tx.insert(simulationExecutionToInformativeBarConfig).values(
			roomResult.infoBars!.map((bar) => ({
				simulationExecutionId: execution.id,
				informativeBarConfigId: bar.informativeBarConfigId,
			})),
		);

		return execution;
	});

	await env.PROCESS_SIMULATION_EXECUTION.create({
		id: executionResult.id,
		params: {
			simulationExecutionId: executionResult.id,
		},
	});

	return executionResult;
}

import { getDatabase } from '@/database';
import { paginate, paginatedSchema } from '@baron/common';
import { queryJoin } from '@baron/db/client';
import {
	informativeBarConfig,
	simulationRoom,
	simulationRoomToInformativeBar,
	simulationRoomToVolumeProfileConfig,
	volumeProfileConfig,
} from '@baron/db/schema';
import { simulationRoomSchema } from '@baron/schema';
import { protectedProcedure } from '@baron/trpc-server';
import { getAuth, getClerkClient } from '@baron/trpc-server/async-storage/getters';
import { TRPCError } from '@trpc/server';
import { env } from 'cloudflare:workers';
import { and, count, desc, eq, ilike, inArray, SQL } from 'drizzle-orm';
import { z } from 'zod';

export const simulationRoomRouter = {
	create: protectedProcedure.input(simulationRoomSchema).mutation(async ({ input }) => {
		const db = getDatabase();

		const [existingSimulation] = await db
			.select({ id: simulationRoom.id })
			.from(simulationRoom)
			.where(eq(simulationRoom.name, input.name))
			.limit(1);

		if (existingSimulation) {
			throw new TRPCError({
				code: 'CONFLICT',
				message: 'A simulation room with the same name already exists.',
			});
		}

		const auth = getAuth();
		const user = await getClerkClient().users.getUser(auth.userId!);

		const roomResult = await db.transaction(async (tx) => {
			const [room] = await tx
				.insert(simulationRoom)
				.values({
					name: input.name.trim(),
					description: input.description.trim(),
					authorId: user.id,
					authorName: user.fullName ?? user.username ?? 'Unknown User',
					aiPrompt: input.aiPrompt.trim(),
					pair: input.pair,
					trailingStop: input.trailingStop ?? false,
					selfTraining: input.selfTraining ?? false,
					startDate: input.startDate,
					tradesToExecute: input.tradesToExecute,
				})
				.returning();

			if (!room) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
				});
			}

			const vpcs = await tx
				.select({ id: volumeProfileConfig.id })
				.from(volumeProfileConfig)
				.where(inArray(volumeProfileConfig.id, input.vpcIds));

			if (vpcs.length !== input.vpcIds.length) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'One or more VPCs not found',
				});
			}

			const infoBarsSetup = await tx
				.select({ id: informativeBarConfig.id })
				.from(informativeBarConfig)
				.where(inArray(informativeBarConfig.id, input.infoBarIds));

			if (infoBarsSetup.length !== input.infoBarIds.length) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'One or more informative bars not found',
				});
			}
			await tx.insert(simulationRoomToVolumeProfileConfig).values(
				input.vpcIds.map((vpcId) => ({
					simulationRoomId: room.id,
					volumeProfileConfigId: vpcId,
				})),
			);

			await tx.insert(simulationRoomToInformativeBar).values(
				input.infoBarIds.map((infoBarId) => ({
					simulationRoomId: room.id,
					informativeBarConfigId: infoBarId,
				})),
			);

			return room;
		});

		if (!roomResult) {
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
			});
		}
		console.log('roomResult.selfTraining');
		console.log(roomResult.selfTraining);

		if (roomResult.selfTraining) {
			console.log('self training');
			await env.SELF_TRAINING_ROOM.create({
				id: roomResult.id,
				params: {
					simulationRoomId: roomResult.id,
				},
			});
		}

		return roomResult;
	}),

	edit: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				data: simulationRoomSchema,
			}),
		)
		.mutation(async ({ input }) => {
			const db = getDatabase();
			const { id, data } = input;
			const [roomData] = await db
				.select({
					id: simulationRoom.id,
				})
				.from(simulationRoom)
				.where(eq(simulationRoom.id, id))
				.limit(1);
			if (!roomData) {
				throw new TRPCError({
					code: 'NOT_FOUND',
				});
			}

			const updatedSimulation = await db.transaction(async (tx) => {
				const [updatedRoom] = await tx
					.update(simulationRoom)
					.set({
						name: data.name.trim(),
						description: data.description.trim(),
						aiPrompt: data.aiPrompt.trim(),
						pair: data.pair,
						trailingStop: data.trailingStop ?? false,
					})
					.where(eq(simulationRoom.id, id))
					.returning();

				if (!updatedRoom) {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
					});
				}

				const vpcs = await tx
					.select({ id: volumeProfileConfig.id })
					.from(volumeProfileConfig)
					.where(inArray(volumeProfileConfig.id, data.vpcIds));

				if (vpcs.length !== data.vpcIds.length) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'One or more VPCs not found',
					});
				}

				const infoBarsSetup = await tx
					.select({ id: informativeBarConfig.id })
					.from(informativeBarConfig)
					.where(inArray(informativeBarConfig.id, data.infoBarIds));

				if (infoBarsSetup.length !== data.infoBarIds.length) {
					throw new TRPCError({
						code: 'NOT_FOUND',
						message: 'One or more informative bars not found',
					});
				}

				await tx.delete(simulationRoomToVolumeProfileConfig).where(eq(simulationRoomToVolumeProfileConfig.simulationRoomId, id));
				await tx.delete(simulationRoomToInformativeBar).where(eq(simulationRoomToInformativeBar.simulationRoomId, id));

				await tx.insert(simulationRoomToVolumeProfileConfig).values(
					data.vpcIds.map((vpcId) => ({
						simulationRoomId: id,
						volumeProfileConfigId: vpcId,
					})),
				);
				await tx.insert(simulationRoomToInformativeBar).values(
					data.infoBarIds.map((infoBarId) => ({
						simulationRoomId: id,
						informativeBarConfigId: infoBarId,
					})),
				);
				return updatedRoom;
			});

			return updatedSimulation;
		}),

	get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
		const db = getDatabase();
		const [room] = await db
			.select({
				id: simulationRoom.id,
				name: simulationRoom.name,
				description: simulationRoom.description,
				createdAt: simulationRoom.createdAt,
				authorId: simulationRoom.authorId,
				authorName: simulationRoom.authorName,
				aiPrompt: simulationRoom.aiPrompt,
				pair: simulationRoom.pair,
				trailingStop: simulationRoom.trailingStop,
				vpcIds: queryJoin(db, { id: volumeProfileConfig.id }, (query) =>
					query
						.from(simulationRoomToVolumeProfileConfig)
						.innerJoin(volumeProfileConfig, eq(simulationRoomToVolumeProfileConfig.volumeProfileConfigId, volumeProfileConfig.id))
						.where(eq(simulationRoomToVolumeProfileConfig.simulationRoomId, simulationRoom.id)),
				),
				infoBarIds: queryJoin(db, { id: informativeBarConfig.id }, (query) =>
					query
						.from(simulationRoomToInformativeBar)
						.innerJoin(informativeBarConfig, eq(simulationRoomToInformativeBar.informativeBarConfigId, informativeBarConfig.id))
						.where(eq(simulationRoomToInformativeBar.simulationRoomId, simulationRoom.id)),
				),
			})
			.from(simulationRoom)
			.where(eq(simulationRoom.id, input.id))
			.limit(1);

		if (!room) {
			throw new TRPCError({
				code: 'NOT_FOUND',
			});
		}
		return room;
	}),

	list: protectedProcedure
		.input(
			z
				.object({
					search: z.string().optional(),
				})
				.merge(paginatedSchema),
		)
		.query(async ({ input }) => {
			const db = getDatabase();

			const where: (SQL | undefined)[] = [];
			if (input.search) {
				where.push(ilike(simulationRoom.name, `%${input.search}%`));
			}

			return paginate({
				skip: input.skip,
				take: input.take,
				maxTake: 100,
				count: async () => {
					const query = db
						.select({ count: count(simulationRoom.id) })
						.from(simulationRoom)
						.where(and(...where));

					const result = await query;
					return result[0]?.count ?? 0;
				},
				query: async ({ take, skip }) => {
					return db
						.select({
							id: simulationRoom.id,
							createdAt: simulationRoom.createdAt,
							name: simulationRoom.name,
							description: simulationRoom.description,
							authorId: simulationRoom.authorId,
							authorName: simulationRoom.authorName,
						})
						.from(simulationRoom)
						.where(and(...where))
						.orderBy(desc(simulationRoom.createdAt))
						.limit(take)
						.offset(skip);
				},
			});
		}),

	delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
		const db = getDatabase();

		const deletedRoom = await db.delete(simulationRoom).where(eq(simulationRoom.id, input.id)).returning();

		if (!deletedRoom || deletedRoom.length === 0) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Room not found',
			});
		}

		return deletedRoom[0];
	}),

	proceedTraining: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
		const workflow = await env.SELF_TRAINING_ROOM.get(input.id);

		if (!workflow) {
			await env.SELF_TRAINING_ROOM.create({
				id: input.id,
				params: {
					simulationRoomId: input.id,
				},
			});
		} else {
			await workflow.sendEvent({
				type: 'proceed-execution',
				payload: {},
			});
			try {
				await workflow.resume();
			} catch (error) {
				console.error('Error resuming workflow:');
				console.error(error);
			}
		}

		return true;
	}),
};

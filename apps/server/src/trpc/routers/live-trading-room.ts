import { getDatabase } from '@/database';
import { LiveTradeRoomExecutionWorkflowParams } from '@/workflows/types';
import { paginate, paginatedSchema, SimulationExecutionStatus } from '@baron/common';
import { queryJoin } from '@baron/db/client';
import { informativeBarConfig, liveTradingRoom, liveTradingRoomToInformativeBarConfig, predefinedFrvp, liveTradingRoomSignal } from '@baron/db/schema';
import { liveTradingRoomSchema } from '@baron/schema';
import { protectedProcedure } from '@baron/trpc-server';
import { TRPCError } from '@trpc/server';
import { env } from 'cloudflare:workers';
import { and, count, desc, eq, ilike, inArray, SQL } from 'drizzle-orm';
import { z } from 'zod';
import { checkTradeSuccess } from '@/services/check-trade-success';
import { fetchBars } from '@baron/bars-api';
import { TimeUnit } from '@baron/common';
import { sub } from 'date-fns';

export const liveTradingRoomRouter = {
	create: protectedProcedure.input(liveTradingRoomSchema).mutation(async ({ input }) => {
		const db = getDatabase();

		const [existingRoom] = await db
			.select({ id: liveTradingRoom.id })
			.from(liveTradingRoom)
			.where(eq(liveTradingRoom.name, input.name))
			.limit(1);

		if (existingRoom) {
			throw new TRPCError({
				code: 'CONFLICT',
				message: 'A live trading room with the same name already exists.',
			});
		}

		const roomResult = await db.transaction(async (tx) => {
			const [room] = await tx
				.insert(liveTradingRoom)
				.values({
					name: input.name.trim(),
					pair: input.pair,
					aiPrompt: input.aiPrompt.trim(),
					aiModels: input.aiModels,
					aiModelStrategy: input.aiModelStrategy,
					aiModelPriceStrategy: input.aiModelPriceStrategy,
					predefinedFrvpId: input.predefinedFrvpId,
				})
				.returning();

			if (!room) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
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

			await tx.insert(liveTradingRoomToInformativeBarConfig).values(
				input.infoBarIds.map((infoBarId) => ({
					liveTradingRoomId: room.id,
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

		return roomResult;
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
				where.push(ilike(liveTradingRoom.name, `%${input.search}%`));
			}

			return paginate({
				skip: input.skip,
				take: input.take,
				maxTake: 100,
				count: async () => {
					const query = db
						.select({ count: count(liveTradingRoom.id) })
						.from(liveTradingRoom)
						.where(and(...where));

					const result = await query;
					return result[0]?.count ?? 0;
				},
				query: async ({ take, skip }) => {
					return db
						.select({
							id: liveTradingRoom.id,
							createdAt: liveTradingRoom.createdAt,
							name: liveTradingRoom.name,
							pair: liveTradingRoom.pair,
							status: liveTradingRoom.status,
							aiPrompt: liveTradingRoom.aiPrompt,
							aiModels: liveTradingRoom.aiModels,
							aiModelStrategy: liveTradingRoom.aiModelStrategy,
							aiModelPriceStrategy: liveTradingRoom.aiModelPriceStrategy,
							infoBarIds: queryJoin(db, { id: informativeBarConfig.id }, (query) =>
								query
									.from(liveTradingRoomToInformativeBarConfig)
									.innerJoin(
										informativeBarConfig,
										eq(liveTradingRoomToInformativeBarConfig.informativeBarConfigId, informativeBarConfig.id),
									)
									.where(eq(liveTradingRoomToInformativeBarConfig.liveTradingRoomId, liveTradingRoom.id)),
							),
						})
						.from(liveTradingRoom)
						.where(and(...where))
						.orderBy(desc(liveTradingRoom.createdAt))
						.limit(take)
						.offset(skip);
				},
			});
		}),

	get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
		const db = getDatabase();
		const [room] = await db
			.select({
				liveTradingRoom: liveTradingRoom,
				infoBarIds: queryJoin(db, { id: informativeBarConfig.id }, (query) =>
					query
						.from(liveTradingRoomToInformativeBarConfig)
						.innerJoin(informativeBarConfig, eq(liveTradingRoomToInformativeBarConfig.informativeBarConfigId, informativeBarConfig.id))
						.where(eq(liveTradingRoomToInformativeBarConfig.liveTradingRoomId, liveTradingRoom.id)),
				),
				predefinedFrvp: predefinedFrvp,
			})
			.from(liveTradingRoom)
			.innerJoin(predefinedFrvp, eq(liveTradingRoom.predefinedFrvpId, predefinedFrvp.id))
			.where(eq(liveTradingRoom.id, input.id))
			.limit(1);

		if (!room) {
			throw new TRPCError({
				code: 'NOT_FOUND',
			});
		}
		return room;
	}),

	changeStatus: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.nativeEnum(SimulationExecutionStatus),
			}),
		)
		.mutation(async ({ input }) => {
			const db = getDatabase();
			const [room] = await db
				.update(liveTradingRoom)
				.set({
					status: input.status,
				})
				.where(eq(liveTradingRoom.id, input.id))
				.returning();

			if (!room) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Room not found',
				});
			}

			if (input.status === SimulationExecutionStatus.Running) {
				await env.LIVE_TRADE_ROOM_EXECUTION_WORKFLOW.create({
					params: {
						tradeRoomId: input.id,
					} satisfies LiveTradeRoomExecutionWorkflowParams,
				});
			}

			return room;
		}),

	edit: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				data: liveTradingRoomSchema,
			}),
		)
		.mutation(async ({ input }) => {
			const db = getDatabase();
			const { id, data } = input;
			const [roomData] = await db
				.select({
					id: liveTradingRoom.id,
				})
				.from(liveTradingRoom)
				.where(eq(liveTradingRoom.id, id))
				.limit(1);
			if (!roomData) {
				throw new TRPCError({
					code: 'NOT_FOUND',
				});
			}

			const updatedRoom = await db.transaction(async (tx) => {
				const [updatedRoom] = await tx
					.update(liveTradingRoom)
					.set({
						name: data.name.trim(),
						pair: data.pair,
						aiPrompt: data.aiPrompt.trim(),
						aiModels: data.aiModels,
						aiModelStrategy: data.aiModelStrategy,
						aiModelPriceStrategy: data.aiModelPriceStrategy,
						predefinedFrvpId: data.predefinedFrvpId,
					})
					.where(eq(liveTradingRoom.id, id))
					.returning();

				if (!updatedRoom) {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
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

				await tx.delete(liveTradingRoomToInformativeBarConfig).where(eq(liveTradingRoomToInformativeBarConfig.liveTradingRoomId, id));

				await tx.insert(liveTradingRoomToInformativeBarConfig).values(
					data.infoBarIds.map((infoBarId) => ({
						liveTradingRoomId: id,
						informativeBarConfigId: infoBarId,
					})),
				);
				return updatedRoom;
			});

			return updatedRoom;
		}),

	delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
		const db = getDatabase();

		const deletedRoom = await db.delete(liveTradingRoom).where(eq(liveTradingRoom.id, input.id)).returning();

		if (!deletedRoom || deletedRoom.length === 0) {
			throw new TRPCError({
				code: 'NOT_FOUND',
				message: 'Room not found',
			});
		}

		return deletedRoom[0];
	}),

	signals: protectedProcedure
		.input(
			z.object({
				liveTradingRoomId: z.string(),
			}).merge(paginatedSchema),
		)
		.query(async ({ input }) => {
			const db = getDatabase();

			const where: (SQL | undefined)[] = [eq(liveTradingRoomSignal.liveTradingRoomId, input.liveTradingRoomId)];

			return paginate({
				skip: input.skip,
				take: input.take,
				maxTake: 100,
				count: async () => {
					const query = db
						.select({ count: count(liveTradingRoomSignal.id) })
						.from(liveTradingRoomSignal)
						.where(and(...where));

					const result = await query;
					return result[0]?.count ?? 0;
				},
				query: async ({ take, skip }) => {
					return db
						.select({
							id: liveTradingRoomSignal.id,
							createdAt: liveTradingRoomSignal.createdAt,
							suggestions: liveTradingRoomSignal.suggestions,
							exitDate: liveTradingRoomSignal.exitDate,
							exitBalance: liveTradingRoomSignal.exitBalance,
						})
						.from(liveTradingRoomSignal)
						.where(and(...where))
						.orderBy(desc(liveTradingRoomSignal.createdAt))
						.limit(take)
						.offset(skip);
				},
			});
		}),

	checkSignalTradeSuccess: protectedProcedure
		.input(
			z.object({
				signalId: z.string(),
				suggestionIndex: z.number().int().min(0),
			}),
		)
		.mutation(async ({ input }) => {
			const db = getDatabase();

			// Get the signal with the live trading room info
			const [signal] = await db
				.select({
					id: liveTradingRoomSignal.id,
					createdAt: liveTradingRoomSignal.createdAt,
					suggestions: liveTradingRoomSignal.suggestions,
					liveTradingRoom: liveTradingRoom,
				})
				.from(liveTradingRoomSignal)
				.innerJoin(liveTradingRoom, eq(liveTradingRoomSignal.liveTradingRoomId, liveTradingRoom.id))
				.where(eq(liveTradingRoomSignal.id, input.signalId))
				.limit(1);

			if (!signal) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Signal not found',
				});
			}

			const suggestion = signal.suggestions[input.suggestionIndex];
			if (!suggestion) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Suggestion index out of bounds',
				});
			}

			if (suggestion.type === 'hold') {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Cannot check trade success for hold signals',
				});
			}

			if (!suggestion.stopLossPrice || !suggestion.takeProfitPrice) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Signal missing stop loss or take profit prices',
				});
			}

			// Get current price at signal creation time
			const result = await fetchBars({
				start: sub(signal.createdAt, {
					minutes: 5,
				}),
				end: signal.createdAt,
				timeframeAmount: 1,
				timeframeUnit: TimeUnit.Min,
				pair: signal.liveTradingRoom.pair,
				alpaca: {
					keyId: env.ALPACA_KEY_ID!,
					secretKey: env.ALPACA_SECRET_KEY!,
				},
			});

			if (!result?.length) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: `No bars found for ${signal.liveTradingRoom.pair} at ${signal.createdAt.toISOString()}`,
				});
			}

			// Calculate current price as average of high and low
			const lastBar = result[result.length - 1];
			if (!lastBar) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'No valid bar data found',
				});
			}
			const currentPrice = (lastBar.High + lastBar.Low) / 2;

			// Call checkTradeSuccess
			const tradeResult = await checkTradeSuccess({
				aiOrder: {
					type: suggestion.type,
					stopLossPrice: suggestion.stopLossPrice,
					takeProfitPrice: suggestion.takeProfitPrice,
				},
				entryPrice: currentPrice,
				entryTimestamp: signal.createdAt.toISOString(),
				pair: signal.liveTradingRoom.pair,
				trailingStop: false,
			});

			// Update the signal with exit date and balance
			await db
				.update(liveTradingRoomSignal)
				.set({
					exitDate: new Date(tradeResult.timestamp),
					exitBalance: tradeResult.resultBalance,
				})
				.where(eq(liveTradingRoomSignal.id, input.signalId));

			return tradeResult;
		}),
};

import { getDatabase } from '@/database';
import { paginate, paginatedSchema } from '@baron/common';
import { predefinedFrvp } from '@baron/db/schema';
import { createPredefinedFrvpSchema } from '@baron/schema';
import { getDataFromTradingView } from '@baron/tradingview-volume-profile';
import { protectedProcedure } from '@baron/trpc-server';
import { TRPCError } from '@trpc/server';
import { isAfter } from 'date-fns';
import { and, count, desc, eq, ilike, SQL } from 'drizzle-orm';
import { z } from 'zod';

export const frvpRouter = {
	create: protectedProcedure.input(createPredefinedFrvpSchema).mutation(async ({ input }) => {
		const db = getDatabase();

		const [existingFrvp] = await db
			.select({ id: predefinedFrvp.id })
			.from(predefinedFrvp)
			.where(eq(predefinedFrvp.name, input.name))
			.limit(1);

		if (existingFrvp) {
			throw new TRPCError({
				code: 'CONFLICT',
			});
		}

		const lastDate = input.profiles.reduce((acc, profile) => {
			const lastZone = profile.zones.reduce((acc, zone) => {
				return zone.zoneEndAt && isAfter(zone.zoneEndAt, acc) ? zone.zoneEndAt : acc;
			}, new Date('2000-01-01'));

			return isAfter(lastZone, acc) ? lastZone : acc;
		}, new Date('2000-01-01'));

		const [frvp] = await db
			.insert(predefinedFrvp)
			.values({
				name: input.name,
				pair: input.pair,
				lastDate: lastDate,
				profiles: input.profiles,
			})
			.returning();

		if (!frvp) {
			throw new TRPCError({
				code: 'INTERNAL_SERVER_ERROR',
			});
		}

		return frvp;
	}),

	edit: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				data: createPredefinedFrvpSchema,
			}),
		)
		.mutation(async ({ input }) => {
			const db = getDatabase();
			const { id, data } = input;

			const lastDate = data.profiles.reduce((acc, profile) => {
				const lastZone = profile.zones.reduce((acc, zone) => {
					return zone.zoneEndAt && isAfter(zone.zoneEndAt, acc) ? zone.zoneEndAt : acc;
				}, new Date('2000-01-01'));

				return isAfter(lastZone, acc) ? lastZone : acc;
			}, new Date('2000-01-01'));

			const [frvp] = await db
				.update(predefinedFrvp)
				.set({
					name: data.name,
					pair: data.pair,
					lastDate: lastDate,
					profiles: data.profiles,
				})
				.where(eq(predefinedFrvp.id, id))
				.returning();

			if (!frvp) {
				throw new TRPCError({
					code: 'NOT_FOUND',
				});
			}

			return frvp;
		}),

	get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
		const db = getDatabase();

		const [frvp] = await db.select().from(predefinedFrvp).where(eq(predefinedFrvp.id, input.id)).limit(1);

		if (!frvp) {
			throw new TRPCError({
				code: 'NOT_FOUND',
			});
		}
		return frvp;
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
				where.push(ilike(predefinedFrvp.name, `%${input.search}%`));
			}

			return paginate({
				skip: input.skip,
				take: input.take,
				maxTake: 100,
				count: async () => {
					const query = db
						.select({ count: count(predefinedFrvp.id) })
						.from(predefinedFrvp)
						.where(and(...where));

					const result = await query;
					return result[0]?.count ?? 0;
				},
				query: async ({ take, skip }) => {
					return db
						.select()
						.from(predefinedFrvp)
						.where(and(...where))
						.orderBy(desc(predefinedFrvp.createdAt))
						.limit(take)
						.offset(skip);
				},
			});
		}),

	delete: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
		const db = getDatabase();

		const deletedFRVP = await db.delete(predefinedFrvp).where(eq(predefinedFrvp.id, input.id)).returning();

		if (!deletedFRVP || deletedFRVP.length === 0) {
			throw new TRPCError({
				code: 'NOT_FOUND',
			});
		}

		return deletedFRVP[0];
	}),

	fetchFromCode: protectedProcedure.input(z.object({ fetchCode: z.string() })).mutation(async ({ input }) => {
		try {
			const fetchCode = input.fetchCode.trim();

			if (!fetchCode.startsWith('fetch(')) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Code must start with fetch(',
				});
			}

			const response = await getDataFromTradingView(() => fetchFromSnippet(fetchCode));

			return response;
		} catch (error) {
			if (error instanceof TRPCError) {
				throw error;
			}

			throw new TRPCError({
				code: 'BAD_REQUEST',
				message: `Failed to execute fetch code: ${error instanceof Error ? error.message : 'Unknown error'}`,
			});
		}
	}),
};

export async function fetchFromSnippet(snippet: string): Promise<Response> {
	/* --------------------------------------------------------------------- */
	/* 1. Grab the URL (first argument in fetch("…", { … }))                 */
	/* --------------------------------------------------------------------- */
	const urlMatch = snippet.match(/fetch\(\s*(['"])(.*?)\1/);
	if (!urlMatch) throw new Error('No fetch() URL found in snippet.');

	const url = urlMatch[2] as string;

	/* --------------------------------------------------------------------- */
	/* 2. Extract the JSON object that follows the comma                     */
	/*    We scan for braces to cope with nested objects (headers, etc.).    */
	/* --------------------------------------------------------------------- */
	const firstBrace = snippet.indexOf('{', urlMatch.index!);
	if (firstBrace === -1) {
		// no init object present ⇒ simple GET
		return fetch(url);
	}

	let braceDepth = 0;
	let inString: '"' | "'" | null = null;
	let escaping = false;
	let endBrace = -1;

	for (let i = firstBrace; i < snippet.length; i++) {
		const ch = snippet[i];

		if (escaping) {
			escaping = false;
			continue;
		}

		// Track string literals so we ignore braces inside them
		if (inString) {
			if (ch === '\\') {
				escaping = true;
			} else if (ch === inString) {
				inString = null;
			}
			continue;
		} else if (ch === '"' || ch === "'") {
			inString = ch;
			continue;
		}

		// Count braces outside strings
		if (ch === '{') {
			braceDepth++;
		} else if (ch === '}') {
			braceDepth--;
			if (braceDepth === 0) {
				endBrace = i;
				break;
			}
		}
	}

	if (endBrace === -1) {
		throw new Error('Could not find the end of the init object.');
	}

	const rawJson = snippet.slice(firstBrace, endBrace + 1);

	/* --------------------------------------------------------------------- */
	/* 3. Convert the JSON text to a real object                             */
	/* --------------------------------------------------------------------- */
	// DevTools output is valid JSON; if trailing commas ever appear you
	// could strip them with `rawJson.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')`
	const initObject = JSON.parse(rawJson) as Record<string, unknown>;

	/* --------------------------------------------------------------------- */
	/* 4. Normalise headers & other fields to match RequestInit              */
	/* --------------------------------------------------------------------- */
	const init: RequestInit = { ...initObject };

	if (initObject.headers && typeof initObject.headers === 'object') {
		init.headers = new Headers(initObject.headers as Record<string, string>);
	}

	// Ensure GET has no body
	if (init.body === null) delete init.body;

	return fetch(url, init);
}

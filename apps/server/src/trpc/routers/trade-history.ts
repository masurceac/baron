import { simulationExecutionTrade } from '@baron/db/schema';
import { protectedProcedure } from '@baron/trpc-server';
import { getDatabase } from '@baron/trpc-server/async-storage/getters';
import { and, asc, eq, SQL } from 'drizzle-orm';
import { z } from 'zod';

export const tradeHistoryRouter = {
	list: protectedProcedure.input(z.object({ executionId: z.string() })).query(async ({ input }) => {
		const db = getDatabase();
		const where: (SQL | undefined)[] = [eq(simulationExecutionTrade.simulationExecutionId, input.executionId)];

		return db
			.select()
			.from(simulationExecutionTrade)
			.where(and(...where))
			.orderBy(asc(simulationExecutionTrade.createdAt));
	}),
};

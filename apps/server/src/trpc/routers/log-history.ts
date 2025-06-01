import { simulationExecutionLog } from '@baron/db/schema';
import { protectedProcedure } from '@baron/trpc-server';
import { getDatabase } from '@baron/trpc-server/async-storage/getters';
import { and, asc, eq, SQL } from 'drizzle-orm';
import { z } from 'zod';

export const logHistoryRouter = {
	list: protectedProcedure.input(z.object({ executionId: z.string() })).query(async ({ input }) => {
		const db = getDatabase();
		const where: (SQL | undefined)[] = [eq(simulationExecutionLog.simulationExecutionId, input.executionId)];

		return db
			.select()
			.from(simulationExecutionLog)
			.where(and(...where))
			.orderBy(asc(simulationExecutionLog.createdAt));
	}),
};

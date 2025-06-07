import { getDatabase } from '@/database';
import { simulationExecutionLog } from '@baron/db/schema';
import { protectedProcedure } from '@baron/trpc-server';
import { and, desc, eq, SQL } from 'drizzle-orm';
import { z } from 'zod';

export const logHistoryRouter = {
	list: protectedProcedure.input(z.object({ executionId: z.string() })).query(async ({ input }) => {
		const db = getDatabase();
		const where: (SQL | undefined)[] = [eq(simulationExecutionLog.simulationExecutionId, input.executionId)];

		return db
			.select()
			.from(simulationExecutionLog)
			.where(and(...where))
			.orderBy(desc(simulationExecutionLog.createdAt));
	}),
};

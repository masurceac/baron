import { SimulationExecutionStatus } from '@baron/db/enum';
import { simulationExecution } from '@baron/db/schema';
import { getDatabase } from '@baron/trpc-server/async-storage/getters';
import { eq } from 'drizzle-orm';
import { processSimulationExecution } from './simulation-execution/process-simulation-execution';

export async function checkSimulationExecution() {
  const db = getDatabase();

  const [executionPending] = await db
    .select({
      id: simulationExecution.id,
    })
    .from(simulationExecution)
    .where(eq(simulationExecution.status, SimulationExecutionStatus.Pending))
    .limit(1);

  if (!executionPending) {
    console.log(`No pending simulation execution found`);
    return;
  }

  await processSimulationExecution(executionPending.id);
}

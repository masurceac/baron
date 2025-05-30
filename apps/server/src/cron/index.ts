import { processSimulationExecution } from '@/service/process-simulation-execution';
import { SimulationExecutionStatus } from '@baron/db/enum';
import { simulationExecution } from '@baron/db/schema';
import { getDatabase } from '@baron/trpc-server/async-storage/getters';
import { eq } from 'drizzle-orm';

export async function cronHandler() {
	const db = getDatabase();

	const pendingExecutions = await db
		.select({
			id: simulationExecution.id,
		})
		.from(simulationExecution)
		.where(eq(simulationExecution.status, SimulationExecutionStatus.Pending))
		.limit(100);

	for (const execution of pendingExecutions) {
		// Here you would typically run the simulation execution logic
		// For example, you might call a function to process the execution
		// await runSimulationExecution(execution.id);

		// For now, we will just log the execution ID
		console.log(`Processing simulation execution with ID: ${execution.id}`);
		await processSimulationExecution(execution.id);
	}
}

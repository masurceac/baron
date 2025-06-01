import { z } from 'zod';

export const simulationRunSchema = z.object({
  simulationSetupId: z.string(),
  startDate: z.date(),
  iterations: z.number().min(1).max(1000).optional(),
});
export type SimulationRun = z.infer<typeof simulationRunSchema>;

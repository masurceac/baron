import { z } from 'zod';
import { simulationConfigSchema } from './simulation-config';

export const simulationRunSchema = z
  .object({
    simulationRoomId: z.string(),
    startDate: z.date(),
    iterations: z.number().min(1).max(1000).optional(),
  })
  .merge(simulationConfigSchema);
export type SimulationRun = z.infer<typeof simulationRunSchema>;

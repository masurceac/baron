import { z } from 'zod';
import { simulationConfigSchema } from './simulation-config';

export const simulationRunSchema = z
  .object({
    simulationRoomId: z.string(),
  })
  .merge(simulationConfigSchema);
export type SimulationRun = z.infer<typeof simulationRunSchema>;

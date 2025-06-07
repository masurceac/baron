import { z } from 'zod';
import { simulationConfigSchema } from './simulation-config';

export const simulationRoomSchema = z
  .object({
    description: z.string(),
    selfTraining: z.boolean().optional().default(false),
  })
  .merge(simulationConfigSchema);

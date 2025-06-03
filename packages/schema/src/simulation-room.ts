import { z } from 'zod';
import { simulationConfigSchema } from './simulation-config';

export const simulationRoomSchema = z
  .object({
    description: z.string(),
  })
  .merge(simulationConfigSchema);

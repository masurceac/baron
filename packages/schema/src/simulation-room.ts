import { z } from 'zod';

export const simulationRoomSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
});

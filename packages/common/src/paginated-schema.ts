import { z } from 'zod';
import { SortDirectionEnum } from './enum';

export const paginatedSchema = z.object({
  skip: z.number().int().nonnegative().optional(),
  take: z.number().int().min(1).max(100).optional(),
});

export const sortDirectionSchema = z.object({
  direction: z.nativeEnum(SortDirectionEnum),
});

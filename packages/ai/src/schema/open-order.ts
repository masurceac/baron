import { z } from 'zod';

export const openOrderAiResponseSchema = z.object({
  type: z.enum(['buy', 'sell', 'hold']),
  stopLossPrice: z.number().nullable(),
  takeProfitPrice: z.number().nullable(),
  reason: z.string().nullable(),
});

export const openOrderAIResponseJsonOrgSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'GptResponse',
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['buy', 'sell', 'hold'],
    },
    stopLossPrice: {
      type: 'number',
      nullable: true,
    },
    takeProfitPrice: {
      type: 'number',
      nullable: true,
    },
    reason: {
      type: 'string',
      nullable: true,
    },
  },
  required: ['type', 'stopLossPrice', 'takeProfitPrice', 'reason'],
  additionalProperties: false,
};
export type OpenOrderAiResponse = z.infer<typeof openOrderAiResponseSchema>;

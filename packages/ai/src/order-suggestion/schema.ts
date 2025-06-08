import { z } from 'zod';

export const openOrderAiResponseSchema = z.object({
  type: z.enum(['buy', 'sell', 'hold']),
  stopLossPrice: z.number().nullable(),
  takeProfitPrice: z.number().nullable(),
  reason: z.string().nullable(),
  holdUntilPriceBreaksUp: z.number().nullable(),
  holdUntilPriceBreaksDown: z.number().nullable(),
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
    holdUntilPriceBreaksUp: {
      type: 'number',
      nullable: true,
      description:
        "The upper price boundary to monitor for a breakout. Required only when 'type' is 'hold'.",
    },
    holdUntilPriceBreaksDown: {
      type: 'number',
      nullable: true,
      description:
        "The lower price boundary to monitor for a breakdown. Required only when 'type' is 'hold'.",
    },
  },
  required: [
    'type',
    'stopLossPrice',
    'takeProfitPrice',
    'reason',
    'holdUntilPriceBreaksUp',
    'holdUntilPriceBreaksDown',
  ],
  additionalProperties: false,
} as const;
export type OpenOrderAiResponse = z.infer<typeof openOrderAiResponseSchema>;
export type OpenOrderAIResponseJsonOrg =
  typeof openOrderAIResponseJsonOrgSchema;

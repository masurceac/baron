import { z } from 'zod';

export const selfTrainingAiResponseSchema = z.object({
  prompt: z.string(),
});

export const selfTrainingAIResponseJsonOrgSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'GptResponse',
  type: 'object',
  properties: {
    prompt: {
      type: 'string',
    },
  },
  required: ['prompt'],
  additionalProperties: false,
} as const;

export type SelfTrainingAiResponse = z.infer<
  typeof selfTrainingAiResponseSchema
>;
export type SelfTrainingAIResponseJsonOrg =
  typeof selfTrainingAIResponseJsonOrgSchema;

import { createXai } from '@ai-sdk/xai';
import { generateText } from 'ai';
import { z } from 'zod';
import {
  JsonOrgResponseSchema,
  replacePromptVariables,
  RESPONSE_SCHEMA_PROMPT,
} from '../../common';

export async function getGrokResponse<T extends z.ZodSchema>(input: {
  prompt: string;
  responseValidationSchema: T;
  responseSchema: JsonOrgResponseSchema;
  apiKey: string;
  model: 'grok-3';
}): Promise<z.infer<T> | null> {
  const xai = createXai({
    apiKey: input.apiKey,
  });
  const answerInstructions = replacePromptVariables(RESPONSE_SCHEMA_PROMPT, {
    schema: JSON.stringify(input.responseSchema, null, 4),
  });

  const response = await generateText({
    model: xai(input.model),
    prompt: input.prompt,
    system: answerInstructions,
  });

  const getResult = () => {
    try {
      const r = JSON.parse(response.text ?? '');
      return input.responseValidationSchema.parse(r);
    } catch (e) {
      console.log('FAILED TO PARSE');
      console.log(response.text);
      return null;
    }
  };

  const result = getResult();

  return result;
}

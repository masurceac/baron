import { OpenAI } from 'openai';
import { z } from 'zod';
import {
  JsonOrgResponseSchema,
  replacePromptVariables,
  RESPONSE_SCHEMA_PROMPT,
} from '../../common';

export async function getDeepSeekResponse<T extends z.ZodSchema>(input: {
  prompt: string;
  responseValidationSchema: T;
  responseSchema: JsonOrgResponseSchema;
  apiKey: string;
}): Promise<z.infer<T> | null> {
  const openai = new OpenAI({
    apiKey: input.apiKey,
    baseURL: 'https://api.deepseek.com',
  });

  const answerInstructions = replacePromptVariables(RESPONSE_SCHEMA_PROMPT, {
    schema: JSON.stringify(input.responseSchema, null, 4),
  });

  const response = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: answerInstructions,
      },
      {
        role: 'user',
        content: input.prompt,
      },
    ],
    temperature: 0.2,
  });
  const getResult = () => {
    try {
      const json =
        response.choices[0]?.message?.content
          ?.replace(/^\s*```json\s*\n?/, '')
          .replace(/\s*```\s*$/, '') ?? '';

      const r = JSON.parse(json);
      return input.responseValidationSchema.parse(r);
    } catch (e) {
      console.log('FAILED TO PARSE');
      console.log(response.choices[0]?.message?.content);
      return null;
    }
  };

  const result = getResult();

  return result;
}

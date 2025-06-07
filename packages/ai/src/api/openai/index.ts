import { OpenAI } from 'openai';
import { z } from 'zod';
import {
  JsonOrgResponseSchema,
  replacePromptVariables,
  RESPONSE_SCHEMA_PROMPT,
} from '../../common';

export async function getOpenAiResponse<T extends z.ZodSchema>(input: {
  prompt: string;
  responseValidationSchema: T;
  responseSchema: JsonOrgResponseSchema;
  apiKey: string;
}): Promise<z.infer<T> | null> {
  const openai = new OpenAI({
    apiKey: input.apiKey,
  });

  const answerInstructions = replacePromptVariables(RESPONSE_SCHEMA_PROMPT, {
    schema: JSON.stringify(input.responseSchema, null, 4),
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1',
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
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'output', // REQUIRED
        description:
          'A structured financial trade suggestion with clear intent and optional price targets',
        strict: true, // optional, recommended for precise enforcement
        schema: input.responseSchema,
      },
    },
  });
  const getResult = () => {
    try {
      const r = JSON.parse(response.choices[0]?.message?.content ?? '');
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

/**
 Available models: [
  'dall-e-3',
  'dall-e-2',
  'gpt-4o-audio-preview-2024-10-01',
  'text-embedding-3-small',
  'babbage-002',
  'text-embedding-ada-002',
  'gpt-4o-mini-audio-preview',
  'gpt-4o-audio-preview',
  'gpt-4.1-nano',
  'gpt-3.5-turbo-instruct-0914',
  'gpt-4o-mini-search-preview',
  'gpt-4.1-nano-2025-04-14',
  'gpt-3.5-turbo-16k',
  'davinci-002',
  'gpt-3.5-turbo-1106',
  'gpt-4o-search-preview',
  'gpt-3.5-turbo-instruct',
  'gpt-3.5-turbo',
  'gpt-4o-mini-search-preview-2025-03-11',
  'gpt-4o-2024-11-20',
  'gpt-4o-2024-05-13',
  'text-embedding-3-large',
  'o1-mini',
  'gpt-4o-mini-tts',
  'gpt-4o-transcribe',
  'gpt-4.5-preview',
  'gpt-4.5-preview-2025-02-27',
  'gpt-4o-search-preview-2025-03-11',
  'omni-moderation-2024-09-26',
  'gpt-image-1',
  'o1-mini-2024-09-12',
  'tts-1-hd',
  'gpt-4o',
  'tts-1-hd-1106',
  'gpt-4o-2024-08-06',
  'gpt-4o-mini-2024-07-18',
  'gpt-4.1-mini',
  'gpt-4o-mini',
  'gpt-4o-mini-audio-preview-2024-12-17',
  'gpt-3.5-turbo-0125',
  'tts-1',
  'tts-1-1106',
  'gpt-4o-mini-transcribe',
  'gpt-4.1-mini-2025-04-14',
  'gpt-4.1',
  'whisper-1',
  'gpt-4.1-2025-04-14',
  'omni-moderation-latest',
  'o1-preview-2024-09-12',
  'o1-preview'
]
 */

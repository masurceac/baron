import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { JsonOrgResponseSchema } from '../../common';
import { GeminiModelEnum } from '@baron/schema';

export async function getGeminiAiResponse<T extends z.ZodSchema>(input: {
  prompt: string;
  responseValidationSchema: T;
  responseSchema: JsonOrgResponseSchema;
  apiKey: string;
  model: GeminiModelEnum;
}): Promise<z.infer<T> | null> {
  const ai = new GoogleGenAI({ vertexai: false, apiKey: input.apiKey });
  const response = await ai.models.generateContent({
    model: input.model,
    contents: input.prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: input.responseSchema,
    },
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

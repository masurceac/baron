import { OpenAI } from 'openai';
import { z } from 'zod';

export async function getDeepSeekResponse<T extends z.ZodSchema>(input: {
  prompt: string;
  system: string;
  schema: T;
  apiKey: string;
}): Promise<z.infer<T> | null> {
  const openai = new OpenAI({
    apiKey: input.apiKey,
    baseURL: 'https://api.deepseek.com',
  });

  const response = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: input.system,
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
      const r = JSON.parse(
        response.choices[0]?.message?.content
          ?.replace('```json', '')
          .replace('```', '') ?? '',
      );
      return input.schema.parse(r);
    } catch (e) {
      console.log('FAILED TO PARSE');
      console.log(response.choices[0]?.message?.content);
      return null;
    }
  };

  const result = getResult();

  return result;
}

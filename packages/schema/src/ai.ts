import { z } from 'zod';

export enum AiModelEnum {
  DeepSeek = 'deepseek',
  OpenAI = 'openai',
  Gemini = 'gemini',
}

export enum DeepSeekModelEnum {
  Chat = 'deepseek-chat',
  Reasoner = 'deepseek-reasoner',
}

export enum OpenAIModelEnum {
  Gpt41 = 'gpt-4.1',
  O4Mini20250416 = 'o4-mini-2025-04-16',
}

export enum GeminiModelEnum {
  Gemini25FlashPreview0520 = 'gemini-2.5-flash-preview-05-20',
  Gemini25ProPreview0605 = 'gemini-2.5-pro-preview-06-05',
  Gemini25Pro = 'gemini-2.5-pro',
}

export enum AiModelStrategyEnum {
  And = 'and',
  Or = 'or',
}

export enum AiModelPriceStrategyEnum {
  Max = 'max',
  Min = 'min',
  Average = 'average',
}

export const aiModelSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(AiModelEnum.DeepSeek),
    model: z.nativeEnum(DeepSeekModelEnum),
  }),
  z.object({
    type: z.literal(AiModelEnum.OpenAI),
    model: z.nativeEnum(OpenAIModelEnum),
  }),
  z.object({
    type: z.literal(AiModelEnum.Gemini),
    model: z.nativeEnum(GeminiModelEnum),
  }),
]);

export type AiModel = z.infer<typeof aiModelSchema>;

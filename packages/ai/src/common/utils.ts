import {
  AiModelEnum,
  DeepSeekModelEnum,
  GeminiModelEnum,
  OpenAIModelEnum,
} from '@baron/schema';
import { GetAllVariables } from './types';

export function replacePromptVariables<T extends Readonly<string>>(
  prompt: T,
  variables: GetAllVariables<T>,
): T {
  const castedVariables = variables as Record<string, string>;
  const promptResult = Object.keys(castedVariables).reduce(
    (acc, key) =>
      acc.replaceAll(
        `{{${key}}}`,
        castedVariables[key as keyof typeof castedVariables] ?? '',
      ),
    prompt,
  );

  return promptResult as T;
}

export function getModelLabel(type: AiModelEnum, model: string) {
  switch (type) {
    case AiModelEnum.DeepSeek:
      return model === DeepSeekModelEnum.Chat
        ? 'DeepSeek Chat'
        : 'DeepSeek Reasoner';
    case AiModelEnum.OpenAI:
      return model === OpenAIModelEnum.Gpt41 ? 'GPT-4.1' : 'O4 Mini 2025-04-16';
    case AiModelEnum.Gemini:
      return model === GeminiModelEnum.Gemini25FlashPreview0520
        ? 'Gemini 2.5 Flash Preview 05-20'
        : model === GeminiModelEnum.Gemini25ProPreview0605
          ? 'Gemini 2.5 Pro Preview 06-05'
          : 'Gemini 2.5 Pro';
  }
}

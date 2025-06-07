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

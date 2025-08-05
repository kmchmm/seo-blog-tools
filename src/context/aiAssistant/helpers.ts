import { SystemPrompts } from '../../hooks/useGetSystemPrompts';

export const promptMap = ({ prompts }: { prompts: SystemPrompts[] }) => {
  return prompts.reduce<
    Record<string, { systemPrompt: string; model: string; max_tokens: string }>
  >((acc, prompt) => {
    acc[prompt.promptId] = {
      systemPrompt: prompt.systemPrompt,
      model: prompt.model,
      max_tokens: prompt.max_token,
    };
    return acc;
  }, {});
};

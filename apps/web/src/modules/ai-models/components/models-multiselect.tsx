import {
  AiModel,
  AiModelEnum,
  DeepSeekModelEnum,
  GeminiModelEnum,
  OpenAIModelEnum,
} from '@baron/schema';
import { Button } from '@baron/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@baron/ui/components/dropdown-menu';
import { Plus, X } from 'lucide-react';

export function ModelsMultiSelect(props: {
  value?: AiModel[];
  onChange: (value: AiModel[]) => void;
}) {
  const handleSelect = (type: AiModelEnum, model: string) => {
    const newModel = { type, model } as AiModel;
    if (!props.value?.some((m) => m.type === type && m.model === model)) {
      props.onChange([...(props.value ?? []), newModel]);
    }
  };

  const handleRemove = (index: number) => {
    const newValue = [...(props.value ?? [])];
    newValue.splice(index, 1);
    props.onChange(newValue);
  };

  const getModelLabel = (type: AiModelEnum, model: string) => {
    switch (type) {
      case AiModelEnum.DeepSeek:
        return model === DeepSeekModelEnum.Chat
          ? 'DeepSeek Chat'
          : 'DeepSeek Reasoner';
      case AiModelEnum.OpenAI:
        return model === OpenAIModelEnum.Gpt41
          ? 'GPT-4.1'
          : 'O4 Mini 2025-04-16';
      case AiModelEnum.Gemini:
        return model === GeminiModelEnum.Gemini25FlashPreview0520
          ? 'Gemini 2.5 Flash Preview 05-20'
          : 'Gemini 2.5 Pro Preview 06-05';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {props.value?.map((model, index) => (
          <div
            key={`${model.type}-${model.model}-${index}`}
            className="flex items-center gap-2 rounded-md border bg-secondary px-3 py-1.5 text-sm"
          >
            <span>{getModelLabel(model.type, model.model)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0"
              onClick={() => handleRemove(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Plus className="mr-2 h-4 w-4" />
            Add AI Model
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>DeepSeek</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() =>
                  handleSelect(AiModelEnum.DeepSeek, DeepSeekModelEnum.Chat)
                }
              >
                DeepSeek Chat
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  handleSelect(AiModelEnum.DeepSeek, DeepSeekModelEnum.Reasoner)
                }
              >
                DeepSeek Reasoner
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>OpenAI</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() =>
                  handleSelect(AiModelEnum.OpenAI, OpenAIModelEnum.Gpt41)
                }
              >
                GPT-4.1
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  handleSelect(
                    AiModelEnum.OpenAI,
                    OpenAIModelEnum.O4Mini20250416,
                  )
                }
              >
                O4 Mini 2025-04-16
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Gemini</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() =>
                  handleSelect(
                    AiModelEnum.Gemini,
                    GeminiModelEnum.Gemini25FlashPreview0520,
                  )
                }
              >
                Gemini 2.5 Flash Preview 05-20
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  handleSelect(
                    AiModelEnum.Gemini,
                    GeminiModelEnum.Gemini25ProPreview0605,
                  )
                }
              >
                Gemini 2.5 Pro Preview 06-05
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

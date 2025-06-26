import { trpc } from '@/core/trpc';
import { ExecutionStatus } from '@/modules/simulation-execution/components/execution-status';
import {
  AiModelEnum,
  DeepSeekModelEnum,
  GeminiModelEnum,
  OpenAIModelEnum,
} from '@baron/schema';
import { Badge } from '@baron/ui/components/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@baron/ui/components/card';
import { FormatDate } from '@baron/ui/components/format-date';
import { Suspense } from 'react';
import { ItemActions } from './item-actions';
import { DetailedTextDialog } from '@/modules/shared/components/detailed-text-dialog';

function getModelLabel(type: AiModelEnum, model: string) {
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
        : 'Gemini 2.5 Pro Preview 06-05';
  }
}

function LiveTradingDetailsContent(props: { liveTradingRoomId: string }) {
  const [data] = trpc.liveTradingRoom.get.useSuspenseQuery({
    id: props.liveTradingRoomId,
  });

  const { liveTradingRoom, infoBarIds } = data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{liveTradingRoom.name}</CardTitle>
              <CardDescription>
                Created on <FormatDate date={liveTradingRoom.createdAt} />
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <ExecutionStatus status={liveTradingRoom.status} />
              <ItemActions
                item={{ id: liveTradingRoom.id, name: liveTradingRoom.name }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Trading Pair</h3>
            <p className="text-sm text-muted-foreground">
              {liveTradingRoom.pair}
            </p>
          </div>

          <div>
            <DetailedTextDialog
              title="AI Prompt Used"
              content={liveTradingRoom.aiPrompt}
              label="AI Prompt"
            />
          </div>

          <div>
            <h3 className="text-sm font-medium">AI Models</h3>
            <div className="mt-2 space-y-2">
              {liveTradingRoom.aiModels.map((model, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {getModelLabel(model.type, model.model)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium">AI Model Strategy</h3>
            <p className="text-sm text-muted-foreground">
              {liveTradingRoom.aiModelStrategy === 'and'
                ? 'All models must agree'
                : 'Any model can trigger'}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium">Price Strategy</h3>
            <p className="text-sm text-muted-foreground">
              {liveTradingRoom.aiModelPriceStrategy === 'average'
                ? 'Average of all model prices'
                : liveTradingRoom.aiModelPriceStrategy === 'max'
                  ? 'Highest price from all models'
                  : 'Lowest price from all models'}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium">Predefined FRVP</h3>
            <p className="text-sm text-muted-foreground">
              {data.predefinedFrvp.name}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Informative Bars</h3>
            <p className="text-sm text-muted-foreground">
              {infoBarIds?.length ?? 0} bars configured
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function LiveTradingDetails(props: { liveTradingRoomId: string }) {
  return (
    <Suspense>
      <LiveTradingDetailsContent liveTradingRoomId={props.liveTradingRoomId} />
    </Suspense>
  );
}

import { trpc } from '@/core/trpc';
import { InfoBarList } from '@/modules/info-bars/components/info-bar-list';
import { TradingPairSelect } from '@/modules/inputs/trading-pair-select';
import { DetailedTextDialog } from '@/modules/shared/components/detailed-text-dialog';
import { ExecutionStatus } from '@/modules/simulation-execution/components/execution-status';
import {
  TradeCountResult,
  TradeMoneyResult,
} from '@/modules/simulation-execution/components/trade-result';
import {
  AiModelEnum,
  DeepSeekModelEnum,
  GeminiModelEnum,
  OpenAIModelEnum,
} from '@baron/schema';
import { Badge } from '@baron/ui/components/badge';
import { Button } from '@baron/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@baron/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@baron/ui/components/dialog';
import { FormatDate } from '@baron/ui/components/format-date';
import { Separator } from '@baron/ui/components/separator';
import { Suspense } from 'react';
import { ItemActions } from './item-actions';

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

function SimulationRoomDetailsContent(props: { simulationRoomId: string }) {
  const [data] = trpc.simulationRoom.get.useSuspenseQuery({
    id: props.simulationRoomId,
  });

  return (
    <Card>
      <CardHeader className="flex items-center justify-start">
        <div className="flex-1">
          <CardTitle>
            <Badge variant="blue" className="mb-2 mr-2">
              Simulation Room
            </Badge>
            <ExecutionStatus status={data.simulationRoom.status} />
            <br />
            {data.simulationRoom.name}
          </CardTitle>
          <CardDescription>
            {data.simulationRoom.description || 'No description provided.'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex justify-start space-x-4">
        <div className="flex space-x-4 items-center">
          <TradeMoneyResult trades={data.trades ?? []} />
          <TradeCountResult trades={data.trades ?? []} />
        </div>
        <div className="flex items-center space-x-4">
          <TradingPairSelect
            value={data.simulationRoom.pair}
            onChange={() => null}
            disabled
          />
          <DetailedTextDialog
            title="AI Prompt Used"
            content={data.simulationRoom.aiPrompt}
            label="AI Prompt"
          />

          <Dialog>
            <DialogTrigger asChild>
              <Button>Info Bars</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Information Bars Config used in this simulation execution
                </DialogTitle>
              </DialogHeader>
              <DialogContent>
                <InfoBarList items={data.infoBarIds?.map((v) => v.id) ?? []} />
              </DialogContent>
            </DialogContent>
          </Dialog>
          <ItemActions
            item={{
              id: data.simulationRoom.id,
              name: data.simulationRoom.name,
            }}
          />
        </div>
      </CardContent>

      <Separator className="my-2" />

      <CardContent>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-muted/40 rounded-lg p-4 border">
            <h3 className="text-base font-semibold mb-3">
              Trading Configuration
            </h3>
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="font-medium w-32">Max Trades:</span>
                <span>{data.simulationRoom.maxTradesToExecute}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-32">Start Date:</span>
                <span>
                  {data.simulationRoom.startDate && (
                    <FormatDate date={data.simulationRoom.startDate} utc />
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-muted/40 rounded-lg p-4 border">
            <h3 className="text-base font-semibold mb-3">AI Configuration</h3>
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="font-medium w-32">AI Models:</span>
                <span>
                  {data.simulationRoom.aiModels
                    ?.map((model) => getModelLabel(model.type, model.model))
                    .join(', ')}
                </span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-32">Model Strategy:</span>
                <span>{data.simulationRoom.aiModelStrategy}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-32">Price Strategy:</span>
                <span>{data.simulationRoom.aiModelPriceStrategy}</span>
              </div>
            </div>
          </div>

          <div className="bg-muted/40 rounded-lg p-4 border">
            <h3 className="text-base font-semibold mb-3">
              Bulk Execution Configuration
            </h3>
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="font-medium w-32">Number of Executions:</span>
                <span>{data.simulationRoom.bulkExecutionsCount}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium w-32">Interval:</span>
                <span>
                  {data.simulationRoom.bulkExecutionsIntervalAmount}{' '}
                  {data.simulationRoom.bulkExecutionsIntervalUnits}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
export function SimulationRoomDetails(props: { simulationRoomId: string }) {
  return (
    <Suspense>
      <SimulationRoomDetailsContent simulationRoomId={props.simulationRoomId} />
    </Suspense>
  );
}

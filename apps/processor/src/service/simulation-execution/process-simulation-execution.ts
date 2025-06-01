import { getEnv } from '@/async-storage';
import { getDeepSeekResponse } from '@baron/ai/api';
import { OpenOrderSystemVariables, OpenOrderVariables } from '@baron/ai/prompt';
import {
  openOrderAIResponseJsonOrgSchema,
  openOrderAiResponseSchema,
} from '@baron/ai/schema';
import { fetchBars } from '@baron/bars-api';
import { TimeUnit, TradeDirection, TradeLogDirection } from '@baron/common';
import { SimulationExecutionStatus } from '@baron/db/enum';
import {
  simulationExecution,
  simulationExecutionLog,
  simulationExecutionTrade,
} from '@baron/db/schema';
import { getDatabase } from '@baron/trpc-server/async-storage/getters';
import { addMinutes, sub } from 'date-fns';
import { eq } from 'drizzle-orm';
import { checkTradeSuccess } from './check-trade-success';
import { getSimulationExecutionFrvpProfiles } from './get-simulation-execution-frvp-profiles';
import { getSimulationInfoBars } from './get-simulation-execution-info-bars';
import { getSimulationExecutionStartDate } from './get-simulation-execution-start-date';
import { getSimulationExecutionToProcess } from './get-simulation-execution-to-process';

export async function processSimulationExecution(
  simulationExecutionId: string,
) {
  const db = getDatabase();

  try {
    const executionConfig = await getSimulationExecutionToProcess(
      simulationExecutionId,
    );

    await db
      .update(simulationExecution)
      .set({
        status: SimulationExecutionStatus.Running,
      })
      .where(eq(simulationExecution.id, simulationExecutionId));

    let tradesCount = executionConfig.trades?.count ?? 0;

    if (tradesCount === executionConfig.tradesToExecute) {
      console.log(
        `Simulation execution with ID ${simulationExecutionId} already has ${tradesCount} trades, skipping processing.`,
      );
      return;
    }

    let tradeTime = getSimulationExecutionStartDate(executionConfig);

    while (tradesCount < executionConfig.tradesToExecute) {
      console.log('Processing ' + simulationExecutionId);
      const lastBars = await fetchBars({
        start: sub(tradeTime, {
          minutes: 5,
        }),
        end: tradeTime,
        timeframeAmount: 1,
        timeframeUnit: TimeUnit.Min,
        pair: executionConfig.pair,
      });

      const entryPrice = lastBars[lastBars.length - 1]?.Close ?? 0;

      const vrpList = await getSimulationExecutionFrvpProfiles(
        executionConfig,
        tradeTime,
      );
      const infoBars = await getSimulationInfoBars(executionConfig, tradeTime);
      const orderKeys: OpenOrderVariables = {
        json_input: JSON.stringify(
          {
            support_resistance_zones: vrpList.reduce(
              (acc, vpc) => ({ ...acc, [vpc.key]: vpc.profiles }),
              {},
            ),
            bars: infoBars.reduce(
              (acc, ib) => ({ ...acc, [ib.key]: ib.bars }),
              {},
            ),
            current_price: entryPrice,
          },
          null,
          2,
        ),
        response_schema: JSON.stringify(
          openOrderAIResponseJsonOrgSchema,
          null,
          2,
        ),
      };

      const systemKeys: OpenOrderSystemVariables = {
        trading_pair: executionConfig.pair,
      };
      const prompt = Object.keys(orderKeys).reduce(
        (acc, key) =>
          acc.replace(`{{${key}}}`, orderKeys[key as keyof typeof orderKeys]),
        executionConfig.aiPrompt,
      );
      const system = Object.keys(systemKeys).reduce(
        (acc, key) =>
          acc.replace(`{{${key}}}`, systemKeys[key as keyof typeof systemKeys]),
        executionConfig.systemPrompt,
      );

      const aiResponse = await getDeepSeekResponse({
        prompt,
        system,
        apiKey: getEnv().DEEPSEEK_API_KEY,
        schema: openOrderAiResponseSchema,
      });

      if (!aiResponse) {
        throw new Error('AI response is null or undefined');
      }

      await db.insert(simulationExecutionLog).values({
        simulationExecutionId: executionConfig.id,
        direction:
          aiResponse.type === 'buy'
            ? TradeLogDirection.Buy
            : aiResponse.type === 'sell'
              ? TradeLogDirection.Sell
              : TradeLogDirection.Hold,
        reason: aiResponse.reason ?? '',
        date: tradeTime,
      });

      if (aiResponse.type !== 'hold') {
        const success = await checkTradeSuccess({
          aiOrder: aiResponse,
          pair: executionConfig.pair,
          entryTimestamp: tradeTime.toISOString(),
          entryPrice: entryPrice,
        });

        await db.insert(simulationExecutionTrade).values({
          simulationExecutionId: executionConfig.id,
          direction:
            success.order.aiOrder.type === 'buy'
              ? TradeDirection.Buy
              : TradeDirection.Sell,
          entryPrice: entryPrice,
          entryDate: tradeTime,
          exitPrice: success.exitPrice,
          exitDate: new Date(success.timestamp),
          stopLossPrice: success.order.aiOrder.stopLossPrice ?? -1,
          takeProfitPrice: success.order.aiOrder.takeProfitPrice ?? -1,
          balanceResult: success.resultBalance,
          reason: aiResponse.reason ?? '',
        });
        tradesCount++;
        tradeTime = addMinutes(new Date(success.timestamp), 1);
      } else {
        tradeTime = addMinutes(tradeTime, executionConfig.stepMinutes);
      }
    }

    await db
      .update(simulationExecution)
      .set({
        status: SimulationExecutionStatus.Completed,
      })
      .where(eq(simulationExecution.id, simulationExecutionId));
  } catch (e) {
    await db
      .update(simulationExecution)
      .set({
        status: SimulationExecutionStatus.Failed,
      })
      .where(eq(simulationExecution.id, simulationExecutionId));
  }
}

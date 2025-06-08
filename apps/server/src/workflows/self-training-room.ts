import { createSimulationExecutionFromPrompt } from '@/services/create-simulation-execution-from-prompt';
import { getOpenAiResponse } from '@baron/ai/api';
import { replacePromptVariables } from '@baron/ai/common';
import { selfTrainingAIResponseJsonOrgSchema, selfTrainingAiResponseSchema } from '@baron/ai/self-training';
import { getDrizzleClient, queryJoin, queryJoinOne } from '@baron/db/client';
import { simulationExecution, simulationExecutionTrade, simulationRoom } from '@baron/db/schema';
import { env, WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';
import { and, asc, desc, eq } from 'drizzle-orm';
import { SelfTrainingRoomWorkflowArgs } from './types';
import { fetchBars } from '@baron/bars-api';
import { TimeUnit } from '@baron/common';

const IMPROVEMENT_PROMPT = `
Original prompt:
\`\`\`json
{{previous_prompt}}
\`\`\`
Thse are the trades executed based on the above prompt:
\`\`\`json
{{trades}}
\`\`\`
Market data used for the trades:
\`\`\`
{{market_data}}
\`\`\`

Do not include any reasoning in your response, strictly the updated prompt.
Strictly reply with JSON according to the response schema.
`;

export class SelfTrainingRoomWorkflow extends WorkflowEntrypoint<Env, {}> {
	override async run(event: WorkflowEvent<SelfTrainingRoomWorkflowArgs>, step: WorkflowStep) {
		const room = await step.do('get simulation room', async () => {
			return this.getSimulationRoom(event.payload.simulationRoomId);
		});

		if (!room.lastExecution?.id) {
			await step.do('create simulation execution', async () => {
				const result = await createSimulationExecutionFromPrompt({
					simulationRoomId: room.id,
					prompt: room.aiPrompt,
				});

				if (!result) {
					throw new Error('Failed to create simulation execution from AI prompt.');
				}
			});
		} else {
			const marketData = await step.do('fetch market data', async () => {
				const minDate = room.lastExecution?.trades?.at(0)?.entryDate;
				const maxDate = room.lastExecution?.trades?.at(-1)?.exitDate;
				if (!minDate || !maxDate) {
					return null;
				}
				console.log({
					start: new Date(minDate),
					end: new Date(maxDate),
					timeframeAmount: 15,
					timeframeUnit: TimeUnit.Min,
					pair: room.pair,
				});
				const bars = await fetchBars({
					start: new Date(minDate),
					end: new Date(maxDate),
					timeframeAmount: 15,
					timeframeUnit: TimeUnit.Min,
					pair: room.pair,
				});

				return bars;
			});

			const aiGeneratedPrompt = await step.do('generate improved AI prompt', async () => {
				if (!room.lastExecution?.aiPrompt) {
					throw new Error('No previous AI prompt found for self-training.');
				}
				const aiPrompt = (room.selfTrainingPrompt ?? 'Improve the prompt for better efficiency.').concat(
					replacePromptVariables(IMPROVEMENT_PROMPT, {
						previous_prompt: room.lastExecution.aiPrompt,
						trades: JSON.stringify(room.lastExecution.trades),
						market_data: JSON.stringify(marketData),
					}),
				);

				const aiResult = await getOpenAiResponse({
					prompt: aiPrompt,
					responseSchema: selfTrainingAIResponseJsonOrgSchema,
					responseValidationSchema: selfTrainingAiResponseSchema,
					apiKey: env.OPENAI_API_KEY,
				});

				console.log('Generated AI Promp');
				if (!aiResult || !aiResult.prompt) {
					throw new Error('AI did not return a valid prompt.');
				}

				return aiResult;
			});
			await step.do('create simulation execution', async () => {
				const result = await createSimulationExecutionFromPrompt({
					simulationRoomId: room.id,
					prompt: aiGeneratedPrompt.prompt,
				});

				if (!result) {
					throw new Error('Failed to create simulation execution from AI prompt.');
				}
			});
		}
	}

	private async getSimulationRoom(simulationRoomId: string) {
		const db = getDrizzleClient(env.DATABASE_CONNECTION_STRING);
		const [simulationRoomResult] = await db
			.select({
				id: simulationRoom.id,
				aiPrompt: simulationRoom.aiPrompt,
				selfTrainingPrompt: simulationRoom.selfTrainingPrompt,
				pair: simulationRoom.pair,
				tradesToExecute: simulationRoom.tradesToExecute,
				lastExecution: queryJoinOne(
					db,
					{
						id: simulationExecution.id,
						aiPrompt: simulationExecution.aiPrompt,
						trades: queryJoin(
							db,
							{
								id: simulationExecutionTrade.id,
								entryDate: simulationExecutionTrade.entryDate,
								exitDate: simulationExecutionTrade.exitDate,
								entryPrice: simulationExecutionTrade.entryPrice,
								exitPrice: simulationExecutionTrade.exitPrice,
								reason: simulationExecutionTrade.reason,
								stopLossPrice: simulationExecutionTrade.stopLossPrice,
								takeProfitPrice: simulationExecutionTrade.takeProfitPrice,
								status: simulationExecutionTrade.status,
							},
							(query) =>
								query
									.from(simulationExecutionTrade)
									.where(eq(simulationExecutionTrade.simulationExecutionId, simulationExecution.id))
									.orderBy(asc(simulationExecutionTrade.entryDate)),
						),
					},
					(query) =>
						query
							.from(simulationExecution)
							.where(eq(simulationExecution.simulationRoomId, simulationRoom.id))
							.orderBy(desc(simulationExecution.createdAt))
							.limit(1),
				),
			})
			.from(simulationRoom)
			.where(and(eq(simulationRoom.id, simulationRoomId), eq(simulationRoom.selfTraining, true)));

		if (!simulationRoomResult) {
			throw new NonRetryableError(`Room with ID ${simulationRoomId} not found or not self trainable.`);
		}

		return simulationRoomResult;
	}
}

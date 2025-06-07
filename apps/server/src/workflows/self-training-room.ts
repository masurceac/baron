import { getDatabase } from '@/database';
import { createSimulationExecutionFromPrompt } from '@/services/create-simulation-execution-from-prompt';
import { getOpenAiResponse } from '@baron/ai/api';
import { replacePromptVariables } from '@baron/ai/common';
import { selfTrainingAIResponseJsonOrgSchema, selfTrainingAiResponseSchema } from '@baron/ai/self-training';
import { getDrizzleClient, queryJoin, queryJoinOne } from '@baron/db/client';
import { simulationExecution, simulationExecutionTrade, simulationRoom } from '@baron/db/schema';
import { env, WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import { NonRetryableError } from 'cloudflare:workflows';
import { and, count, desc, eq } from 'drizzle-orm';

type Params = {
	simulationRoomId: string;
};

const getPrompt = (
	aiPrompt: string,
) => `You are a trading AI expert. Generate a prompt for the AI to analyze current market data and suggest a trade action.
Here's user input:
${aiPrompt}`;

const IMPROVEMENT_PROMPT = `
You are a trading AI expert.
This is your previous prompt:
\`\`\`json
{{previous_prompt}}
\`\`\`
Based on your prompt these are the trades that were executed:
\`\`\`json
{{trades}}
\`\`\`
Now, analyze the trades and the market data to improve your prompt to get a higher win chance.
`;

export class SelfTrainingRoomWorkflow extends WorkflowEntrypoint<Env, {}> {
	override async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
		console.log('Running self-training room workflow');
		const db = getDatabase();

		for (let i = 0; i < 1000; i++) {
			const room = await step.do('get simulation room', async () => {
				return await this.getSimulationRoom(event.payload.simulationRoomId);
			});
			const hasMore = await step.do('check if more executions are needed', async () => {
				const executions = await db
					.select({
						count: count(simulationExecution.id),
					})
					.from(simulationExecution)
					.where(eq(simulationExecution.simulationRoomId, room.id));
				return (executions[0]?.count ?? 0) < room.tradesToExecute; // Adjust the number of executions as needed
			});
			if (!hasMore) {
				break;
			}

			if (!room.lastExecution?.id) {
				console.log('into prompt');
				const aiGeneratedPrompt = await step.do('generate first AI prompt', async () => {
					const aiPrompt = getPrompt(room.aiPrompt);

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
					// todo: replace prompt variables

					const result = await createSimulationExecutionFromPrompt({
						simulationRoomId: room.id,
						prompt: aiGeneratedPrompt.prompt,
					});

					if (!result) {
						throw new Error('Failed to create simulation execution from AI prompt.');
					}
				});
			} else {
				const aiGeneratedPrompt = await step.do('generate improved AI prompt', async () => {
					if (!room.lastExecution?.aiPrompt) {
						throw new Error('No previous AI prompt found for self-training.');
					}
					const aiPrompt = replacePromptVariables(IMPROVEMENT_PROMPT, {
						previous_prompt: room.lastExecution.aiPrompt,
						trades: JSON.stringify(room.lastExecution.trades),
					});

					const aiResult = await getOpenAiResponse({
						prompt: aiPrompt,
						responseSchema: selfTrainingAIResponseJsonOrgSchema,
						responseValidationSchema: selfTrainingAiResponseSchema,
						apiKey: env.DEEPSEEK_API_KEY_ID,
					});

					console.log('Generated AI Promp');
					if (!aiResult || !aiResult.prompt) {
						throw new Error('AI did not return a valid prompt.');
					}

					return aiResult;
				});
				await step.do('create simulation execution', async () => {
					// todo: replace prompt variables

					const result = await createSimulationExecutionFromPrompt({
						simulationRoomId: room.id,
						prompt: aiGeneratedPrompt.prompt,
					});

					if (!result) {
						throw new Error('Failed to create simulation execution from AI prompt.');
					}
				});
			}

			await step.waitForEvent('receive previous execution completeness', {
				type: 'proceed-execution',
				timeout: '6 hours',
			});
		}
	}

	private async getSimulationRoom(simulationRoomId: string) {
		const db = getDrizzleClient(env.DATABASE_CONNECTION_STRING);
		const [simulationRoomResult] = await db
			.select({
				id: simulationRoom.id,
				aiPrompt: simulationRoom.aiPrompt,
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
							},
							(query) =>
								query.from(simulationExecutionTrade).where(eq(simulationExecutionTrade.simulationExecutionId, simulationExecution.id)),
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
			console.log('NO ROOM FOUND');
			throw new NonRetryableError(`Room with ID ${simulationRoomId} not found or not self trainable.`);
		}

		return simulationRoomResult;
	}
}

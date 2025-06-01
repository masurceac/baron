import { add, isBefore } from 'date-fns';
import { getSimulationExecutionToProcess } from './get-simulation-execution-to-process';

export function getSimulationExecutionStartDate(executionConfig: Awaited<ReturnType<typeof getSimulationExecutionToProcess>>) {
	const lastTrade = executionConfig.lastTrade?.exitDate
		? add(executionConfig.lastTrade.exitDate, {
				minutes: executionConfig.stepMinutes,
			})
		: null;
	const lastLog = executionConfig.lastLog?.date
		? add(executionConfig.lastLog.date, {
				minutes: executionConfig.stepMinutes,
			})
		: null;

	if (!lastTrade && !lastLog) {
		return executionConfig.startDate;
	}

	if (lastTrade && lastLog) {
		if (isBefore(lastTrade, lastLog)) {
			return lastTrade;
		}
		return lastLog;
	}

	return lastLog ?? executionConfig.startDate;
}

import { fetchBars } from '@baron/bars-api';
import { assertNever, TimeUnit } from '@baron/common';
import { sub } from 'date-fns';
import { getSimulationExecutionToProcess } from './get-simulation-execution-to-process';

export async function getSimulationInfoBars(executionConfig: Awaited<ReturnType<typeof getSimulationExecutionToProcess>>, endDate: Date) {
	if (!executionConfig.infoBars || executionConfig.infoBars.length === 0) {
		throw 'InfoBars error ' + executionConfig.id;
	}
	return await Promise.all(
		executionConfig.infoBars.map(async (infoBar) => {
			const getStart = () => {
				switch (infoBar.timeframeUnit) {
					case TimeUnit.Min:
						return sub(endDate, {
							minutes: infoBar.historicalBarsToConsiderAmount * infoBar.timeframeAmount,
						});
					case TimeUnit.Hour:
						return sub(endDate, {
							hours: infoBar.historicalBarsToConsiderAmount * infoBar.timeframeAmount,
						});
					case TimeUnit.Day:
						return sub(endDate, {
							days: infoBar.historicalBarsToConsiderAmount * infoBar.timeframeAmount,
						});
					case TimeUnit.Week:
						return sub(endDate, {
							days: infoBar.historicalBarsToConsiderAmount * infoBar.timeframeAmount,
						});
					case TimeUnit.Month:
						return sub(endDate, {
							days: infoBar.historicalBarsToConsiderAmount * infoBar.timeframeAmount,
						});
					default:
						assertNever(infoBar.timeframeUnit);
				}
			};

			const bars = await fetchBars({
				start: getStart(),
				end: endDate,
				timeframeAmount: infoBar.timeframeAmount,
				timeframeUnit: infoBar.timeframeUnit,
				pair: executionConfig.pair,
			});

			return {
				key: `${infoBar.timeframeAmount}_${infoBar.timeframeUnit}`,
				bars,
			};
		}),
	);
}

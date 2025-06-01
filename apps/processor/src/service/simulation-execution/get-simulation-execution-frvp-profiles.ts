import { assertNever, TimeUnit } from '@baron/common';
import { zoneVolumeProfile } from '@baron/db/schema';
import { getFrvpProfiles } from '@baron/fixed-range-volume-profile';
import { getDatabase } from '@baron/trpc-server/async-storage/getters';
import { sub } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import { getSimulationExecutionToProcess } from './get-simulation-execution-to-process';

export async function getSimulationExecutionFrvpProfiles(
	executionConfig: Awaited<ReturnType<typeof getSimulationExecutionToProcess>>,
	endDate: Date,
) {
	const db = getDatabase();
	if (!executionConfig.vpc || executionConfig.vpc.length === 0) {
		throw 'VPC';
	}
	return Promise.all(
		executionConfig.vpc.map(async (vpc) => {
			console.log('Processing VPC:', vpc.vpcId);
			const getStartDate = () => {
				switch (vpc.vpcTimeframeUnit) {
					case TimeUnit.Min:
						return sub(endDate, {
							minutes: vpc.vpcHistoricalTimeToConsiderAmount,
						});
					case TimeUnit.Hour:
						return sub(endDate, {
							hours: vpc.vpcHistoricalTimeToConsiderAmount,
						});
					case TimeUnit.Day:
						return sub(endDate, {
							days: vpc.vpcHistoricalTimeToConsiderAmount,
						});
					case TimeUnit.Week:
						return sub(endDate, {
							days: vpc.vpcHistoricalTimeToConsiderAmount,
						});
					case TimeUnit.Month:
						return sub(endDate, {
							days: vpc.vpcHistoricalTimeToConsiderAmount,
						});
					default:
						assertNever(vpc.vpcTimeframeUnit);
				}
			};
			const profiles = await getFrvpProfiles(
				{
					start: getStartDate(),
					end: endDate,
					pair: executionConfig.pair,
					timeframeUnit: vpc.vpcTimeframeUnit,
					timeframeAmount: vpc.vpcTimeframeAmount,
					maxDeviationPercent: vpc.vpcMaxDeviationPercent,
					minBarsToConsiderConsolidation: vpc.vpcMinimumBarsToConsider,
					volumePercentageRange: vpc.vpcVolumeProfilePercentage,
				},
				{
					writeFrvp: async (input) => {
						try {
							await db.insert(zoneVolumeProfile).values({
								volumeAreaHigh: input.zone.VAH,
								volumeAreaLow: input.zone.VAL,
								pointOfControl: input.zone.POC,
								zoneStartAt: input.start,
								zoneEndAt: input.end,
								tradingPair: input.pair,
								timeUnit: input.timeframeUnit,
								timeAmount: input.timeframeAmount,
								maxDeviationPercent: input.maxDeviationPercent,
								minimumBarsToConsider: input.minBarsToConsider,
								volumeProfilePercentage: input.volumePercentageRange,
							});
						} catch (e) {
							console.log(e);
						}
					},
					readFrvp: async (input) => {
						const [exist] = await db
							.select()
							.from(zoneVolumeProfile)
							.where(
								and(
									eq(zoneVolumeProfile.tradingPair, input.pair),
									eq(zoneVolumeProfile.timeUnit, input.timeframeUnit),
									eq(zoneVolumeProfile.timeAmount, input.timeframeAmount),
									eq(zoneVolumeProfile.zoneStartAt, input.start),
									eq(zoneVolumeProfile.zoneEndAt, input.end),
								),
							);
						if (!exist) {
							return null;
						}
						return {
							VAH: exist.volumeAreaHigh,
							VAL: exist.volumeAreaLow,
							POC: exist.pointOfControl,
						};
					},
				},
			);

			return {
				key: `${vpc.vpcTimeframeAmount}_${vpc.vpcTimeframeUnit}`,
				profiles,
			};
		}),
	);
}

import { measure, TimeUnit, TradingPair } from '@baron/common';
import { getFrvpProfiles } from '@baron/fixed-range-volume-profile';

const lines = [
	// {
	// 	id: 'd2di0qbrjztxpz9awqn1ku2u',
	// 	created_at: '2025-06-06 17:32:50.868211+00',
	// 	name: '4H Default',
	// 	timeframe_unit: 'hour',
	// 	timeframe_amount: 4,
	// 	max_deviation_percent: 18,
	// 	minimum_bars_to_consider: 70,
	// 	historical_time_to_consider_amount: 900,
	// 	volume_profile_percentage: 70,
	// 	flag: null,
	// },
	// {
	// 	id: 'kbwdsqwpaumjj7q06mrlcy8e',
	// 	created_at: '2025-06-06 17:33:12.168593+00',
	// 	name: '1H Default',
	// 	timeframe_unit: 'hour',
	// 	timeframe_amount: 1,
	// 	max_deviation_percent: 15,
	// 	minimum_bars_to_consider: 30,
	// 	historical_time_to_consider_amount: 1200,
	// 	volume_profile_percentage: 70,
	// 	flag: null,
	// },
	// {
	// 	id: 'xdwdwian1iysmde5i395ueci',
	// 	created_at: '2025-06-06 17:33:37.868604+00',
	// 	name: '15M Default',
	// 	timeframe_unit: 'min',
	// 	timeframe_amount: 15,
	// 	max_deviation_percent: 3,
	// 	minimum_bars_to_consider: 60,
	// 	historical_time_to_consider_amount: 1920,
	// 	volume_profile_percentage: 70,
	// 	flag: null,
	// },
	{
		id: 'yhqpsnm5hdg3tpzvi1do7uug',
		created_at: '2025-06-06 17:32:19.104529+00',
		name: '1 Day Default',
		timeframe_unit: 'day',
		timeframe_amount: 1,
		max_deviation_percent: 25,
		minimum_bars_to_consider: 35,
		historical_time_to_consider_amount: 365,
		volume_profile_percentage: 70,
		flag: null,
	},
] as const;
async function testPerformance() {
	const log = measure('testPerformance');
	await Promise.all(
		lines.map(async (line) => {
			const log = measure(`getFrvpProfiles for ${line.name}`);
			await getFrvpProfiles(
				{
					end: new Date('2025-05-18 17:00:00+00'),
					timeframeAmount: line.timeframe_amount,
					timeframeUnit: line.timeframe_unit as TimeUnit,
					maxDeviationPercent: line.max_deviation_percent,
					minBarsToConsiderConsolidation: line.minimum_bars_to_consider,
					pair: TradingPair.ETHUSDT,
					volumePercentageRange: 70,
					currentPrice: 2570,
					historicalBarsToConsider: line.historical_time_to_consider_amount,
				},
				{
					writeFrvp: async () => {},
					readFrvp: async () => {
						return null;
					},
				},
			);
			log();
		}),
	);

	log();
}

testPerformance();

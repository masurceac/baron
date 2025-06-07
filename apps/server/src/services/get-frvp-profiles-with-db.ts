import { BARS_API_URL, ZoneVolumeProfile } from '@baron/common';
import { GetFrvpProfilesInput } from '@baron/fixed-range-volume-profile';

export async function getFrvpProfilesWithDb(input: GetFrvpProfilesInput) {
	const params = new URLSearchParams();
	Object.entries(input).forEach(([key, value]) => {
		if (value !== undefined) {
			params.append(key, String(value));
		}
	});
	const result = await fetch(`${BARS_API_URL}/vpc?${params.toString()}`);
	const data = (await result.json()) as ZoneVolumeProfile[];

	return data;
}

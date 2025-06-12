import { getDatabase } from '@/database';
import { GetFrvpProfilesInput, getFrvpProfilesWithDb } from '@baron/fixed-range-volume-profile';

export async function getFrvpProfilesService(input: GetFrvpProfilesInput) {
	const result = await getFrvpProfilesWithDb(getDatabase(), input);
	return result;
}

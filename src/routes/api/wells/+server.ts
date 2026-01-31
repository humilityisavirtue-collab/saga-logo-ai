import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getAllWells,
	getWellsByType,
	searchWells,
	getWellByK,
	formatWell,
	type Well
} from '$lib/wells';

export const GET: RequestHandler = async ({ url }) => {
	const type = url.searchParams.get('type');
	const k = url.searchParams.get('k');
	const search = url.searchParams.get('search');
	const format = url.searchParams.get('format'); // 'raw' or 'display'

	let wells: Well[];

	if (k) {
		const well = getWellByK(k);
		wells = well ? [well] : [];
	} else if (type) {
		wells = getWellsByType(type as Well['type']);
	} else if (search) {
		wells = searchWells(search);
	} else {
		wells = getAllWells();
	}

	if (format === 'display') {
		return json({
			wells: wells.map(w => ({
				...w,
				formatted: formatWell(w)
			}))
		});
	}

	return json({ wells });
};

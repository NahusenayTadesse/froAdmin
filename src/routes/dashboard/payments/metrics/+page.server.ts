import type { PageServerLoad } from './$types';
import { load as baseLoad } from '../+page.server';

export const load: PageServerLoad = async (event) => {
	const base = await baseLoad(event as any);
	const { url } = event;
	const view = url.searchParams.get('view') ?? 'net_movements';
	return {
		...base,
		view
	};
};

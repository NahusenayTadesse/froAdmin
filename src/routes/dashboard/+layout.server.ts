import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase } }) => {
	const { data: claimsData, error } = await supabase.auth.getClaims();

	if (error || !claimsData?.claims) {
		redirect(303, '/login');
	}

	const { claims } = claimsData;

	const { data: profile } = await supabase
		.from('profiles')
		.select(`username, full_name, website, avatar_url`)
		.eq('id', claims.sub)
		.single();

	return { claims, profile };
};

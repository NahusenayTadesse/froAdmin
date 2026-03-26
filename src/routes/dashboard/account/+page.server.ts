import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { db } from '$lib/server/db';
import { profiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: claimsData, error } = await supabase.auth.getClaims();

	if (error || !claimsData?.claims) {
		redirect(303, '/');
	}

	const { claims } = claimsData;

	// const { data: profile } = await supabase
	// 	.from('profiles')
	// 	.select(`username, full_name, website`)
	// 	.eq('id', claims.sub)
	// 	.single();

	const profile = await db
		.select()
		.from(profiles)
		.where(eq(profiles.id, claims.sub))
		.then((rows) => rows[0]);

	return { claims, profile };
};

export const actions: Actions = {
	update: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		console.log(formData);
		const fullName = formData.get('fullName') as string;
		const username = formData.get('username') as string;
		const website = formData.get('website') as string;
		const avatarUrl = formData.get('avatarUrl') as string;
		const email = formData.get('email') as string;

		const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

		if (claimsError || !claimsData?.claims) {
			return fail(401, { fullName, username, website, avatarUrl });
		}

		const { error } = await supabase.from('profiles').upsert({
			id: claimsData.claims.sub,
			first_name: fullName.split(' ')[0],
			last_name: fullName.split(' ')[1] || '',
			email,
			updated_at: new Date()
		});

		if (error) {
			console.error(error.message);
			return fail(500, {
				fullName,
				username,
				website,
				avatarUrl
			});
		}

		return {
			fullName,
			username,
			avatarUrl
		};
	},
	signout: async ({ locals: { supabase } }) => {
		await supabase.auth.signOut();
		redirect(303, '/');
	}
};

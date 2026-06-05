import { setError, superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';

import { addUserSchema as schema } from './schema';
import { db } from '$lib/server/db';
import { salesPersonProfiles as user, profiles, salesTiers } from '$lib/server/db/schema';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types.js';

// import { encodeBase32LowerCase } from '@oslojs/encoding';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(schema));

	const allProviders = await db
		.select({
			value: profiles.id,
			name: sql`COALESCE(${profiles.firstName}, '') || ' ' || COALESCE(${profiles.lastName}, '')`
		})
		.from(profiles)
		.where(eq(profiles.role, 'both'));

	const allSalesTiers = await db
		.select({
			value: salesTiers.id,
			name: salesTiers.name
		})
		.from(salesTiers);

	return {
		form,
		allProviders,
		allSalesTiers
	};
};

import { setFlash } from 'sveltekit-flash-message/server';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SERVICE_ROLE_KEY } from '$env/static/private';
import { sql, eq } from 'drizzle-orm';

export const actions: Actions = {
	addUser: async ({ request, cookies, locals: { supabase } }) => {
		const form = await superValidate(request, zod4(schema));
		console.log(form.data);

		// const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, PRIVATE_SERVICE_ROLE_KEY);

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check the form for Errors' }, cookies);

			return fail(400, {
				form
			});
		}

		const { provider, currentTier, status, canAlsoViewAffiliate } = form.data;

		console.log(form);

		try {
			await db.transaction(async (tx) => {
				// const { data: claimsData } = await supabase.auth.getClaims();

				// if (claimsData.claims.sub) {
				// 	return message(form, { type: 'error', text: 'Signed In User Not found' });
				// }
				// const { data, error } = await supabaseAdmin.auth.admin.createUser({
				// 	email,
				// 	password,
				// 	email_confirm: true,
				// 	user_metadata: { name: `${firstName} ${lastName}` }
				// });

				// if (error) {
				// 	console.error(error.message);
				// 	return message(form, { type: 'error', text: 'Error creating user: ' + error.message });
				// }

				await tx.insert(user).values({
					id: provider,
					userId: provider,
					currentTierId: currentTier,
					status,
					canAlsoViewAffiliate
				});
			});

			return message(form, { type: 'success', text: 'Sales Person created Successfully Created' });
		} catch (err: any) {
			console.error(err.message);
			return message(
				form,
				{
					type: 'error',
					text: 'Error Creating User: ' + err.message
				},
				{ status: 500 }
			);
		}
	}
};

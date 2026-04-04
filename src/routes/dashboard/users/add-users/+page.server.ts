import { setError, superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';

import { addUserSchema as schema } from './schema';
import { db } from '$lib/server/db';
import { roles, profiles as user } from '$lib/server/db/schema';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types.js';

// import { encodeBase32LowerCase } from '@oslojs/encoding';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(schema));

	const allRoles = await db
		.select({
			value: roles.id,
			name: roles.name
		})
		.from(roles);

	return {
		form,
		allRoles
	};
};

import { setFlash } from 'sveltekit-flash-message/server';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SERVICE_ROLE_KEY } from '$env/static/private';

export const actions: Actions = {
	addUser: async ({ request, cookies, locals: { supabase } }) => {
		const form = await superValidate(request, zod4(schema));
		console.log(form.data);

		const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, PRIVATE_SERVICE_ROLE_KEY);

		if (!form.valid) {
			setFlash({ type: 'error', message: 'Please check the form for Errors' }, cookies);

			return fail(400, {
				form
			});
		}

		const { firstName, lastName, email, role, password } = form.data;

		try {
			await db.transaction(async (tx) => {
				const { data: claimsData } = await supabase.auth.getClaims();

				// if (claimsData.claims.sub) {
				// 	return message(form, { type: 'error', text: 'Signed In User Not found' });
				// }
				const { data, error } = await supabaseAdmin.auth.admin.createUser({
					email,
					password,
					email_confirm: true,
					user_metadata: { name: `${firstName} ${lastName}` }
				});

				if (error) {
					console.error(error.message);
					return message(form, { type: 'error', text: 'Error creating user: ' + error.message });
				}

				await tx.insert(user).values({
					id: data.user.id,
					firstName,
					email,
					lastName,
					userId: data.user.id,
					roleId: role,
					createdBy: claimsData?.claims.sub
				});
			});

			return message(form, { type: 'success', text: 'User Successfully Created' });
		} catch (err: any) {
			if (err.code === 'ER_DUP_ENTRY') return setError(form, 'email', 'E-mail already exists.');
			console.error(err.message);
			return message(
				form,
				{
					type: 'error',
					text:
						err.code === 'ER_DUP_ENTRY'
							? 'E-mail already exists. Please choose another one.'
							: 'Error Creating User: ' + err.message
				},
				{ status: 500 }
			);
		}
	}
};

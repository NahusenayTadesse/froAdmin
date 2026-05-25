import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { editUserSchema as schema } from './schema';

import { db } from '$lib/server/db';
import { profiles as user } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { fail } from 'sveltekit-superforms';
import { setFlash } from 'sveltekit-flash-message/server';
import { error } from '@sveltejs/kit';
import { banUserSchema as ban, unBanUserSchema } from '$lib/ZodSchema';

import { z } from 'zod/v4';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;

	const idSchema = z.uuid();
	const validation = idSchema.safeParse(id);

	if (!validation.success) {
		error(404, 'Invalid ID, there is no User with this ID');
	}

	const singleUser = await db
		.select()
		.from(user)
		.where(eq(user.id, id))
		.then((rows) => rows[0]);
	if (!singleUser) {
		return fail(404, { message: 'User not found' });
	}

	let form;

	if (singleUser) form = await superValidate(singleUser, zod4(schema));
	else {
		form = await superValidate(zod4(schema));
	}

	const banForm = await superValidate(zod4(ban));
	const unBanForm = await superValidate(zod4(unBanUserSchema));

	return {
		singleUser,
		id,
		form,
		banForm,
		unBanForm
	};
};

import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SERVICE_ROLE_KEY } from '$env/static/private';
const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, PRIVATE_SERVICE_ROLE_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});

export const actions: Actions = {
	editUser: async ({ request, params }) => {
		const form = await superValidate(request, zod4(schema));

		const { id } = params;

		if (!form.valid) {
			// Stay on the same page and set a flash message
			return message(form, { type: 'error', text: 'Please check your form data.' });
		}

		const {
			firstName,
			lastName,
			email,
			role,
			phoneNumber,
			profilePhotoUrl,
			bio,
			locationCity,
			locationState,
			locationCountry,
			primaryAddress,
			latitude,
			longitude,

			version
		} = form.data;

		try {
			await db
				.update(user)
				.set({
					firstName,
					lastName,
					email,
					role,
					phoneNumber,
					profilePhotoUrl,
					bio,
					locationCity,
					locationState,
					locationCountry,
					primaryAddress,
					latitude,
					longitude,

					// Increment version by 1 on every successful update
					version: (version ?? 0) + 1,
					updatedAt: new Date() // Force refresh the timestamp
				})
				.where(eq(user.id, id));

			// Stay on the same page and set a flash message
			return message(form, { type: 'success', text: 'User Updated Successfully' });
		} catch (err) {
			return message(form, { type: 'error', text: 'User Update Failed ' + err?.message });
		}
	},
	ban: async ({ params, request }) => {
		const { id } = params;
		const form = await superValidate(request, zod4(ban));

		if (!id) return message(form, { type: 'error', text: 'User Not Found' }, { status: 400 });
		if (!form.valid) return message(form, { type: 'error', text: 'Please check your form data.' });

		const { banReason } = form.data;

		try {
			// Check Supabase FIRST before committing to DB
			const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
				ban_duration: '876000h'
			});

			if (updateError) {
				return message(
					form,
					{ type: 'error', text: `Supabase Error: ${updateError.message}` }, // ✅ text, not message
					{ status: 400 }
				);
			}

			const result = await db
				.update(user)
				.set({ banned: true, banReason, bannedAt: sql`now()` })
				.where(eq(user.id, id));

			const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(id, 'global');

			if (signOutError) {
				console.error('Error signing out banned user:', signOutError.message);
			}

			if (result.rowCount === 0) {
				return message(
					form,
					{ type: 'error', text: 'User not found in database' },
					{ status: 404 }
				);
			}

			return message(form, { type: 'success', text: 'User Banned Successfully' });
		} catch (err) {
			console.error('Error banning user:', err);
			return message(
				form,
				{ type: 'error', text: `Unexpected Error: ${err?.message}` },
				{ status: 500 }
			);
		}
	},
	unban: async ({ params, request }) => {
		const { id } = params;
		const form = await superValidate(request, zod4(unBanUserSchema));

		if (!id) return message(form, { type: 'error', text: 'User Not Found' }, { status: 400 });
		if (!form.valid) return message(form, { type: 'error', text: 'Please check your form data.' });

		try {
			// Check Supabase FIRST before committing to DB
			const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
				ban_duration: 'none'
			});

			if (updateError) {
				return message(
					form,
					{ type: 'error', text: `Supabase Error: ${updateError.message}` }, // ✅ text, not message
					{ status: 400 }
				);
			}

			const result = await db
				.update(user)
				.set({ banned: null, banReason: null, bannedAt: null })
				.where(eq(user.id, id));

			if (result.rowCount === 0) {
				return message(
					form,
					{ type: 'error', text: 'User not found in database' },
					{ status: 404 }
				);
			}

			return message(form, { type: 'success', text: 'User Unbanned Successfully' });
		} catch (err) {
			console.error('Error unbanning user:', err);
			return message(
				form,
				{ type: 'error', text: `Unexpected Error: ${err?.message}` },
				{ status: 500 }
			);
		}
	},
	delete: async ({ cookies, params }) => {
		const { id } = params;

		try {
			if (!id) {
				setFlash({ type: 'error', message: `Unexpected Error: ${err?.message}` }, cookies);
				return fail(400);
			}

			await db.delete(user).where(eq(user.id, id));

			setFlash({ type: 'success', message: 'User Deleted Successfully!' }, cookies);
		} catch (err) {
			console.error('Error deleting user:', err);
			setFlash({ type: 'error', message: `Unexpected Error: ${err?.message}` }, cookies);
			return fail(400);
		}
	}
};

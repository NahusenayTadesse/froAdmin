import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';

import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { changePasswordSchema as schema } from './schema';
import type { Actions, PageServerLoad } from './$types';
import { setFlash } from 'sveltekit-flash-message/server';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(schema));

	return { form };
};

export const actions: Actions = {
	changePassword: async (event) => {
		const {
			url,
			request,
			locals: { supabase }
		} = event;
		const form = await superValidate(request, zod4(schema));
		if (!form.valid) return fail(400, { form });
		const { email, currentPassword, newPassword } = form.data;

		const { error } = await supabase.auth.signInWithPassword({
			email, // You can get this from supabase.auth.getUser()
			password: currentPassword
		});

		if (error) {
			console.error('Verification failed:', error.message);
			return message(
				form,
				{ type: 'error', text: 'Current password is incorrect.' },
				{ status: 400 }
			);
		}

		const { error: updateError } = await supabase.auth.updateUser({
			password: newPassword
		});

		if (updateError) {
			console.error('Update failed:', updateError.message);
			return message(form, { type: 'error', text: 'Failed to update password.' }, { status: 500 });
		} else {
			console.log('Password updated successfully!');
			return message(form, { type: 'success', text: 'Password updated successfully.' });
		}
	}
};

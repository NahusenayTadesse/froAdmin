// import { encodeBase32LowerCase } from '@oslojs/encoding';

import type { Actions, PageServerLoad } from './$types';
import { message, setError, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { loginSchema } from '$lib/ZodSchema';
import { redirect } from 'sveltekit-flash-message/server';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		return redirect(302, '/dashboard');
	}
	const form = await superValidate(zod4(loginSchema));

	return { form };
};

export const actions: Actions = {
	login: async (event) => {
		const {
			url,
			request,
			locals: { supabase }
		} = event;
		const form = await superValidate(request, zod4(loginSchema));
		if (!form.valid) {
			return message(
				form,
				{
					type: 'error',
					text: 'Please Check the form}'
				},
				{
					status: 500
				}
			);
		}

		const { email, password } = form.data;

		console.log(form);

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (error) {
			setError(form, 'email', 'Invalid email or password');
			setError(form, 'password', 'Invalid email or password');
			return message(
				form,
				{
					type: 'error',
					text: 'An error occurred while logging in'
				},
				{
					status: 500
				}
			);
		}

		// return message(form, {
		// 	type: 'success',
		// 	text: 'Sign In Successful!'
		// });

		redirect('/dashboard', { type: 'success', message: 'Login Successful!' }, event.cookies);
	}
};

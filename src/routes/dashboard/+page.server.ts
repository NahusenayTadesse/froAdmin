import { fail } from '@sveltejs/kit';
import { redirect } from 'sveltekit-flash-message/server';
import type { Actions } from './$types';

export const actions: Actions = {
	logout: async ({ locals: { supabase }, cookies }) => {
		await supabase.auth.signOut();
		redirect('/login', { type: 'success', message: 'Logout Successful' }, cookies);
	}
};

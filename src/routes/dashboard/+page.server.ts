// import { fail } from '@sveltejs/kit';
// import { redirect } from 'sveltekit-flash-message/server';
// import type { Actions, PageServerLoad } from './$types';

// export const load: PageServerLoad = async ({ locals }) => {
// 	const {
// 		data: { session }
// 	} = await locals.supabase.auth.getSession();

// 	return {
// 		session
// 	};
// };

// export const actions: Actions = {
// 	logout: async ({ locals: { supabase }, cookies }) => {
// 		await supabase.auth.signOut();
// 		redirect('/login', { type: 'success', message: 'Logout Successful' }, cookies);
// 	}
// };

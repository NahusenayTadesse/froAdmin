import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { adminUsers as user, roles } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
	const {
		data: { session }
	} = await locals.supabase.auth.getSession();

	const {
		data: { user: currentUser },
		error: authError
	} = await locals.supabase.auth.getUser();

	if (authError || !currentUser) {
		redirect(303, '/login');
	}

	const singleUser = await db
		.select({
			id: user.id,
			fullname: sql<string>`concat(${user.firstName}, ' ', ${user.lastName})`,
			email: user.email,
			role: roles.name,
			status: user.banned,
			bannedAt: user.bannedAt,
			banReason: user.banReason,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt
		})
		.from(user)
		.leftJoin(roles, eq(user.roleId, roles.id))
		.where(eq(user.id, currentUser.id))
		.then((rows) => rows[0]);

	// Inside your load function or server logic
	if (singleUser.status) {
		error(403, {
			message: 'Account Restricted'
		});
	}

	return { profile: singleUser, session };
};

import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { adminUsers as user, roles } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
	const {
		data: { user: currentUser },
		error: authError
	} = await locals.supabase.auth.getUser();

	if (authError || !currentUser) {
		redirect(303, '/login');
	}

	// const { data: profile } = await db
	// 	.from('profiles')
	// 	.select(`username, full_name, website, avatar_url`)
	// 	.eq('id', claims.sub)
	// 	.single();

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

	if (singleUser.status) {
		error(
			403,
			'You have been banned from accessing this dashboard because ' + singleUser.banReason
		);
	}

	return { profile: singleUser };
};

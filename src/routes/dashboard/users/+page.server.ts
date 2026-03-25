import { db } from '$lib/server/db';
import { eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from '../$types';
import { profiles as user } from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
	const userList = await db
		.select({
			id: user.id,
			name: sql<string>`concat(${user.firstName}, ' ', ${user.lastName})`,
			email: user.email,
			role: user.role,
			status: user.isVerifiedProvider,
			createdAt: user.createdAt
		})
		.from(user);

	return {
		userList
	};
};

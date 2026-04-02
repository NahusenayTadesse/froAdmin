import { db } from '$lib/server/db';
import { eq, sql, countDistinct } from 'drizzle-orm';
import type { PageServerLoad } from '../$types';
import { adminUsers as user, roles, rolePermissions } from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
	const userList = await db
		.select({
			id: user.id,
			// Using COALESCE to handle nulls safely
			name: sql<string>`COALESCE(${user.firstName}, '') || ' ' || COALESCE(${user.lastName}, '')`,
			email: user.email,
			role: roles.name,
			roleId: user.roleId,
			status: user.banned,
			createdAt: user.createdAt,
			permissionsCount: countDistinct(rolePermissions.id)
		})
		.from(user)
		.leftJoin(roles, eq(roles.id, user.roleId))
		.leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
		.groupBy(
			user.id,
			user.firstName,
			user.lastName,
			user.email,
			roles.name,
			user.roleId,
			user.createdAt
		);

	return {
		userList
	};
};

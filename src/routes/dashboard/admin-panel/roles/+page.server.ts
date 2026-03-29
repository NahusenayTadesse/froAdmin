import { db } from '$lib/server/db';
import { eq, countDistinct, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { adminUsers as user, roles, rolePermissions } from '$lib/server/db/schema';

export const load: PageServerLoad = async () => {
	const roleList = await db
		.select({
			id: roles.id,
			name: roles.name,
			description: roles.description,
			userCount: countDistinct(user.id),
			permissionsCount: countDistinct(rolePermissions.id)
		})
		.from(roles)
		.leftJoin(
			user,

			eq(user.roleId, roles.id)
		)
		.leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
		.groupBy(roles.id);

	return {
		roleList
	};
};

import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';
import { profiles as user, services } from '$lib/server/db/schema';
import { eq, getTableColumns, count } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	try {
		// error(500, 'Server Error');
		const userList = await db
			.select({
				...getTableColumns(user),
				numberOfServices: count(services)
			})
			.from(user)
			.leftJoin(services, eq(services.providerId, user.id))
			.where(eq(user.role, 'both'))
			.groupBy(user.id);

		return { userList };
	} catch (e) {
		console.error('Full DB error:', JSON.stringify(e, null, 2));
		throw e;
	}
};

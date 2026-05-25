import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';
import { profiles as user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	try {
		const userList = await db.select().from(user).where(eq(user.role, 'customer'));
		return { userList };
	} catch (e) {
		console.error('Full DB error:', JSON.stringify(e, null, 2));
		throw e;
	}
};

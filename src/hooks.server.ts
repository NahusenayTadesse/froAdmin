import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import { error, type Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db'; // adjust to your db import
import { adminUsers as user } from '$lib/server/db/schema';

import { eq } from 'drizzle-orm';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				}
			}
		}
	);

	const {
		data: { session }
	} = await event.locals.supabase.auth.getSession();

	if (session?.user) {
		const [dbUser] = await db
			.select({ banned: user.banned })
			.from(user)
			.where(eq(user.id, session.user.id))
			.limit(1);

		if (dbUser?.banned) {
			// Destroy the session so they can't keep using stale tokens
			await event.locals.supabase.auth.signOut();
			error(403, {
				message: 'Account Restricted'
			}); // or '/login' or wherever you want
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

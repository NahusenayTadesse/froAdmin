import { db } from '$lib/server/db';
<<<<<<< HEAD
import { bookings, profiles, services, providerLedgerEntries } from '$lib/server/db/schema';
=======
import { bookings, profiles, services } from '$lib/server/db/schema';
>>>>>>> secondary/new-branch
import { and, asc, eq, sql, between, getTableColumns } from 'drizzle-orm';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;
	const { range } = params;

	const [y1, m1, d1, y2, m2, d2] = range.split('-');

	const start = `${y1}-${m1}-${d1}`;
	const end = `${y2}-${m2}-${d2}`;

	const cust = await db
		.select({
			fullName: sql<string>`concat(${profiles.firstName}, ' ', ${profiles.lastName})`
		})
		.from(profiles)
		.where(eq(profiles.id, id))
		.limit(1)
		.then((rows) => rows[0]);

	const allTransactions = await db
		.select({
			...getTableColumns(bookings),
<<<<<<< HEAD

=======
>>>>>>> secondary/new-branch
			customerName: sql<string>`concat(${profiles.firstName}, ' ', ${profiles.lastName})`,
			serviceName: services.title
		})
		.from(bookings)
		.leftJoin(services, eq(services.id, bookings.serviceId))
		.leftJoin(profiles, eq(profiles.id, bookings.customerId))
		.where(
			and(eq(bookings.providerId, id), between(bookings.createdAt, new Date(start), new Date(end)))
		)
		.orderBy(asc(bookings.createdAt));

	return {
		allTransactions,
		cust,
		start,
		end
	};
};

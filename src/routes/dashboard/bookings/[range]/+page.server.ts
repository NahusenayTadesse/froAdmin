import { db } from '$lib/server/db';
import { bookings, profiles, services } from '$lib/server/db/schema';
import { asc, eq, sql, between, getTableColumns, aliasedTable } from 'drizzle-orm';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { range } = params;

	const [y1, m1, d1, y2, m2, d2] = range.split('-');

	const start = `${y1}-${m1}-${d1}`;
	const end = `${y2}-${m2}-${d2}`;

	const customers = aliasedTable(profiles, 'customers');
	const providers = aliasedTable(profiles, 'providers');

	const allTransactions = await db
		.select({
			...getTableColumns(bookings),
			customerName: sql<string>`concat(${customers.firstName}, ' ', ${customers.lastName})`,
			providerName: sql<string>`concat(${providers.firstName}, ' ', ${providers.lastName})`,
			serviceName: services.title
		})
		.from(bookings)
		.leftJoin(services, eq(services.id, bookings.serviceId))
		.leftJoin(customers, eq(customers.id, bookings.customerId))
		.leftJoin(providers, eq(providers.id, bookings.providerId))
		.where(between(bookings.createdAt, new Date(start), new Date(end)))

		.orderBy(asc(bookings.createdAt));

	return {
		allTransactions,
		start,
		end
	};
};

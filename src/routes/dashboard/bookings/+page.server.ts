import { db } from '$lib/server/db';
import { bookings, profiles, services } from '$lib/server/db/schema';

import { and, asc, eq, getTableColumns, gte, ilike, lte, or, sql, aliasedTable } from 'drizzle-orm';

import type { PageServerLoad } from './$types';

function getStringParam(url: URL, key: string, fallback = '') {
	return url.searchParams.get(key)?.trim() ?? fallback;
}

function getTodayDateString() {
	return new Date().toISOString().slice(0, 10);
}

function getFirstDayOfCurrentMonthString() {
	const now = new Date();
	const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
	return firstDay.toISOString().slice(0, 10);
}

export const load: PageServerLoad = async ({ url }) => {
	const customers = aliasedTable(profiles, 'customers');
	const providers = aliasedTable(profiles, 'providers');

	const search = getStringParam(url, 'search');

	// Default bookings page to current month.
	// This avoids loading the full bookings table every time.
	const start = getStringParam(url, 'start', getFirstDayOfCurrentMonthString());
	const end = getStringParam(url, 'end', getTodayDateString());

	const bookingStatus = getStringParam(url, 'bookingStatus');
	const paymentStatus = getStringParam(url, 'paymentStatus');

	const customerFullName = sql<string>`
		trim(concat_ws(' ', ${customers.firstName}, ${customers.lastName}))
	`;

	const providerFullName = sql<string>`
		trim(concat_ws(' ', ${providers.firstName}, ${providers.lastName}))
	`;

	const whereConditions = and(
		start ? gte(bookings.scheduledDate, start) : undefined,
		end ? lte(bookings.scheduledDate, end) : undefined,

		bookingStatus ? eq(bookings.bookingStatus, bookingStatus) : undefined,
		paymentStatus ? eq(bookings.paymentStatus, paymentStatus) : undefined,

		search
			? or(
					ilike(customerFullName, `%${search}%`),
					ilike(providerFullName, `%${search}%`),
					ilike(services.title, `%${search}%`),
					ilike(bookings.address, `%${search}%`),
					ilike(bookings.notesFromCustomer, `%${search}%`)
				)
			: undefined
	);

	const allData = await db
		.select({
			...getTableColumns(bookings),
			customerName: customerFullName,
			providerName: providerFullName,
			serviceName: services.title
		})
		.from(bookings)
		.leftJoin(services, eq(services.id, bookings.serviceId))
		.leftJoin(customers, eq(customers.id, bookings.customerId))
		.leftJoin(providers, eq(providers.id, bookings.providerId))
		.where(whereConditions)
		.orderBy(asc(bookings.scheduledDate), asc(bookings.scheduledStartTime));

	return {
		allData,
		query: {
			search,
			start,
			end,
			bookingStatus,
			paymentStatus
		}
	};
};

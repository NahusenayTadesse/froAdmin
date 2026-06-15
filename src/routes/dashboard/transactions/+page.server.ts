import { db } from '$lib/server/db';
import { wallets, walletTransactions } from '$lib/server/db/schema';

import { and, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';

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

function startOfDay(date: string) {
	return new Date(`${date}T00:00:00.000Z`);
}

function endOfDay(date: string) {
	return new Date(`${date}T23:59:59.999Z`);
}

export const load: PageServerLoad = async ({ url }) => {
	const search = getStringParam(url, 'search');

	// Default to current month so the ledger does not load forever.
	const start = getStringParam(url, 'start', getFirstDayOfCurrentMonthString());
	const end = getStringParam(url, 'end', getTodayDateString());

	const type = getStringParam(url, 'type');
	const status = getStringParam(url, 'status');

	const whereConditions = and(
		start ? gte(walletTransactions.createdAt, startOfDay(start)) : undefined,
		end ? lte(walletTransactions.createdAt, endOfDay(end)) : undefined,

		type ? eq(walletTransactions.type, type) : undefined,
		status ? eq(walletTransactions.status, status) : undefined,

		search
			? or(
					ilike(walletTransactions.description, `%${search}%`),

					// Allows searching by booking ID text
					ilike(sql<string>`${walletTransactions.bookingId}::text`, `%${search}%`),

					// Allows searching by transaction ID text
					ilike(sql<string>`${walletTransactions.id}::text`, `%${search}%`)
				)
			: undefined
	);

	const allTransactions = await db
		.select({
			id: walletTransactions.id,
			amount: walletTransactions.amount,
			type: walletTransactions.type,
			status: walletTransactions.status,
			description: walletTransactions.description,
			bookingId: walletTransactions.bookingId,
			createdAt: walletTransactions.createdAt
		})
		.from(walletTransactions)
		.innerJoin(wallets, eq(walletTransactions.walletId, wallets.id))
		.where(whereConditions)
		.orderBy(desc(walletTransactions.createdAt));

	return {
		allTransactions,
		query: {
			search,
			start,
			end,
			type,
			status
		}
	};
};

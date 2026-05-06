import { db } from '$lib/server/db';
import { profiles, wallets, walletTransactions } from '$lib/server/db/schema';
import { and, desc, eq, sql, between } from 'drizzle-orm';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { range } = params;

	const [y1, m1, d1, y2, m2, d2] = range.split('-');

	const start = `${y1}-${m1}-${d1}`;
	const end = `${y2}-${m2}-${d2}`;

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
		.where(between(walletTransactions.createdAt, new Date(start), new Date(end)))
		.orderBy(desc(walletTransactions.createdAt)); // Most recent first

	return {
		allTransactions,
		start,
		end
	};
};

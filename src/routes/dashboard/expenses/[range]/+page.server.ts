import { db } from '$lib/server/db';
import { expenses, expensesType, adminUsers as user } from '$lib/server/db/schema';
import { and, desc, eq, sql, between } from 'drizzle-orm';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { range } = params as { range: string };

	const [y1, m1, d1, y2, m2, d2] = range.split('-');

	const start = `${y1}-${m1}-${d1}`;
	const end = `${y2}-${m2}-${d2}`;

	const allTransactions = await db
		.select({
			id: expenses.id,
			date: sql<string>`to_char(${expenses.expenseDate}, 'DD Mon YYYY')`,
			expensesType: expensesType.name,
			amount: expenses.total,
			reason: expenses.description,
			addedBy: sql<string>`concat(${user.firstName}, ' ', ${user.lastName})`,
			addedById: user.id
		})
		.from(expenses)
		.leftJoin(expensesType, eq(expenses.type, expensesType.id))
		.leftJoin(user, eq(expenses.createdBy, user.id))
		.where(between(expenses.expenseDate, start, end));
	return {
		allTransactions,
		start,
		end
	};
};

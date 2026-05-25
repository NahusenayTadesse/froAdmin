import { db } from '$lib/server/db';
import { expenses, expensesType, adminUsers as user } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;

	const [singleTransaction] = await db
		.select({
			id: expenses.id,
			date: sql<string>`to_char(${expenses.expenseDate}, 'DD Mon YYYY')`,
			type: expensesType.name,
			amount: expenses.total,
			reason: expenses.description,
			addedBy: sql<string>`concat(${user.firstName}, ' ', ${user.lastName})`,
			addedById: user.id
		})
		.from(expenses)
		.leftJoin(expensesType, eq(expenses.type, expensesType.id))
		.leftJoin(user, eq(expenses.createdBy, user.id))
		.where(eq(expenses.id, id))
		.limit(1);

	return {
		singleTransaction
	};
};

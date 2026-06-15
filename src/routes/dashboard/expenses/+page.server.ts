import { db } from '$lib/server/db';
import { expenses, expensesType, adminUsers as user } from '$lib/server/db/schema';

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

export const load: PageServerLoad = async ({ url }) => {
	const search = getStringParam(url, 'search');

	// Expenses are usually report-period based, so current month is a good default.
	const start = getStringParam(url, 'start', getFirstDayOfCurrentMonthString());
	const end = getStringParam(url, 'end', getTodayDateString());

	const expenseTypeId = getStringParam(url, 'expenseTypeId');
	const addedById = getStringParam(url, 'addedById');

	const addedByName = sql<string>`
		trim(concat_ws(' ', ${user.firstName}, ${user.lastName}))
	`;

	const whereConditions = and(
		start ? gte(expenses.expenseDate, start) : undefined,
		end ? lte(expenses.expenseDate, end) : undefined,

		expenseTypeId ? eq(expenses.type, expenseTypeId) : undefined,
		addedById ? eq(expenses.createdBy, addedById) : undefined,

		search
			? or(
					ilike(expenses.description, `%${search}%`),
					ilike(expensesType.name, `%${search}%`),
					ilike(addedByName, `%${search}%`)
				)
			: undefined
	);

	const allExpenses = await db
		.select({
			id: expenses.id,
			date: sql<string>`to_char(${expenses.expenseDate}, 'DD Mon YYYY')`,
			expenseType: expensesType.name,
			amount: expenses.total,
			reason: expenses.description,
			addedBy: addedByName,
			addedById: user.id
		})
		.from(expenses)
		.leftJoin(expensesType, eq(expenses.type, expensesType.id))
		.leftJoin(user, eq(expenses.createdBy, user.id))
		.where(whereConditions)
		.orderBy(desc(expenses.expenseDate));

	const expenseTypeList = await db
		.select({
			value: expensesType.id,
			name: expensesType.name
		})
		.from(expensesType)
		.orderBy(expensesType.name);

	const adminUserList = await db
		.select({
			value: user.id,
			name: addedByName
		})
		.from(user)
		.orderBy(user.firstName);

	return {
		allExpenses,
		expenseTypeList,
		adminUserList,
		query: {
			search,
			start,
			end,
			expenseTypeId,
			addedById
		}
	};
};

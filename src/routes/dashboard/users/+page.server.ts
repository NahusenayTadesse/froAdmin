import { db } from '$lib/server/db';
import type { PageServerLoad } from './$types';
import { profiles as user, services } from '$lib/server/db/schema';

import { and, or, eq, ilike, gte, getTableColumns, count, desc, sql } from 'drizzle-orm';
function getStringParam(url: URL, key: string, fallback = '') {
	return url.searchParams.get(key)?.trim() ?? fallback;
}

function getNumberParam(url: URL, key: string, fallback: number) {
	const value = Number(url.searchParams.get(key));
	return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getBooleanParam(url: URL, key: string): boolean | null {
	const value = url.searchParams.get(key);

	if (value === 'true') return true;
	if (value === 'false') return false;

	return null;
}

export const load: PageServerLoad = async ({ url }) => {
	try {
		const search = getStringParam(url, 'search');
		const page = getNumberParam(url, 'page', 1);
		const pageSize = getNumberParam(url, 'pageSize', 20);
		const banned = getBooleanParam(url, 'banned');

		const minRating = url.searchParams.get('minRating')
			? Number(url.searchParams.get('minRating'))
			: null;

		const minServices = url.searchParams.get('minServices')
			? Number(url.searchParams.get('minServices'))
			: null;

		const offset = (page - 1) * pageSize;

		const whereConditions = and(
			eq(user.role, 'customer'),

			search
				? or(
						ilike(user.firstName, `%${search}%`),
						ilike(user.lastName, `%${search}%`),
						ilike(user.email, `%${search}%`),
						ilike(user.phoneNumber, `%${search}%`),
						ilike(user.username, `%${search}%`),
						ilike(user.locationCity, `%${search}%`),
						ilike(user.locationState, `%${search}%`),
						ilike(user.locationCountry, `%${search}%`),

						// firstName + lastName
						ilike(sql<string>`concat_ws(' ', ${user.firstName}, ${user.lastName})`, `%${search}%`),

						// lastName + firstName, useful for "doe john"
						ilike(sql<string>`concat_ws(' ', ${user.lastName}, ${user.firstName})`, `%${search}%`)
					)
				: undefined,

			banned !== null ? eq(user.banned, banned) : undefined,

			minRating !== null && Number.isFinite(minRating)
				? gte(user.ratingAverage, minRating)
				: undefined
		);

		const serviceCount = count(services.id);

		const havingConditions = and(
			minServices !== null && Number.isFinite(minServices)
				? gte(serviceCount, minServices)
				: undefined
		);

		const filteredProvidersSubquery = db
			.select({
				id: user.id
			})
			.from(user)
			.where(whereConditions)
			.groupBy(user.id)
			.having(havingConditions)
			.as('filtered_providers');

		const [totalResult] = await db
			.select({
				total: count()
			})
			.from(filteredProvidersSubquery);

		const userList = await db
			.select()
			.from(user)
			.where(whereConditions)
			.groupBy(user.id)
			.having(havingConditions)
			.orderBy(desc(user.createdAt))
			.limit(pageSize)
			.offset(offset);

		const total = totalResult?.total ?? 0;
		const totalPages = Math.max(1, Math.ceil(total / pageSize));

		return {
			userList,
			query: {
				search,
				page,
				pageSize,
				banned,
				minRating,
				minServices
			},
			pagination: {
				page,
				pageSize,
				total,
				totalPages,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1
			}
		};
	} catch (e) {
		console.error('Full DB error:', JSON.stringify(e, null, 2));
		throw e;
	}
};

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

import { db } from '$lib/server/db';
import { salesPersonProfiles, salesTiers, salesCodes, salesReferrals } from '$lib/server/db/schema';

import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';

function getStringParam(url: URL, key: string, fallback = '') {
	return url.searchParams.get(key)?.trim() ?? fallback;
}

export const load: PageServerLoad = async ({ url }) => {
	try {
		const search = getStringParam(url, 'search');
		const status = getStringParam(url, 'status');
		const tierId = getStringParam(url, 'tierId');
		const activeCode = getStringParam(url, 'activeCode');

		const whereConditions = and(
			status ? eq(salesPersonProfiles.status, status) : undefined,

			tierId ? eq(salesPersonProfiles.currentTierId, tierId) : undefined,

			activeCode
				? sql<boolean>`EXISTS (
						SELECT 1
						FROM ${salesCodes}
						WHERE ${salesCodes.salesPersonId} = ${salesPersonProfiles.id}
						AND ${salesCodes.isActive} = true
						AND ${salesCodes.code} ILIKE ${`%${activeCode}%`}
					)`
				: undefined,

			search
				? or(
						ilike(sql<string>`${salesPersonProfiles.id}::text`, `%${search}%`),
						ilike(sql<string>`${salesPersonProfiles.userId}::text`, `%${search}%`),

						sql<boolean>`EXISTS (
							SELECT 1
							FROM ${salesCodes}
							WHERE ${salesCodes.salesPersonId} = ${salesPersonProfiles.id}
							AND ${salesCodes.code} ILIKE ${`%${search}%`}
						)`
					)
				: undefined
		);

		const salesPersonsQuery = db
			.select({
				id: salesPersonProfiles.id,
				userId: salesPersonProfiles.userId,
				status: salesPersonProfiles.status,
				totalSignups: salesPersonProfiles.totalSignups,
				totalEarnings: salesPersonProfiles.totalEarnings,
				pendingEarnings: salesPersonProfiles.pendingEarnings,
				availableBalance: salesPersonProfiles.availableBalance,
				createdAt: salesPersonProfiles.createdAt,

				tierName: salesTiers.name,
				tierRate: salesTiers.ratePerUser,

				activeCodes: sql<string[]>`COALESCE(
					(
						SELECT array_agg(${salesCodes.code})
						FROM ${salesCodes}
						WHERE ${salesCodes.salesPersonId} = ${salesPersonProfiles.id}
						AND ${salesCodes.isActive} = true
					),
					ARRAY[]::text[]
				)`,

				recentSignups30Days: sql<number>`(
					SELECT count(*)::int
					FROM ${salesReferrals}
					WHERE ${salesReferrals.salesPersonId} = ${salesPersonProfiles.id}
					AND ${salesReferrals.createdAt} >= NOW() - INTERVAL '30 days'
				)`
			})
			.from(salesPersonProfiles)
			.leftJoin(salesTiers, eq(salesPersonProfiles.currentTierId, salesTiers.id))
			.where(whereConditions)
			.orderBy(desc(salesPersonProfiles.createdAt));

		const countQuery = db
			.select({
				count: sql<number>`count(*)::int`
			})
			.from(salesPersonProfiles)
			.where(whereConditions);

		const tierListQuery = db
			.select({
				value: salesTiers.id,
				name: salesTiers.name
			})
			.from(salesTiers)
			.orderBy(salesTiers.name);

		const [salesPersons, totalCountResult, tierList] = await Promise.all([
			salesPersonsQuery,
			countQuery,
			tierListQuery
		]);

		const totalCount = totalCountResult[0]?.count ?? 0;

		return {
			salesPersons,
			totalCount,
			tierList,
			query: {
				search,
				status,
				tierId,
				activeCode
			}
		};
	} catch (err) {
		console.error('Failed to load admin sales dashboard data:', err);
		throw error(500, 'Internal Server Error');
	}
};

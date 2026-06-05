import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db'; // Your Drizzle DB instance
import { salesPersonProfiles, salesTiers, salesCodes, salesReferrals } from '$lib/server/db/schema';
import { eq, sql, desc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	try {
		const salesPersonsQuery = await db
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
				// Aggregate active codes into a string array so it doesn't multiply rows
				activeCodes: sql<string[]>`COALESCE(
					(
						SELECT array_agg(${salesCodes.code})
						FROM ${salesCodes}
						WHERE ${salesCodes.salesPersonId} = ${salesPersonProfiles.id}
						AND ${salesCodes.isActive} = true
					),
					ARRAY[]::text[]
				)`,
				// Subquery for conversions in the last 30 days to show recent performance momentum
				recentSignups30Days: sql<number>`(
					SELECT count(*)::int
					FROM ${salesReferrals}
					WHERE ${salesReferrals.salesPersonId} = ${salesPersonProfiles.id}
					AND ${salesReferrals.createdAt} >= NOW() - INTERVAL '30 days'
				)`
			})
			.from(salesPersonProfiles)
			.leftJoin(salesTiers, eq(salesPersonProfiles.currentTierId, salesTiers.id))
			.orderBy(desc(salesPersonProfiles.createdAt));

		// 4. Get total count for pagination metadata
		const countQuery = await db
			.select({ count: sql<number>`count(*)::int` })
			.from(salesPersonProfiles);

		// Run concurrently to avoid sequential network waterfall overhead
		const [salesPersons, totalCountResult] = await Promise.all([salesPersonsQuery, countQuery]);

		const totalCount = totalCountResult[0]?.count ?? 0;

		return {
			salesPersons,
			totalCount
		};
	} catch (err) {
		console.error('Failed to load admin sales dashboard data:', err);
		throw error(500, 'Internal Server Error');
	}
};

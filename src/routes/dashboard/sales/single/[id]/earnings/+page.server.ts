import { db } from '$lib/server/db';
import { salesTiers, salesEarnings, profiles } from '$lib/server/db/schema';
import { eq, desc, sql, ilike, or, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const { id } = params;

	// 1. Extract values from URL search params (with sensible defaults)
	const search = url.searchParams.get('search') ?? '';
	const pageSize = Math.min(Number(url.searchParams.get('pageSize') ?? 20), 100); // Cap at 100 for safety
	const earningsPage = Number(url.searchParams.get('earningsPage') ?? 1);
	const statusFilter = url.searchParams.get('status') ?? '';

	// 2. Build dynamic WHERE clauses based on user inputs
	const whereConditions = [eq(salesEarnings.salesPersonId, id)];

	// Apply status filter if selected
	if (statusFilter) {
		whereConditions.push(eq(salesEarnings.status, statusFilter));
	}

	// Apply global fuzzy search on text fields
	if (search) {
		whereConditions.push(
			or(
				ilike(profiles.firstName, `%${search}%`),
				ilike(profiles.lastName, `%${search}%`),
				ilike(profiles.email, `%${search}%`),
				ilike(salesTiers.name, `%${search}%`)
			)
		);
	}

	// 3. Execute query with dynamic limit and offset
	const earnings = await db
		.select({
			id: salesEarnings.id,
			amount: salesEarnings.amount,
			bonusAmount: salesEarnings.bonusAmount,
			currency: salesEarnings.currency,
			status: salesEarnings.status,
			createdAt: salesEarnings.createdAt,
			tierName: salesTiers.name,
			referredUserName: sql<string>`concat(${profiles.firstName}, ' ', ${profiles.lastName})`,
			referredUserId: profiles.id,
			referredUserEmail: profiles.email
		})
		.from(salesEarnings)
		.leftJoin(salesTiers, eq(salesEarnings.tierIdAtTime, salesTiers.id))
		.leftJoin(profiles, eq(salesEarnings.referredUserId, profiles.id))
		.where(and(...whereConditions))
		.orderBy(desc(salesEarnings.createdAt))
		.limit(pageSize)
		.offset((earningsPage - 1) * pageSize);

	if (!earnings) {
		error(404, 'Earnings data not found');
	}

	return {
		earnings,
		// Pass current state back down so frontend can bind inputs to server realities
		search,
		pageSize,
		statusFilter,
		earningsPage
	};
};

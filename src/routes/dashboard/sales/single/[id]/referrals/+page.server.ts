import { db } from '$lib/server/db';
import { salesTiers, salesReferrals, profiles } from '$lib/server/db/schema';
import { eq, desc, sql, ilike, or, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	const { id } = params;

	// 1. Extract values from URL search params (with sensible defaults)
	const search = url.searchParams.get('search') ?? '';
	const pageSize = Math.min(Number(url.searchParams.get('pageSize') ?? 20), 100); // Cap at 100 for safety
	const referalsPage = Number(url.searchParams.get('referalsPage') ?? 1);

	// 2. Build dynamic WHERE clauses based on user inputs
	const whereConditions = [eq(salesReferrals.salesPersonId, id)];

	// Apply global fuzzy search on text fields
	if (search) {
		whereConditions.push(
			or(
				ilike(profiles.firstName, `%${search}%`),
				ilike(profiles.lastName, `%${search}%`),
				ilike(profiles.email, `%${search}%`)
			)
		);
	}

	// 3. Execute query with dynamic limit and offset
	const referals = await db
		.select({
			id: salesReferrals.id,
			salesCode: salesReferrals.salesCode,
			attributionSource: salesReferrals.attributionSource,
			createdAt: salesReferrals.createdAt,
			referredUserId: profiles.id,
			referredUserName: sql<string>`concat(${profiles.firstName}, ' ', ${profiles.lastName})`,
			referredUserEmail: profiles.email
		})
		.from(salesReferrals)
		.innerJoin(profiles, eq(salesReferrals.referredUserId, profiles.id))
		.where(and(...whereConditions))
		.orderBy(desc(salesReferrals.createdAt))
		.limit(pageSize)
		.offset((referalsPage - 1) * pageSize);

	if (!referals) {
		error(404, 'Referals data not found');
	}

	return {
		referals,
		// Pass current state back down so frontend can bind inputs to server realities
		search,
		pageSize,
		referalsPage
	};
};

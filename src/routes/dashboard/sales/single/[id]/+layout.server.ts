import { db } from '$lib/server/db';
import { salesPersonProfiles, salesCodes, salesTiers, profiles } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { edit } from './schema';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params }) => {
	const { id } = params;

	const form = await superValidate(zod4(edit));
	const salesPerson = await db
		.select({
			// profile
			id: salesPersonProfiles.id,
			status: salesPersonProfiles.status,
			canAlsoViewAffiliate: salesPersonProfiles.canAlsoViewAffiliate,
			totalSignups: salesPersonProfiles.totalSignups,
			totalEarnings: salesPersonProfiles.totalEarnings,
			pendingEarnings: salesPersonProfiles.pendingEarnings,
			availableBalance: salesPersonProfiles.availableBalance,
			createdAt: salesPersonProfiles.createdAt,
			updatedAt: salesPersonProfiles.updatedAt,
			// user
			userId: profiles.id,
			name: sql`COALESCE(${profiles.firstName}, '') || ' ' || COALESCE(${profiles.lastName}, '')`,
			email: profiles.email,
			// code
			salesCode: salesCodes.code,
			codeIsActive: salesCodes.isActive,
			// tier
			tierName: salesTiers.name,
			tierRatePerUser: salesTiers.ratePerUser,
			tierMinSignups: salesTiers.minSignups,
			tierBonusThreshold: salesTiers.bonusThreshold,
			tierBonusAmount: salesTiers.bonusAmount
		})
		.from(salesPersonProfiles)
		.leftJoin(profiles, eq(salesPersonProfiles.userId, profiles.id))
		.leftJoin(salesCodes, eq(salesCodes.salesPersonId, salesPersonProfiles.id))
		.leftJoin(salesTiers, eq(salesPersonProfiles.currentTierId, salesTiers.id))
		.where(eq(salesPersonProfiles.id, id))
		.limit(1)
		.then((rows) => rows[0] ?? null);

	if (!salesPerson) {
		error(404, 'Sales person not found');
	}

	return { salesPerson, form };
};

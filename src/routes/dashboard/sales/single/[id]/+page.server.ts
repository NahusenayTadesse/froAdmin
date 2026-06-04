import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db'; // Adjust this path to your actual Drizzle db instance
import {
	affiliateCodes,
	affiliateCommissionEvents,
	affiliatePayoutItems,
	affiliatePayoutBatches,
	affiliateWithdrawalRequests
} from '$lib/server/db/schema';
import { sql, eq, and } from 'drizzle-orm';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { edit } from './schema';
import { z } from 'zod/v4';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id } = params;
	const idSchema = z.uuid();
	const validation = idSchema.safeParse(id);

	const affiliateId = id;

	if (!validation) {
		throw error(401, 'Unauthorized or missing affiliate identifier');
	}

	try {
		const result = await db
			.select({
				// --- Profile & Code Details ---
				affiliateUserId: affiliateCodes.affiliateUserId,
				activeCode: affiliateCodes.code,
				isCodeActive: affiliateCodes.isActive,

				// --- Lifetime Financial Metrics ---
				lifetimeGrossEarned: sql<string>`
					COALESCE(SUM(CASE WHEN ${affiliateCommissionEvents.status} IN ('payable', 'paid') THEN ${affiliateCommissionEvents.commissionAmount} ELSE 0 END), 0)
				`.mapWith(String),

				lifetimePaidOut: sql<string>`
					COALESCE(SUM(CASE WHEN ${affiliateCommissionEvents.status} = 'paid' THEN ${affiliateCommissionEvents.commissionAmount} ELSE 0 END), 0)
				`.mapWith(String),

				// --- Real-time Balance Buckets ---
				pendingHoldAmount: sql<string>`
					COALESCE(SUM(CASE WHEN ${affiliateCommissionEvents.status} = 'pending_hold' THEN ${affiliateCommissionEvents.commissionAmount} ELSE 0 END), 0)
				`.mapWith(String),

				payableAmount: sql<string>`
					COALESCE(SUM(CASE WHEN ${affiliateCommissionEvents.status} = 'payable' THEN ${affiliateCommissionEvents.commissionAmount} ELSE 0 END), 0)
				`.mapWith(String),

				// --- Conversion Funnel Metrics ---
				totalReferralEventsCount:
					sql<number>`COUNT(DISTINCT ${affiliateCommissionEvents.id})`.mapWith(Number),
				uniqueReferredUsersCount:
					sql<number>`COUNT(DISTINCT ${affiliateCommissionEvents.referredUserId})`.mapWith(Number),

				// --- Recent Batch Payout Activity ---
				lastBatchGross: affiliatePayoutItems.grossAmount,
				lastBatchNet: affiliatePayoutItems.netAmount,
				lastBatchStatus: affiliatePayoutItems.status,
				lastBatchId: affiliatePayoutBatches.id,
				lastBatchPeriodEnd: affiliatePayoutBatches.periodEnd,

				// --- Latest Manual Withdrawal Request Status ---
				latestWithdrawalAmount: affiliateWithdrawalRequests.amount,
				latestWithdrawalStatus: affiliateWithdrawalRequests.status,
				latestWithdrawalDate: affiliateWithdrawalRequests.requestedAt,
				latestWithdrawalFailure: affiliateWithdrawalRequests.failureReason
			})
			.from(affiliateCodes)
			.leftJoin(
				affiliateCommissionEvents,
				eq(affiliateCodes.affiliateUserId, affiliateCommissionEvents.affiliateUserId)
			)
			.leftJoin(
				affiliatePayoutItems,
				and(
					eq(affiliateCodes.affiliateUserId, affiliatePayoutItems.affiliateUserId),
					eq(
						affiliatePayoutItems.id,
						db
							.select({ id: affiliatePayoutItems.id })
							.from(affiliatePayoutItems)
							.where(eq(affiliatePayoutItems.affiliateUserId, affiliateId))
							.orderBy(sql`${affiliatePayoutItems.createdAt} DESC`)
							.limit(1)
					)
				)
			)
			.leftJoin(affiliatePayoutBatches, eq(affiliatePayoutItems.batchId, affiliatePayoutBatches.id))
			.leftJoin(
				affiliateWithdrawalRequests,
				and(
					eq(affiliateCodes.affiliateUserId, affiliateWithdrawalRequests.affiliateUserId),
					eq(
						affiliateWithdrawalRequests.id,
						db
							.select({ id: affiliateWithdrawalRequests.id })
							.from(affiliateWithdrawalRequests)
							.where(eq(affiliateWithdrawalRequests.affiliateUserId, affiliateId))
							.orderBy(sql`${affiliateWithdrawalRequests.createdAt} DESC`)
							.limit(1)
					)
				)
			)
			.where(eq(affiliateCodes.affiliateUserId, affiliateId))
			.groupBy(
				affiliateCodes.affiliateUserId,
				affiliateCodes.code,
				affiliateCodes.isActive,
				affiliatePayoutItems.id,
				affiliatePayoutItems.grossAmount,
				affiliatePayoutItems.netAmount,
				affiliatePayoutItems.status,
				affiliatePayoutBatches.id,
				affiliatePayoutBatches.periodEnd,
				affiliateWithdrawalRequests.id,
				affiliateWithdrawalRequests.amount,
				affiliateWithdrawalRequests.status,
				affiliateWithdrawalRequests.requestedAt,
				affiliateWithdrawalRequests.failureReason
			);

		const affiliateData = result[0];

		if (!affiliateData) {
			throw error(404, 'Affiliate metrics or active code record not found');
		}

		const form = await superValidate(affiliateData, zod4(edit));

		// SvelteKit expects simple JSON-serializable data structures returned from load functions
		return {
			affiliate: affiliateData,
			form
		};
	} catch (err) {
		console.error(`Failed to fetch affiliate metrics for ID ${affiliateId}:`, err);

		// If it's already a SvelteKit error, rethrow it
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		throw error(500, 'Internal Server Error while querying metrics data');
	}
};

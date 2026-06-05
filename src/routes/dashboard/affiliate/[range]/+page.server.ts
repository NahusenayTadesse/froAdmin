import type { PageServerLoad } from '../$types';
import { db } from '$lib/server/db';
import {
	affiliateCodes,
	affiliateCommissionEvents,
	affiliatePayoutItems,
	affiliatePayoutBatches,
	affiliateWithdrawalRequests
} from '$lib/server/db/schema';
import { sql, eq, between } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const { range } = params;

	const [y1, m1, d1, y2, m2, d2] = range.split('-');

	const start = `${y1}-${m1}-${d1}`;
	const end = `${y2}-${m2}-${d2}`;

	const payoutRankSub = db
		.select({
			affiliateUserId: affiliatePayoutItems.affiliateUserId,
			id: affiliatePayoutItems.id,
			rowNum:
				sql<number>`row_number() over (partition by ${affiliatePayoutItems.affiliateUserId} order by ${affiliatePayoutItems.createdAt} desc)`.as(
					'row_num'
				)
		})
		.from(affiliatePayoutItems)
		.as('payout_rank_sub');

	const latestPayoutSub = db
		.select({
			affiliateUserId: payoutRankSub.affiliateUserId,
			latestId: payoutRankSub.id
		})
		.from(payoutRankSub)
		.where(eq(payoutRankSub.rowNum, 1))
		.as('latest_payout_sub');

	// Isolates the latest withdrawal request ID for each affiliate user
	const withdrawalRankSub = db
		.select({
			affiliateUserId: affiliateWithdrawalRequests.affiliateUserId,
			id: affiliateWithdrawalRequests.id,
			rowNum:
				sql<number>`row_number() over (partition by ${affiliateWithdrawalRequests.affiliateUserId} order by ${affiliateWithdrawalRequests.createdAt} desc)`.as(
					'row_num'
				)
		})
		.from(affiliateWithdrawalRequests)
		.as('withdrawal_rank_sub');

	const latestWithdrawalSub = db
		.select({
			affiliateUserId: withdrawalRankSub.affiliateUserId,
			latestId: withdrawalRankSub.id
		})
		.from(withdrawalRankSub)
		.where(eq(withdrawalRankSub.rowNum, 1))
		.as('latest_withdrawal_sub');

	// --- Main Aggregation Query ---
	const affiliatesPromise = db
		.select({
			id: affiliateCodes.id,
			affiliateUserId: affiliateCodes.affiliateUserId,
			activeCode: affiliateCodes.code,
			isCodeActive: affiliateCodes.isActive,
			createdAt: affiliateCodes.createdAt,

			lifetimeGrossEarned: sql<string>`
					COALESCE(SUM(CASE WHEN ${affiliateCommissionEvents.status} IN ('payable', 'paid') THEN ${affiliateCommissionEvents.commissionAmount} ELSE 0 END), 0)
				`.mapWith(String),

			lifetimePaidOut: sql<string>`
					COALESCE(SUM(CASE WHEN ${affiliateCommissionEvents.status} = 'paid' THEN ${affiliateCommissionEvents.commissionAmount} ELSE 0 END), 0)
				`.mapWith(String),

			pendingHoldAmount: sql<string>`
					COALESCE(SUM(CASE WHEN ${affiliateCommissionEvents.status} = 'pending_hold' THEN ${affiliateCommissionEvents.commissionAmount} ELSE 0 END), 0)
				`.mapWith(String),

			payableAmount: sql<string>`
					COALESCE(SUM(CASE WHEN ${affiliateCommissionEvents.status} = 'payable' THEN ${affiliateCommissionEvents.commissionAmount} ELSE 0 END), 0)
				`.mapWith(String),

			totalReferralEventsCount:
				sql<number>`COUNT(DISTINCT ${affiliateCommissionEvents.id})`.mapWith(Number),
			uniqueReferredUsersCount:
				sql<number>`COUNT(DISTINCT ${affiliateCommissionEvents.referredUserId})`.mapWith(Number),

			lastBatchGross: affiliatePayoutItems.grossAmount,
			lastBatchNet: affiliatePayoutItems.netAmount,
			lastBatchStatus: affiliatePayoutItems.status,
			lastBatchId: affiliatePayoutBatches.id,
			lastBatchPeriodEnd: affiliatePayoutBatches.periodEnd,

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
		// Join our verified subqueries
		.leftJoin(latestPayoutSub, eq(affiliateCodes.affiliateUserId, latestPayoutSub.affiliateUserId))
		.leftJoin(affiliatePayoutItems, eq(affiliatePayoutItems.id, latestPayoutSub.latestId))
		.leftJoin(affiliatePayoutBatches, eq(affiliatePayoutItems.batchId, affiliatePayoutBatches.id))

		.leftJoin(
			latestWithdrawalSub,
			eq(affiliateCodes.affiliateUserId, latestWithdrawalSub.affiliateUserId)
		)
		.leftJoin(
			affiliateWithdrawalRequests,
			eq(affiliateWithdrawalRequests.id, latestWithdrawalSub.latestId)
		)

		.groupBy(
			affiliateCodes.id,
			affiliateCodes.affiliateUserId,
			affiliateCodes.code,
			affiliateCodes.isActive,
			affiliateCodes.createdAt,
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
		)
		.where(between(affiliateCodes.createdAt, new Date(start), new Date(end)))
		.orderBy(sql`${affiliateCodes.createdAt} DESC`);

	const affiliates = await affiliatesPromise;

	return {
		affiliates,
		start,
		end
	};
};

import type { PageServerLoad } from '../$types';
import { db } from '$lib/server/db';

import {
	affiliateCodes,
	affiliateCommissionEvents,
	affiliatePayoutItems,
	affiliatePayoutBatches,
	affiliateWithdrawalRequests
} from '$lib/server/db/schema';

import { and, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';

function getStringParam(url: URL, key: string, fallback = '') {
	return url.searchParams.get(key)?.trim() ?? fallback;
}

function getBooleanParam(url: URL, key: string): boolean | null {
	const value = url.searchParams.get(key);

	if (value === 'true') return true;
	if (value === 'false') return false;

	return null;
}

function getTodayDateString() {
	return new Date().toISOString().slice(0, 10);
}

function getFirstDayOfCurrentYearString() {
	const now = new Date();
	const firstDay = new Date(now.getFullYear(), 0, 1);
	return firstDay.toISOString().slice(0, 10);
}

function startOfDay(date: string) {
	return new Date(`${date}T00:00:00.000Z`);
}

function endOfDay(date: string) {
	return new Date(`${date}T23:59:59.999Z`);
}

export const load: PageServerLoad = async ({ url }) => {
	const search = getStringParam(url, 'search');

	// Default to current year. Change this to current month if the table grows very large.
	const start = getStringParam(url, 'start', getFirstDayOfCurrentYearString());
	const end = getStringParam(url, 'end', getTodayDateString());

	const isCodeActive = getBooleanParam(url, 'isCodeActive');
	const lastBatchStatus = getStringParam(url, 'lastBatchStatus');
	const latestWithdrawalStatus = getStringParam(url, 'latestWithdrawalStatus');

	const payoutRankSub = db
		.select({
			affiliateUserId: affiliatePayoutItems.affiliateUserId,
			id: affiliatePayoutItems.id,
			rowNum: sql<number>`row_number() over (
					partition by ${affiliatePayoutItems.affiliateUserId}
					order by ${affiliatePayoutItems.createdAt} desc
				)`.as('row_num')
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

	const withdrawalRankSub = db
		.select({
			affiliateUserId: affiliateWithdrawalRequests.affiliateUserId,
			id: affiliateWithdrawalRequests.id,
			rowNum: sql<number>`row_number() over (
					partition by ${affiliateWithdrawalRequests.affiliateUserId}
					order by ${affiliateWithdrawalRequests.createdAt} desc
				)`.as('row_num')
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

	const whereConditions = and(
		start ? gte(affiliateCodes.createdAt, startOfDay(start)) : undefined,
		end ? lte(affiliateCodes.createdAt, endOfDay(end)) : undefined,

		isCodeActive !== null ? eq(affiliateCodes.isActive, isCodeActive) : undefined,

		lastBatchStatus ? eq(affiliatePayoutItems.status, lastBatchStatus) : undefined,

		latestWithdrawalStatus
			? eq(affiliateWithdrawalRequests.status, latestWithdrawalStatus)
			: undefined,

		search
			? or(
					ilike(affiliateCodes.code, `%${search}%`),
					ilike(sql<string>`${affiliateCodes.affiliateUserId}::text`, `%${search}%`),
					ilike(sql<string>`${affiliateCodes.id}::text`, `%${search}%`)
				)
			: undefined
	);

	const affiliates = await db
		.select({
			id: affiliateCodes.id,
			affiliateUserId: affiliateCodes.affiliateUserId,
			activeCode: affiliateCodes.code,
			isCodeActive: affiliateCodes.isActive,
			createdAt: affiliateCodes.createdAt,

			lifetimeGrossEarned: sql<string>`
				COALESCE(
					SUM(
						CASE
							WHEN ${affiliateCommissionEvents.status} IN ('payable', 'paid')
							THEN ${affiliateCommissionEvents.commissionAmount}
							ELSE 0
						END
					),
					0
				)
			`.mapWith(String),

			lifetimePaidOut: sql<string>`
				COALESCE(
					SUM(
						CASE
							WHEN ${affiliateCommissionEvents.status} = 'paid'
							THEN ${affiliateCommissionEvents.commissionAmount}
							ELSE 0
						END
					),
					0
				)
			`.mapWith(String),

			pendingHoldAmount: sql<string>`
				COALESCE(
					SUM(
						CASE
							WHEN ${affiliateCommissionEvents.status} = 'pending_hold'
							THEN ${affiliateCommissionEvents.commissionAmount}
							ELSE 0
						END
					),
					0
				)
			`.mapWith(String),

			payableAmount: sql<string>`
				COALESCE(
					SUM(
						CASE
							WHEN ${affiliateCommissionEvents.status} = 'payable'
							THEN ${affiliateCommissionEvents.commissionAmount}
							ELSE 0
						END
					),
					0
				)
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
		.where(whereConditions)
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
		.orderBy(sql`${affiliateCodes.createdAt} DESC`);

	return {
		affiliates,
		query: {
			search,
			start,
			end,
			isCodeActive,
			lastBatchStatus,
			latestWithdrawalStatus
		}
	};
};

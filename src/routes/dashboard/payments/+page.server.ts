import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { env } from '$env/dynamic/private';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import {
	bookings,
	profiles,
	providerLedgerEntries,
	providerWalletBalances,
	providerWithdrawals,
	paymentEvents
} from '$lib/server/db/schema';
import { count, desc, eq, sql } from 'drizzle-orm';

const paymentsClient = env.DATABASE_URL
	? postgres(env.DATABASE_URL, { prepare: false })
	: null;

const paymentsDb = paymentsClient ? drizzle(paymentsClient) : null;

const toNumber = (value: unknown): number => {
	if (value === null || value === undefined) return 0;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
};

const UUID_REGEX =
	/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

const extractBookingId = (referenceType: string, referenceId: string) => {
	const combined = `${referenceType ?? ''} ${referenceId ?? ''}`.trim();
	const match = combined.match(UUID_REGEX);
	return match?.[0] ?? '';
};

const extractStatus = (referenceType: string, referenceId: string) => {
	const combined = `${referenceType ?? ''} ${referenceId ?? ''}`.trim();
	if (!combined) return '';
	const uuidMatch = combined.match(UUID_REGEX);
	if (!uuidMatch) return combined;
	return combined.replace(uuidMatch[0], '').trim();
};

const shouldFallbackOptionalSource = (error: unknown): boolean => {
	const message = (error as Error)?.message?.toLowerCase?.() ?? '';
	// Optional payment sources should never crash the overview page.
	// Fallback on missing relation, permission, or failed-query errors.
	return (
		message.includes('does not exist') ||
		message.includes('relation') ||
		message.includes('permission denied') ||
		message.includes('failed query:')
	);
};

export const load: PageServerLoad = async () => {
	// Keep bookings query lightweight for compatibility but do not use it as the core money metric.
	await db
		.select({
			paymentStatus: bookings.paymentStatus,
			count: count()
		})
		.from(bookings)
		.groupBy(bookings.paymentStatus);

	let ledgerSummary = {
		creditAvailable: 0,
		debitWithdrawal: 0,
		adjustmentNet: 0,
		holdBalance: 0,
		releaseHoldTotal: 0
	};
	const sources = {
		ledger: true,
		wallets: true,
		withdrawals: true,
		events: true
	};

	try {
		const ledgerRows = await (paymentsDb ?? db)
			.select({
				entryType: providerLedgerEntries.entryType,
				total: sql<string>`coalesce(sum(${providerLedgerEntries.amount}), 0)`
			})
			.from(providerLedgerEntries)
			.groupBy(providerLedgerEntries.entryType);

		const byEntryType = new Map(ledgerRows.map((row) => [row.entryType ?? 'unknown', toNumber(row.total)]));

		ledgerSummary = {
			creditAvailable: byEntryType.get('credit_available') ?? 0,
			debitWithdrawal: Math.abs(byEntryType.get('debit_withdrawal') ?? 0),
			adjustmentNet: byEntryType.get('adjustment') ?? 0,
			holdBalance: byEntryType.get('hold') ?? 0,
			releaseHoldTotal: byEntryType.get('release_hold') ?? 0
		};
	} catch (error) {
		if (!shouldFallbackOptionalSource(error)) throw error;
		sources.ledger = false;
	}

	let walletSummary: { available: string; pending: string; onHold: string }[] = [
		{ available: '0', pending: '0', onHold: '0' }
	];

	try {
		walletSummary = await (paymentsDb ?? db)
			.select({
				available: sql<string>`coalesce(sum(${providerWalletBalances.availableBalance}), 0)`,
				pending: sql<string>`coalesce(sum(${providerWalletBalances.pendingBalance}), 0)`,
				onHold: sql<string>`coalesce(sum(${providerWalletBalances.onHoldBalance}), 0)`
			})
			.from(providerWalletBalances);
	} catch (error) {
		if (!shouldFallbackOptionalSource(error)) throw error;
		sources.wallets = false;
	}

	let withdrawalSummary: { status: string | null; count: number }[] = [];
	let withdrawalTotalAmount = 0;

	try {
		withdrawalSummary = await (paymentsDb ?? db)
			.select({
				status: providerWithdrawals.status,
				count: count()
			})
			.from(providerWithdrawals)
			.groupBy(providerWithdrawals.status);

		const withdrawalAmount = await (paymentsDb ?? db)
			.select({
				total: sql<string>`coalesce(sum(${providerWithdrawals.amount}), 0)`
			})
			.from(providerWithdrawals);

		withdrawalTotalAmount = toNumber(withdrawalAmount[0]?.total);
	} catch (error) {
		if (!shouldFallbackOptionalSource(error)) throw error;
		sources.withdrawals = false;
	}

	let eventSummary = {
		paymentSucceeded: 0,
		paymentFailed: 0,
		refunds: 0,
		disputes: 0
	};

	try {
		const eventRows = await (paymentsDb ?? db)
			.select({
				eventType: paymentEvents.eventType,
				count: count()
			})
			.from(paymentEvents)
			.where(
				sql`${paymentEvents.eventType} in (
					'payment_intent.succeeded',
					'payment_intent.payment_failed',
					'charge.refunded',
					'charge.dispute.created',
					'charge.dispute.funds_withdrawn',
					'charge.dispute.funds_reinstated'
				)`
			)
			.groupBy(paymentEvents.eventType);

		const byEventType = new Map(eventRows.map((row) => [row.eventType ?? 'unknown', Number(row.count)]));

		eventSummary = {
			paymentSucceeded: byEventType.get('payment_intent.succeeded') ?? 0,
			paymentFailed: byEventType.get('payment_intent.payment_failed') ?? 0,
			refunds: byEventType.get('charge.refunded') ?? 0,
			disputes:
				(byEventType.get('charge.dispute.created') ?? 0) +
				(byEventType.get('charge.dispute.funds_withdrawn') ?? 0) +
				(byEventType.get('charge.dispute.funds_reinstated') ?? 0)
		};
	} catch (error) {
		if (!shouldFallbackOptionalSource(error)) throw error;
		sources.events = false;
	}

	const byWithdrawalStatus = new Map(
		withdrawalSummary.map((row) => [row.status ?? 'unknown', Number(row.count)])
	);

	let providerBalances: Array<{
		providerId: string;
		providerName: string;
		email: string;
		availableBalance: number;
		pendingBalance: number;
		onHoldBalance: number;
		totalWithdrawn: number;
		transactionCount: number;
	}> = [];

	let providerTransactions: Array<{
		id: string;
		providerId: string;
		providerName: string;
		status: string;
		entryType: string;
		amount: number;
		currency: string;
		bookingId: string;
		bookingTotalPrice: number;
		bookingPaymentStatus: string;
		bookingStatus: string;
		referenceType: string;
		referenceId: string;
		bookingReferenceId: string;
		note: string;
		createdAt: string;
	}> = [];

	let ledgerByType: Array<{ entryType: string; totalAmount: number; txnCount: number }> = [];
	let eventsByType: Array<{ eventType: string; count: number }> = [];
	let escrowBookings: Array<{
		bookingId: string;
		providerId: string;
		providerName: string;
		amount: number;
		paymentStatus: string;
		bookingStatus: string;
		updatedAt: string;
	}> = [];

	let failedBookingPaymentCount = 0;
	let failedBookingPayments: Array<{
		bookingId: string;
		providerId: string;
		providerName: string;
		amount: number;
		paymentIntentId: string;
		chargeId: string;
		paymentStatus: string;
		paymentFailureCode: string;
		paymentFailureMessage: string;
		paymentFailedAt: string;
		bookingStatus: string;
		updatedAt: string;
	}> = [];

	let failedWithdrawals: Array<{
		id: string;
		providerId: string;
		providerName: string;
		amount: number;
		currency: string;
		status: string;
		failureReason: string;
		requestedAt: string;
		processedAt: string;
	}> = [];

	let failedPaymentEvents: Array<{
		id: string;
		eventSource: string;
		eventType: string;
		stripeEventId: string;
		stripeObjectId: string;
		providerId: string;
		providerName: string;
		amount: number | null;
		createdAt: string;
	}> = [];

	try {
		const rows = await (paymentsDb ?? db)
			.select({
				providerId: providerWalletBalances.providerId,
				firstName: profiles.firstName,
				lastName: profiles.lastName,
				email: profiles.email,
				availableBalance: providerWalletBalances.availableBalance,
				pendingBalance: providerWalletBalances.pendingBalance,
				onHoldBalance: providerWalletBalances.onHoldBalance
			})
			.from(providerWalletBalances)
			.leftJoin(profiles, eq(providerWalletBalances.providerId, profiles.id));

		const withdrawnByProvider = await (paymentsDb ?? db)
			.select({
				providerId: providerWithdrawals.providerId,
				total: sql<string>`coalesce(sum(${providerWithdrawals.amount}),0)`
			})
			.from(providerWithdrawals)
			.groupBy(providerWithdrawals.providerId);

		const txCountByProvider = await (paymentsDb ?? db)
			.select({
				providerId: providerLedgerEntries.providerId,
				count: count()
			})
			.from(providerLedgerEntries)
			.groupBy(providerLedgerEntries.providerId);

		const withdrawnMap = new Map(withdrawnByProvider.map((r) => [r.providerId, toNumber(r.total)]));
		const txCountMap = new Map(txCountByProvider.map((r) => [r.providerId, Number(r.count)]));

		providerBalances = rows.map((r) => ({
			providerId: r.providerId,
			providerName: `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() || 'Unknown provider',
			email: r.email ?? '',
			availableBalance: toNumber(r.availableBalance),
			pendingBalance: toNumber(r.pendingBalance),
			onHoldBalance: toNumber(r.onHoldBalance),
			totalWithdrawn: withdrawnMap.get(r.providerId) ?? 0,
			transactionCount: txCountMap.get(r.providerId) ?? 0
		}));
	} catch (error) {
		if (!shouldFallbackOptionalSource(error)) throw error;
	}

	try {
		const txRows = await (paymentsDb ?? db)
			.select({
				id: providerLedgerEntries.id,
				providerId: providerLedgerEntries.providerId,
				bookingId: providerLedgerEntries.bookingId,
				firstName: profiles.firstName,
				lastName: profiles.lastName,
				entryType: providerLedgerEntries.entryType,
				amount: providerLedgerEntries.amount,
				currency: providerLedgerEntries.currency,
				bookingTotalPrice: bookings.totalPrice,
				bookingPaymentStatus: bookings.paymentStatus,
				bookingStatus: bookings.bookingStatus,
				referenceType: providerLedgerEntries.referenceType,
				referenceId: providerLedgerEntries.referenceId,
				note: providerLedgerEntries.note,
				createdAt: providerLedgerEntries.createdAt
			})
			.from(providerLedgerEntries)
			.leftJoin(bookings, eq(providerLedgerEntries.bookingId, bookings.id))
			.leftJoin(profiles, eq(providerLedgerEntries.providerId, profiles.id))
			.orderBy(desc(providerLedgerEntries.createdAt))
			.limit(300);

		providerTransactions = txRows.map((r) => ({
			status: extractStatus(r.referenceType ?? '', r.referenceId ?? ''),
			id: r.id,
			providerId: r.providerId,
			providerName: `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() || 'Unknown provider',
			entryType: r.entryType,
			amount: toNumber(r.amount),
			currency: r.currency ?? 'usd',
			bookingId: r.bookingId ?? '',
			bookingTotalPrice: toNumber(r.bookingTotalPrice),
			bookingPaymentStatus: r.bookingPaymentStatus ?? '',
			bookingStatus: r.bookingStatus ?? '',
			referenceType: r.referenceType ?? '',
			referenceId: r.referenceId ?? '',
			bookingReferenceId: extractBookingId(r.referenceType ?? '', r.referenceId ?? ''),
			note: r.note ?? '',
			createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : ''
		}));
	} catch (error) {
		if (!shouldFallbackOptionalSource(error)) throw error;
	}

	try {
		const rows = await (paymentsDb ?? db)
			.select({
				entryType: providerLedgerEntries.entryType,
				totalAmount: sql<string>`coalesce(sum(${providerLedgerEntries.amount}),0)`,
				txnCount: count()
			})
			.from(providerLedgerEntries)
			.groupBy(providerLedgerEntries.entryType);

		ledgerByType = rows.map((r) => ({
			entryType: r.entryType ?? 'unknown',
			totalAmount: toNumber(r.totalAmount),
			txnCount: Number(r.txnCount)
		}));
	} catch (error) {
		if (!shouldFallbackOptionalSource(error)) throw error;
	}

	try {
		const escrowRows = await (paymentsDb ?? db)
			.select({
				bookingId: bookings.id,
				providerId: bookings.providerId,
				firstName: profiles.firstName,
				lastName: profiles.lastName,
				amount: bookings.totalPrice,
				paymentStatus: bookings.paymentStatus,
				bookingStatus: bookings.bookingStatus,
				updatedAt: bookings.updatedAt
			})
			.from(bookings)
			.leftJoin(profiles, eq(bookings.providerId, profiles.id))
			.where(eq(bookings.paymentStatus, 'in_escrow'))
			.orderBy(desc(bookings.updatedAt))
			.limit(300);

		escrowBookings = escrowRows.map((r) => ({
			bookingId: r.bookingId,
			providerId: r.providerId,
			providerName: `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() || 'Unknown provider',
			amount: toNumber(r.amount),
			paymentStatus: r.paymentStatus ?? '',
			bookingStatus: r.bookingStatus ?? '',
			updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : ''
		}));

		const failedBookingRows = await (paymentsDb ?? db)
			.select({
				count: count()
			})
			.from(bookings)
			.where(eq(bookings.paymentStatus, 'failed'));

		failedBookingPaymentCount = Number(failedBookingRows[0]?.count ?? 0);

		const failedBookingListRows = await (paymentsDb ?? db).execute(sql`
			select
				b.id as booking_id,
				b.provider_id,
				coalesce(p.first_name, '') as first_name,
				coalesce(p.last_name, '') as last_name,
				b.total_price,
				b.payment_status,
				coalesce(b.payment_failure_code, '') as payment_failure_code,
				coalesce(b.payment_failure_message, '') as payment_failure_message,
				b.payment_failed_at,
				b.booking_status,
				b.updated_at,
				coalesce(b.stripe_payment_intent_id, '') as stripe_payment_intent_id,
				coalesce(b.stripe_charge_id, '') as stripe_charge_id
			from public.bookings b
			left join public.profiles p on p.id = b.provider_id
			where b.payment_status = 'failed'
			order by b.updated_at desc
			limit 300
		`);

		failedBookingPayments = (failedBookingListRows as any[]).map((r) => ({
			bookingId: String(r.booking_id ?? ''),
			providerId: String(r.provider_id ?? ''),
			providerName: `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || 'Unknown provider',
			amount: toNumber(r.total_price),
			paymentIntentId: String(r.stripe_payment_intent_id ?? ''),
			chargeId: String(r.stripe_charge_id ?? ''),
			paymentStatus: String(r.payment_status ?? ''),
			paymentFailureCode: String(r.payment_failure_code ?? ''),
			paymentFailureMessage: String(r.payment_failure_message ?? ''),
			paymentFailedAt: r.payment_failed_at ? new Date(r.payment_failed_at).toISOString() : '',
			bookingStatus: String(r.booking_status ?? ''),
			updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : ''
		}));
	} catch (error) {
		if (!shouldFallbackOptionalSource(error)) throw error;
	}

	try {
		const failedWithdrawalRows = await (paymentsDb ?? db)
			.select({
				id: providerWithdrawals.id,
				providerId: providerWithdrawals.providerId,
				firstName: profiles.firstName,
				lastName: profiles.lastName,
				amount: providerWithdrawals.amount,
				currency: providerWithdrawals.currency,
				status: providerWithdrawals.status,
				failureReason: providerWithdrawals.failureReason,
				requestedAt: providerWithdrawals.requestedAt,
				processedAt: providerWithdrawals.processedAt
			})
			.from(providerWithdrawals)
			.leftJoin(profiles, eq(providerWithdrawals.providerId, profiles.id))
			.where(eq(providerWithdrawals.status, 'failed'))
			.orderBy(desc(providerWithdrawals.requestedAt))
			.limit(300);

		failedWithdrawals = failedWithdrawalRows.map((r) => ({
			id: r.id,
			providerId: r.providerId,
			providerName: `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() || 'Unknown provider',
			amount: toNumber(r.amount),
			currency: r.currency ?? 'usd',
			status: r.status ?? '',
			failureReason: r.failureReason ?? '',
			requestedAt: r.requestedAt ? new Date(r.requestedAt).toISOString() : '',
			processedAt: r.processedAt ? new Date(r.processedAt).toISOString() : ''
		}));
	} catch (error) {
		if (!shouldFallbackOptionalSource(error)) throw error;
	}

	try {
		const rows = await (paymentsDb ?? db)
			.select({
				eventType: paymentEvents.eventType,
				count: count()
			})
			.from(paymentEvents)
			.groupBy(paymentEvents.eventType)
			.orderBy(desc(count()));

		eventsByType = rows.map((r) => ({ eventType: r.eventType ?? 'unknown', count: Number(r.count) }));

		const failedEventRows = await (paymentsDb ?? db).execute(sql`
			select
				pe.id,
				pe.event_source,
				pe.event_type,
				pe.stripe_event_id,
				pe.stripe_object_id,
				pe.created_at,
				coalesce(b.provider_id::text, '') as provider_id,
				coalesce(p.first_name, '') as first_name,
				coalesce(p.last_name, '') as last_name,
				b.total_price as amount
			from public.payment_events pe
			left join public.bookings b
				on (
					pe.stripe_object_id = b.stripe_payment_intent_id
					or pe.stripe_object_id = b.stripe_charge_id
					or pe.stripe_object_id = b.id::text
				)
			left join public.profiles p on p.id = b.provider_id
			where pe.event_type = 'payment_intent.payment_failed'
			order by pe.created_at desc
			limit 300
		`);

		failedPaymentEvents = (failedEventRows as any[]).map((r) => ({
			id: String(r.id ?? ''),
			eventSource: String(r.event_source ?? ''),
			eventType: String(r.event_type ?? ''),
			stripeEventId: String(r.stripe_event_id ?? ''),
			stripeObjectId: String(r.stripe_object_id ?? ''),
			providerId: String(r.provider_id ?? ''),
			providerName: `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || '-',
			amount: r.amount === null || r.amount === undefined ? null : toNumber(r.amount),
			createdAt: r.created_at ? new Date(r.created_at).toISOString() : ''
		}));
	} catch (error) {
		if (!shouldFallbackOptionalSource(error)) throw error;
	}

	return {
		sources,
		providerBalances,
		providerTransactions,
		escrowBookings,
		failedBookingPayments,
		failedWithdrawals,
		failedPaymentEvents,
		ledgerByType,
		eventsByType,
		metrics: {
			ledgerCreditAvailable: ledgerSummary.creditAvailable,
			ledgerDebitWithdrawal: ledgerSummary.debitWithdrawal,
			ledgerNetMovement:
				ledgerSummary.creditAvailable -
				ledgerSummary.debitWithdrawal +
				ledgerSummary.adjustmentNet -
				ledgerSummary.holdBalance +
				ledgerSummary.releaseHoldTotal,
			ledgerAdjustmentNet: ledgerSummary.adjustmentNet,
			ledgerHoldBalance: ledgerSummary.holdBalance,
			ledgerReleaseHoldTotal: ledgerSummary.releaseHoldTotal,
			ledgerHoldOutstanding: ledgerSummary.holdBalance - ledgerSummary.releaseHoldTotal,
			providerAvailableBalance: toNumber(walletSummary[0]?.available),
			providerPendingBalance: toNumber(walletSummary[0]?.pending),
			providerOnHoldBalance: toNumber(walletSummary[0]?.onHold),
			escrowTotalAmount: escrowBookings.reduce((sum, b) => sum + b.amount, 0),
			escrowBookingCount: escrowBookings.length,
			withdrawalTotalAmount,
			withdrawalRequestedCount: byWithdrawalStatus.get('requested') ?? 0,
			withdrawalProcessingCount: byWithdrawalStatus.get('processing') ?? 0,
			withdrawalPaidCount: byWithdrawalStatus.get('paid') ?? 0,
			withdrawalFailedCount: byWithdrawalStatus.get('failed') ?? 0,
			stripePaymentSucceededEvents: eventSummary.paymentSucceeded,
			stripePaymentFailures: eventSummary.paymentFailed,
			failedBookingPaymentCount,
			criticalPaymentFailureCount: failedBookingPayments.filter((b) =>
				['authorization_expired', 'amount_mismatch', 'insufficient_funds', 'payment_capture_failed'].includes(
					(b.paymentFailureCode ?? '').toLowerCase()
				)
			).length,
			stripeRefundEvents: eventSummary.refunds,
			stripeDisputeEvents: eventSummary.disputes
		}
	};
};

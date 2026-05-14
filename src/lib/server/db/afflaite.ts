import {
	pgTable,
	uuid,
	text,
	boolean,
	timestamp,
	jsonb,
	numeric,
	integer,
	check,
	date
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { profiles } from './schema';

export const providerLedgerEntries = pgTable(
	'provider_ledger_entries',
	{
		id: uuid('id').primaryKey().defaultRandom().notNull(),
		providerId: uuid('provider_id')
			.notNull()
			.references(() => profiles.id),
		bookingId: uuid('booking_id').references(() => bookings.id),

		// Using text with a check constraint as per your SQL
		entryType: text('entry_type').notNull(),

		amount: numeric('amount').notNull(),
		currency: text('currency').default('usd').notNull(),

		referenceType: text('reference_type'),
		referenceId: text('reference_id'),
		note: text('note'),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

		stripeEventId: text('stripe_event_id'),
		stripePaymentIntentId: text('stripe_payment_intent_id'),
		stripeChargeId: text('stripe_charge_id'),

		evidenceStatus: text('evidence_status').default('unverified').notNull()
	},
	(table) => ({
		// Replicating your SQL CHECK constraints
		entryTypeCheck: check(
			'entry_type_check',
			sql`${table.entryType} IN ('credit_pending', 'credit_available', 'debit_withdrawal', 'hold', 'release_hold', 'adjustment')`
		),
		evidenceStatusCheck: check(
			'evidence_status_check',
			sql`${table.evidenceStatus} IN ('unverified', 'verified', 'reversed')`
		)
	})
);

// 1. Affiliate Profiles
export const affiliateProfiles = pgTable('affiliate_profiles', {
	userId: uuid('user_id')
		.primaryKey()
		.references(() => profiles.id),
	status: text('status').notNull().default('active'), // Check constraint handled at DB level or Zod
	defaultCommissionBps: integer('default_commission_bps').notNull().default(500),
	holdDays: integer('hold_days').notNull().default(30),
	minimumWithdrawalAmount: numeric('minimum_withdrawal_amount').notNull().default('10.00'),
	payoutCurrency: text('payout_currency').notNull().default('usd'),
	payoutDetails: jsonb('payout_details').notNull().default({}),
	metadata: jsonb('metadata').notNull().default({}),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// 2. Affiliate Codes
export const affiliateCodes = pgTable('affiliate_codes', {
	id: uuid('id').primaryKey().defaultRandom(),
	affiliateUserId: uuid('affiliate_user_id')
		.notNull()
		.references(() => profiles.id),
	code: text('code').notNull(),
	isActive: boolean('is_active').notNull().default(true),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	metadata: jsonb('metadata').notNull().default({})
});

// 3. Affiliate Payout Batches
export const affiliatePayoutBatches = pgTable('affiliate_payout_batches', {
	id: uuid('id').primaryKey().defaultRandom(),
	periodStart: date('period_start').notNull(),
	periodEnd: date('period_end').notNull(),
	currency: text('currency').notNull().default('usd'),
	status: text('status').notNull().default('draft'),
	metadata: jsonb('metadata').notNull().default({}),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	processedAt: timestamp('processed_at', { withTimezone: true })
});

// 4. Affiliate Commission Events
export const affiliateCommissionEvents = pgTable('affiliate_commission_events', {
	id: uuid('id').primaryKey().defaultRandom(),
	affiliateUserId: uuid('affiliate_user_id')
		.notNull()
		.references(() => profiles.id),
	referredUserId: uuid('referred_user_id')
		.notNull()
		.references(() => profiles.id),
	providerLedgerEntryId: uuid('provider_ledger_entry_id').references(
		() => providerLedgerEntries.id
	),
	revenueEventId: text('revenue_event_id').notNull(),
	baseAmount: numeric('base_amount').notNull(),
	commissionBps: integer('commission_bps').notNull(),
	commissionAmount: numeric('commission_amount').notNull(),
	currency: text('currency').notNull().default('usd'),
	status: text('status').notNull().default('pending_hold'),
	payableAfter: timestamp('payable_after', { withTimezone: true }),
	payoutBatchId: uuid('payout_batch_id').references(() => affiliatePayoutBatches.id),
	metadata: jsonb('metadata').notNull().default({}),
	occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// 5. Affiliate Payout Items
export const affiliatePayoutItems = pgTable('affiliate_payout_items', {
	id: uuid('id').primaryKey().defaultRandom(),
	batchId: uuid('batch_id')
		.notNull()
		.references(() => affiliatePayoutBatches.id),
	affiliateUserId: uuid('affiliate_user_id')
		.notNull()
		.references(() => profiles.id),
	grossAmount: numeric('gross_amount').notNull(),
	adjustmentsAmount: numeric('adjustments_amount').notNull().default('0'),
	netAmount: numeric('net_amount').notNull(),
	currency: text('currency').notNull().default('usd'),
	status: text('status').notNull().default('locked'),
	metadata: jsonb('metadata').notNull().default({}),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// 6. Affiliate Wallet Transactions
export const affiliateWalletTransactions = pgTable('affiliate_wallet_transactions', {
	id: uuid('id').primaryKey().defaultRandom(),
	affiliateUserId: uuid('affiliate_user_id')
		.notNull()
		.references(() => profiles.id),
	kind: text('kind').notNull(),
	amount: numeric('amount').notNull(),
	currency: text('currency').notNull().default('usd'),
	referenceType: text('reference_type'),
	referenceId: text('reference_id'),
	note: text('note'),
	metadata: jsonb('metadata').notNull().default({}),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// 7. Affiliate Withdrawal Requests
export const affiliateWithdrawalRequests = pgTable('affiliate_withdrawal_requests', {
	id: uuid('id').primaryKey().defaultRandom(),
	affiliateUserId: uuid('affiliate_user_id')
		.notNull()
		.references(() => profiles.id),
	amount: numeric('amount').notNull(),
	currency: text('currency').notNull().default('usd'),
	status: text('status').notNull().default('requested'),
	payoutReference: text('payout_reference'),
	failureReason: text('failure_reason'),
	metadata: jsonb('metadata').notNull().default({}),
	requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
	processedAt: timestamp('processed_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// 8. Booking Live Locations
export const bookingLiveLocations = pgTable('booking_live_locations', {
	id: uuid('id').primaryKey().defaultRandom(),
	bookingId: uuid('booking_id')
		.notNull()
		.unique()
		.references(() => bookings.id),
	providerId: uuid('provider_id')
		.notNull()
		.references(() => profiles.id),
	latitude: sql`double precision`.notNull(), // Drizzle uses sql template for double precision specifically sometimes
	longitude: sql`double precision`.notNull(),
	accuracyMeters: sql`double precision`,
	headingDegrees: sql`double precision`,
	speedMps: sql`double precision`,
	capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

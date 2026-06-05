import {
	pgTable,
	uuid,
	text,
	doublePrecision,
	timestamp,
	integer,
	numeric,
	boolean,
	date,
	time,
	jsonb,
	check,
	bigint,
	index,
	uniqueIndex
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// --- Profiles & Users ---

export const profiles = pgTable('profiles', {
	id: uuid('id').primaryKey().notNull(), // References auth.users(id)
	role: text('role').default('customer').notNull(),
	firstName: text('first_name'),
	lastName: text('last_name'),
	email: text('email'),
	phoneNumber: text('phone_number'),
	profilePhotoUrl: text('profile_photo_url'),
	bio: text('bio'),
	locationCity: text('location_city'),
	locationState: text('location_state'),
	locationCountry: text('location_country'),
	primaryAddress: text('primary_address'),
	latitude: doublePrecision('latitude'),
	longitude: doublePrecision('longitude'),
	ratingAverage: doublePrecision('rating_average').default(0),
	ratingCount: integer('rating_count').default(0),
	isVerifiedProvider: boolean('is_verified_provider').default(false),
	verificationStatus: text('verification_status').default('not_started'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
	version: bigint('version', { mode: 'number' }),
	stripeCustomerId: text('stripe_customer_id').unique(),
	banned: boolean('banned'),
	banReason: text('ban_reason'),
	bannedAt: timestamp('banned_at', { withTimezone: true }),
	bannedBy: uuid('banned_by')
});

// --- Roles ---

export const roles = pgTable('roles', {
	id: uuid('id').primaryKey().notNull().defaultRandom(),
	name: text('name').notNull(),
	description: text('description'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// --- Role Permissions ---

// --- Admin User ---

export const adminUsers = pgTable('admin_users', {
	id: uuid('id').primaryKey().notNull(),
	firstName: text('first_name'),
	lastName: text('last_name'),
	email: text('email'),
	userId: uuid('provider_id').notNull(),
	createdBy: uuid('created_by').notNull(),
	roleId: uuid('role_id') // Foreign Key: Matches the type of roles.id
		.notNull()
		.references(() => roles.id),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
	banned: boolean('banned'),
	banReason: text('ban_reason'),
	bannedAt: timestamp('banned_at', { withTimezone: true }),
	bannedBy: uuid('banned_by')
});

export const rolePermissions = pgTable('role_permissions', {
	id: uuid('id').primaryKey().notNull().defaultRandom(),
	roleId: uuid('role_id') // Foreign Key: Matches the type of roles.id
		.notNull()
		.references(() => roles.id),
	permissionId: uuid('permission_id') // Foreign Key: Matches the type of permissions.id
		.notNull()
		.references(() => permissions.id),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

//--- Permissions ---

export const permissions = pgTable('permissions', {
	id: uuid('id').primaryKey().notNull().defaultRandom(),
	name: text('name').notNull(),
	description: text('description'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

//--- User Permissions ---

export const userPermissions = pgTable('user_permissions', {
	id: uuid('id').primaryKey().notNull().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => adminUsers.id),
	permissionId: uuid('permission_id') // Foreign Key: Matches the type of permissions.id
		.notNull()
		.references(() => permissions.id),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// --- Services & Categories ---

export const serviceCategories = pgTable('service_categories', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	imageUrl: text('image_url'),
	description: text('description'),
	isPopular: boolean('is_popular').default(false),
	sortOrder: integer('sort_order').default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
	allowImages: boolean('allow_images').default(true).notNull(),
	requiresBeforeImage: boolean('requires_before_image').default(false).notNull(),
	requiresAfterImage: boolean('requires_after_image').default(false).notNull(),
	status: boolean('status').default(true).notNull()
});

export const services = pgTable('services', {
	id: uuid('id').primaryKey().defaultRandom(),
	providerId: uuid('provider_id')
		.notNull()
		.references(() => profiles.id),
	categoryId: uuid('category_id').references(() => serviceCategories.id),
	title: text('title').notNull(),
	shortDescription: text('short_description'),
	fullDescription: text('full_description'),
	coverImageUrl: text('cover_image_url'),
	galleryImageUrls: text('gallery_image_urls')
		.array()
		.default(sql`'{}'::text[]`),
	basePrice: numeric('base_price').notNull(),
	pricingType: text('pricing_type').notNull(), // fixed, hourly, per_visit
	locationType: text('location_type').notNull(), // provider_location, customer_location, online
	serviceRadiusKm: integer('service_radius_km'),
	estimatedDurationMinutes: integer('estimated_duration_minutes'),
	minBookingNoticeHours: integer('min_booking_notice_hours').default(4),
	maxDailyBookings: integer('max_daily_bookings').default(10),
	isActive: boolean('is_active').default(true),
	averageRating: doublePrecision('average_rating').default(0),
	ratingCount: integer('rating_count').default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
	priceMin: numeric('price_min').default('5').notNull(),
	priceMax: numeric('price_max').default('500').notNull(),
	bookingEnabled: boolean('booking_enabled').default(true).notNull(),
	latitude: doublePrecision('latitude'),
	longitude: doublePrecision('longitude'),
	allowImages: boolean('allow_images'),
	requiresBeforeImage: boolean('requires_before_image'),
	requiresAfterImage: boolean('requires_after_image')
});

// --- Bookings ---

export const bookings = pgTable('bookings', {
	id: uuid('id').primaryKey().defaultRandom(),
	customerId: uuid('customer_id')
		.notNull()
		.references(() => profiles.id),
	providerId: uuid('provider_id')
		.notNull()
		.references(() => profiles.id),
	serviceId: uuid('service_id')
		.notNull()
		.references(() => services.id),
	scheduledDate: date('scheduled_date').notNull(),
	scheduledStartTime: time('scheduled_start_time').notNull(),
	scheduledEndTime: time('scheduled_end_time').notNull(),
	address: text('address'),
	latitude: doublePrecision('latitude'),
	longitude: doublePrecision('longitude'),
	notesFromCustomer: text('notes_from_customer'),
	bookingStatus: text('booking_status').default('pending').notNull(),
	paymentStatus: text('payment_status').default('pending').notNull(),
	paymentFailureCode: text('payment_failure_code'),
	paymentFailureMessage: text('payment_failure_message'),
	paymentFailedAt: timestamp('payment_failed_at', { withTimezone: true }),
	totalPrice: numeric('total_price').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
	startedAt: timestamp('started_at', { withTimezone: true }),
	providerMarkedDoneAt: timestamp('provider_marked_done_at', { withTimezone: true }),
	completedAt: timestamp('completed_at', { withTimezone: true }),
	canceledAt: timestamp('canceled_at', { withTimezone: true }),
	cancellationReason: text('cancellation_reason'),
	providerLiveState: text('provider_live_state'),
	arrivedAt: timestamp('arrived_at', { withTimezone: true }),
	serviceStartedAt: timestamp('service_started_at', { withTimezone: true }),
	autoCompletedAt: timestamp('auto_completed_at', { withTimezone: true }),
	beforeImageUrls: text('before_image_urls')
		.array()
		.notNull()
		.default(sql`'{}'::text[]`),
	afterImageUrls: text('after_image_urls')
		.array()
		.notNull()
		.default(sql`'{}'::text[]`)
});

// --- Payments & Wallet ---

export const wallets = pgTable('wallets', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.unique()
		.references(() => profiles.id),
	balance: numeric('balance').default('0'),
	pendingBalance: numeric('pending_balance').default('0'),
	totalEarnings: numeric('total_earnings').default('0'),
	totalTips: numeric('total_tips').default('0'),
	totalWithdrawals: numeric('total_withdrawals').default('0'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const walletTransactions = pgTable('wallet_transactions', {
	id: uuid('id').primaryKey().defaultRandom(),
	walletId: uuid('wallet_id')
		.notNull()
		.references(() => wallets.id),
	bookingId: uuid('booking_id').references(() => bookings.id),
	type: text('type').notNull(), // payment, tip, withdrawal, refund
	amount: numeric('amount').notNull(),
	description: text('description'),
	status: text('status').default('pending').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const videos = pgTable(
	'videos',
	{
		id: uuid('id').primaryKey().defaultRandom().notNull(),
		providerId: uuid('provider_id')
			.notNull()
			.references(() => profiles.id),
		serviceId: uuid('service_id')
			.notNull()
			.references(() => services.id),
		videoPath: text('video_path').notNull(),
		thumbnailPath: text('thumbnail_path'),
		title: text('title'),
		description: text('description'),
		durationSeconds: integer('duration_seconds'),
		aspectRatio: text('aspect_ratio').default('16:9'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
		verificationState: text('verification_state').default('UNVERIFIED').notNull(),
		isDiscoverable: boolean('is_discoverable').default(false).notNull(),
		displayOrder: integer('display_order').default(0).notNull(),
		complianceReviewed: boolean('compliance_reviewed').default(false).notNull(),
		complianceNotes: text('compliance_notes'),
		availabilitySyncedAt: timestamp('availability_synced_at', { withTimezone: true })
	},
	(table) => [
		check(
			'videos_verification_state_check',
			sql`${table.verificationState} IN ('UNVERIFIED', 'IDENTITY_VERIFIED', 'LICENSE_VERIFIED', 'RESTRICTED', 'SUSPENDED')`
		)
	]
);

export const providerWalletBalances = pgTable('provider_wallet_balances', {
	providerId: uuid('provider_id')
		.notNull()
		.primaryKey()
		.references(() => profiles.id),
	availableBalance: numeric('available_balance').default('0').notNull(),
	pendingBalance: numeric('pending_balance').default('0').notNull(),
	onHoldBalance: numeric('on_hold_balance').default('0').notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const providerWithdrawals = pgTable('provider_withdrawals', {
	id: uuid('id').primaryKey().defaultRandom(),
	providerId: uuid('provider_id')
		.notNull()
		.references(() => profiles.id),
	amount: numeric('amount').notNull(),
	currency: text('currency').default('usd').notNull(),
	status: text('status').default('requested').notNull(),
	requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow(),
	processedAt: timestamp('processed_at', { withTimezone: true }),
	failureReason: text('failure_reason'),
	stripePayoutId: text('stripe_payout_id'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const providerLedgerEntries = pgTable('provider_ledger_entries', {
	id: uuid('id').primaryKey().defaultRandom(),
	providerId: uuid('provider_id')
		.notNull()
		.references(() => profiles.id),
	bookingId: uuid('booking_id').references(() => bookings.id),
	entryType: text('entry_type').notNull(),
	amount: numeric('amount').notNull(),
	currency: text('currency').default('usd').notNull(),
	referenceType: text('reference_type'),
	referenceId: text('reference_id'),
	note: text('note'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const paymentEvents = pgTable('payment_events', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id').references(() => profiles.id),
	eventSource: text('event_source').notNull(),
	eventType: text('event_type').notNull(),
	stripeEventId: text('stripe_event_id'),
	stripeObjectId: text('stripe_object_id'),
	processedAt: timestamp('processed_at', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// --- Messaging ---

export const threads = pgTable('threads', {
	id: uuid('id').primaryKey().defaultRandom(),
	customerId: uuid('customer_id')
		.notNull()
		.references(() => profiles.id),
	providerId: uuid('provider_id')
		.notNull()
		.references(() => profiles.id),
	lastMessageText: text('last_message_text'),
	lastMessageTime: timestamp('last_message_time', { withTimezone: true }),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const messages = pgTable('messages', {
	id: uuid('id').primaryKey().defaultRandom(),
	threadId: uuid('thread_id')
		.notNull()
		.references(() => threads.id),
	senderId: uuid('sender_id')
		.notNull()
		.references(() => profiles.id),
	text: text('text').notNull(),
	isRead: boolean('is_read').default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	clientId: uuid('client_id')
});

// --- Location & Availability ---

export const bookingLiveLocations = pgTable('booking_live_locations', {
	id: uuid('id').primaryKey().defaultRandom(),
	bookingId: uuid('booking_id')
		.notNull()
		.unique()
		.references(() => bookings.id),
	providerId: uuid('provider_id')
		.notNull()
		.references(() => profiles.id),
	latitude: doublePrecision('latitude').notNull(),
	longitude: doublePrecision('longitude').notNull(),
	accuracyMeters: doublePrecision('accuracy_meters'),
	headingDegrees: doublePrecision('heading_degrees'),
	speedMps: doublePrecision('speed_mps'),
	capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const expenses = pgTable('expenses', {
	id: uuid('id').primaryKey().defaultRandom(),
	expenseDate: date('expense_date').notNull(),
	type: uuid('type')
		.notNull()
		.references(() => expensesType.id),
	createdBy: uuid('created_by')
		.notNull()
		.references(() => adminUsers.id),
	description: text('description'),
	total: numeric('total', { precision: 10, scale: 2 }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const expensesType = pgTable('expenses_type', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull().unique(),
	description: text('description')
});

export const affiliateCodes = pgTable(
	'affiliate_codes',
	{
		id: uuid('id').defaultRandom().primaryKey().notNull(),
		affiliateUserId: uuid('affiliate_user_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		code: text('code').notNull(),
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
		metadata: jsonb('metadata').default({}).notNull()
	},
	(table) => [
		uniqueIndex('idx_affiliate_codes_code_unique_ci').on(sql`lower(${table.code})`),
		index('idx_affiliate_codes_user_active').on(
			table.affiliateUserId,
			table.isActive,
			table.createdAt.desc()
		),
		check('affiliate_codes_code_format_check', sql`${table.code} ~ '^[A-Za-z0-9_-]{3,40}$'`)
	]
);

export const affiliatePayoutBatches = pgTable(
	'affiliate_payout_batches',
	{
		id: uuid('id').defaultRandom().primaryKey().notNull(),
		periodStart: date('period_start').notNull(),
		periodEnd: date('period_end').notNull(),
		currency: text('currency').default('usd').notNull(),
		status: text('status').default('draft').notNull(),
		metadata: jsonb('metadata').default({}).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		processedAt: timestamp('processed_at', { withTimezone: true })
	},
	(table) => [
		uniqueIndex('idx_affiliate_payout_batches_period_currency').on(
			table.periodStart,
			table.periodEnd,
			table.currency
		),

		check('affiliate_payout_batches_period_check', sql`${table.periodEnd} >= ${table.periodStart}`),
		check(
			'affiliate_payout_batches_status_check',
			sql`${table.status} IN ('draft', 'locked', 'processed', 'failed')`
		)
	]
);

export const affiliateCommissionEvents = pgTable(
	'affiliate_commission_events',
	{
		id: uuid('id').defaultRandom().primaryKey().notNull(),
		affiliateUserId: uuid('affiliate_user_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		referredUserId: uuid('referred_user_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		providerLedgerEntryId: uuid('provider_ledger_entry_id').references(
			() => providerLedgerEntries.id,
			{ onDelete: 'set null' }
		),
		revenueEventId: text('revenue_event_id').notNull(),
		baseAmount: numeric('base_amount', { precision: 12, scale: 2 }).notNull(),
		commissionBps: integer('commission_bps').notNull(),
		commissionAmount: numeric('commission_amount', { precision: 12, scale: 2 }).notNull(),
		currency: text('currency').default('usd').notNull(),
		status: text('status').default('pending_hold').notNull(),
		payableAfter: timestamp('payable_after', { withTimezone: true }),
		payoutBatchId: uuid('payout_batch_id').references(() => affiliatePayoutBatches.id, {
			onDelete: 'set null'
		}),
		metadata: jsonb('metadata').default({}).notNull(),
		occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		uniqueIndex('idx_affiliate_commission_events_revenue_affiliate').on(
			table.revenueEventId,
			table.affiliateUserId
		),

		index('idx_affiliate_commission_events_affiliate_status').on(
			table.affiliateUserId,
			table.status,
			table.occurredAt.desc()
		),

		check(
			'affiliate_commission_events_bps_check',
			sql`${table.commissionBps} >= 0 AND ${table.commissionBps} <= 10000`
		),

		check(
			'affiliate_commission_events_status_check',
			sql`${table.status} IN ('pending_hold', 'payable', 'paid', 'reversed')`
		)
	]
);

export const affiliatePayoutItems = pgTable(
	'affiliate_payout_items',
	{
		id: uuid('id').defaultRandom().primaryKey().notNull(),
		batchId: uuid('batch_id')
			.notNull()
			.references(() => affiliatePayoutBatches.id, { onDelete: 'cascade' }),
		affiliateUserId: uuid('affiliate_user_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		grossAmount: numeric('gross_amount', { precision: 12, scale: 2 }).notNull(),
		adjustmentsAmount: numeric('adjustments_amount', { precision: 12, scale: 2 })
			.default('0')
			.notNull(),
		netAmount: numeric('net_amount', { precision: 12, scale: 2 }).notNull(),
		currency: text('currency').default('usd').notNull(),
		status: text('status').default('locked').notNull(),
		metadata: jsonb('metadata').default({}).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		uniqueIndex('idx_affiliate_payout_items_batch_affiliate').on(
			table.batchId,
			table.affiliateUserId
		),

		check(
			'affiliate_payout_items_status_check',
			sql`${table.status} IN ('locked', 'credited', 'skipped')`
		)
	]
);
export const affiliateWithdrawalRequests = pgTable(
	'affiliate_withdrawal_requests',
	{
		id: uuid('id').defaultRandom().primaryKey().notNull(),
		affiliateUserId: uuid('affiliate_user_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
		currency: text('currency').default('usd').notNull(),
		status: text('status').default('requested').notNull(),
		payoutReference: text('payout_reference'),
		failureReason: text('failure_reason'),
		metadata: jsonb('metadata').default({}).notNull(),
		requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
		processedAt: timestamp('processed_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => [
		// Composite index for (affiliate_user_id, status, created_at desc)
		index('idx_affiliate_withdrawal_requests_affiliate_status').on(
			table.affiliateUserId,
			table.status,
			table.createdAt.desc()
		),

		check('affiliate_withdrawal_requests_positive_amount', sql`${table.amount} > 0`),

		check('affiliate_withdrawal_requests_positive_amount', sql`${table.amount} > 0`),

		check(
			'affiliate_withdrawal_requests_status_check',
			sql`${table.status} IN ('requested', 'processing', 'paid', 'failed', 'canceled')`
		)
	]
);

export const salesPersonProfiles = pgTable(
	'sales_person_profiles',
	{
		id: uuid('id').defaultRandom().primaryKey().notNull(),
		userId: uuid('user_id')
			.notNull()
			.unique() // Enforces sales_person_profiles_user_id_key
			.references(() => profiles.id, { onDelete: 'cascade' }),
		currentTierId: uuid('current_tier_id').references(() => salesTiers.id, {
			onDelete: 'set null'
		}), // Maps nullable tier reference
		status: text('status').default('active').notNull(),
		canAlsoViewAffiliate: boolean('can_also_view_affiliate').default(true).notNull(),
		totalSignups: integer('total_signups').default(0).notNull(),
		totalEarnings: numeric('total_earnings', { precision: 12, scale: 2 }).default('0').notNull(),
		pendingEarnings: numeric('pending_earnings', { precision: 12, scale: 2 })
			.default('0')
			.notNull(),
		availableBalance: numeric('available_balance', { precision: 12, scale: 2 })
			.default('0')
			.notNull(),
		metadata: jsonb('metadata').default({}).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => {
		return [
			// Composite index: (user_id, status)
			index('idx_sales_person_profiles_user_status').on(table.userId, table.status),

			// Status array check constraint
			check(
				'sales_person_profiles_status_check',
				sql`${table.status} = ANY(ARRAY['pending'::text, 'active'::text, 'suspended'::text, 'inactive'::text])`
			),

			// Multi-column balances check constraint
			check(
				'sales_person_profiles_money_check',
				sql`${table.totalEarnings} >= 0 AND ${table.pendingEarnings} >= 0 AND ${table.availableBalance} >= 0`
			),

			// Total signups non-negative constraint
			check('sales_person_profiles_total_signups_check', sql`${table.totalSignups} >= 0`)
		];
	}
);

export const salesCodes = pgTable(
	'sales_codes',
	{
		id: uuid('id').defaultRandom().primaryKey().notNull(),
		salesPersonId: uuid('sales_person_id')
			.notNull()
			// Replace with your actual salesPersonProfiles table reference if imported
			.references(() => salesPersonProfiles.id, { onDelete: 'cascade' }),
		code: text('code').notNull(),
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
		metadata: jsonb('metadata').default({}).notNull()
	},
	(table) => {
		return [
			// Case-insensitive unique index using lower(code)
			uniqueIndex('idx_sales_codes_code_unique_ci').on(sql`lower(${table.code})`),

			// Composite index: (sales_person_id, is_active, created_at desc)
			index('idx_sales_codes_person_active').on(
				table.salesPersonId,
				table.isActive,
				table.createdAt.desc()
			),

			// Check constraint for regex format
			check('sales_codes_code_format_check', sql`${table.code} ~ '^[A-Za-z0-9_-]{3,40}$'`)
		];
	}
);

export const salesEarnings = pgTable(
	'sales_earnings',
	{
		id: uuid('id').defaultRandom().primaryKey().notNull(),
		salesPersonId: uuid('sales_person_id')
			.notNull()
			.references(() => salesPersonProfiles.id, { onDelete: 'cascade' }),
		referralId: uuid('referral_id')
			.notNull()
			.unique() // Enforces the unique constraint sales_earnings_referral_id_key
			.references(() => salesReferrals.id, { onDelete: 'cascade' }),
		referredUserId: uuid('referred_user_id')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		tierIdAtTime: uuid('tier_id_at_time').references(() => salesTiers.id, {
			onDelete: 'set null'
		}),
		amount: numeric('amount', { precision: 12, scale: 2 }).default('0').notNull(),
		bonusAmount: numeric('bonus_amount', { precision: 12, scale: 2 }).default('0').notNull(),
		currency: text('currency').default('usd').notNull(),
		status: text('status').default('pending').notNull(),
		metadata: jsonb('metadata').default({}).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => {
		return [
			// Composite index: (sales_person_id, created_at desc)
			index('idx_sales_earnings_person_created').on(table.salesPersonId, table.createdAt.desc()),

			// Status enum/array check constraint
			check(
				'sales_earnings_status_check',
				sql`${table.status} = ANY(ARRAY['pending'::text, 'credited'::text, 'paid'::text, 'reversed'::text])`
			),

			// Financial limits check constraint
			check('sales_earnings_money_check', sql`${table.amount} >= 0 AND ${table.bonusAmount} >= 0`)
		];
	}
);

export const salesTiers = pgTable(
	'sales_tiers',
	{
		id: uuid('id').defaultRandom().primaryKey().notNull(),
		name: text('name').notNull().unique(), // Enforces sales_tiers_name_key
		minSignups: integer('min_signups').default(0).notNull(),
		ratePerUser: numeric('rate_per_user', { precision: 12, scale: 2 }).default('0').notNull(),
		bonusThreshold: integer('bonus_threshold'), // Nullable by default
		bonusAmount: numeric('bonus_amount', { precision: 12, scale: 2 }).default('0').notNull(),
		currency: text('currency').default('usd').notNull(),
		isActive: boolean('is_active').default(true).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => {
		return [
			// Composite Index: (is_active, min_signups desc)
			index('idx_sales_tiers_active_min_signups').on(table.isActive, table.minSignups.desc()),

			// Check constraints for non-negative values
			check('sales_tiers_bonus_amount_check', sql`${table.bonusAmount} >= 0`),

			check(
				'sales_tiers_bonus_threshold_check',
				sql`${table.bonusThreshold} IS NULL OR ${table.bonusThreshold} >= 0`
			),

			check('sales_tiers_min_signups_check', sql`${table.minSignups} >= 0`),

			check('sales_tiers_rate_per_user_check', sql`${table.ratePerUser} >= 0`)
		];
	}
);

export const salesReferrals = pgTable(
	'sales_referrals',
	{
		id: uuid('id').defaultRandom().primaryKey().notNull(),
		salesPersonId: uuid('sales_person_id')
			.notNull()
			.references(() => salesPersonProfiles.id, { onDelete: 'cascade' }),
		referredUserId: uuid('referred_user_id')
			.notNull()
			.unique() // Enforces the unique constraint sales_referrals_referred_user_id_key
			.references(() => profiles.id, { onDelete: 'cascade' }),
		salesCode: text('sales_code'), // Nullable by default
		attributionSource: text('attribution_source').default('manual_code').notNull(),
		metadata: jsonb('metadata').default({}).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(table) => {
		return [
			// Composite index: (sales_person_id, created_at desc)
			index('idx_sales_referrals_person_created').on(table.salesPersonId, table.createdAt.desc()),

			// Attribution source enum/array check constraint
			check(
				'sales_referrals_source_check',
				sql`${table.attributionSource} = ANY(ARRAY['manual_code'::text, 'sales_link'::text, 'admin'::text, 'unknown'::text])`
			)
		];
	}
);

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
	primaryKey,
	check,
	bigint
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

// export * from './afflaite';

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

export const videoDiscoveryFeaturesV1 = pgTable('video_discovery_features_v1', {
	// Primary Key and Foreign Key combined
	videoId: uuid('video_id')
		.primaryKey()
		.notNull()
		.references(() => videos.id),

	providerId: uuid('provider_id')
		.notNull()
		.references(() => profiles.id),

	serviceId: uuid('service_id')
		.notNull()
		.references(() => services.id),

	// Discovery Flags and Scores
	isDiscoverable: boolean('is_discoverable').default(false).notNull(),
	recencyScore: doublePrecision('recency_score').default(0).notNull(),
	qualityScore: doublePrecision('quality_score').default(0).notNull(),
	boostScore: doublePrecision('boost_score').default(0).notNull(),
	discoverScore: doublePrecision('discover_score').default(0).notNull(),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),

	// Raw Engagement Counters
	impressionCount: integer('impression_count').default(0).notNull(),
	clickCount: integer('click_count').default(0).notNull(),
	openCount: integer('open_count').default(0).notNull(),
	watchCount: integer('watch_count').default(0).notNull(),
	bookCount: integer('book_count').default(0).notNull(),

	// Calculated Rates and Final Engagement Score
	ctr: doublePrecision('ctr').default(0).notNull(),
	openRate: doublePrecision('open_rate').default(0).notNull(),
	watchRate: doublePrecision('watch_rate').default(0).notNull(),
	bookRate: doublePrecision('book_rate').default(0).notNull(),
	engagementScore: doublePrecision('engagement_score').default(0).notNull()
});

export const videoComments = pgTable(
	'video_comments',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		videoId: uuid('video_id')
			.notNull()
			.references(() => videos.id),
		userId: uuid('user_id')
			.notNull()
			.references(() => profiles.id),
		parentCommentId: uuid('parent_comment_id').references((): any => videoComments.id),
		commentText: text('comment_text').notNull(),
		likesCount: integer('likes_count').notNull().default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		// Implementing the length and whitespace check constraints
		check(
			'video_comments_comment_text_check',
			sql`length(trim(both from ${table.commentText})) > 0 AND length(${table.commentText}) <= 1000`
		),
		check('video_comments_likes_count_check', sql`${table.likesCount} >= 0`)
	]
);

export const videoCommentLikes = pgTable(
	'video_comment_likes',
	{
		commentId: uuid('comment_id')
			.notNull()
			.references(() => videoComments.id),
		userId: uuid('user_id')
			.notNull()
			.references(() => profiles.id),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [
		// Composite Primary Key
		primaryKey({ columns: [table.commentId, table.userId] })
	]
);

// export const videoBoostCampaigns = pgTable('video_boost_campaigns', {
// 	id: uuid('id').primaryKey().defaultRandom(),
// 	providerId: uuid('provider_id')
// 		.notNull()
// 		.references(() => profiles.id),
// 	videoId: uuid('video_id')
// 		.notNull()
// 		.references(() => videos.id),
// 	providerBoosterId: uuid('provider_booster_id')
// 		.notNull()
// 		.references(() => provider_boosters.id),
// 	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
// 	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
// });

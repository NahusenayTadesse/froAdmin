// Matches bookings.booking_status values in your schema
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'canceled';

// Matches wallet_transactions.type values
export type TransactionType = 'payment' | 'tip' | 'withdrawal' | 'refund';

// Activity event types derived from bookings + wallet_transactions + profiles
export type ActivityEventType =
	| 'booking_created'
	| 'booking_started'
	| 'booking_completed'
	| 'cancelled'
	| 'payment'
	| 'new_user';

// ─── Sub-shapes ────────────────────────────────────────────────────────────────

/** Aggregated KPI numbers for today */
export interface DailyKpis {
	/** Total bookings created today (bookings.created_at) */
	totalBookings: number;
	/** vs yesterday delta (positive = up, negative = down) */
	bookingsChange: number;

	/** Sum of wallet_transactions.amount where type = 'payment' today */
	revenueToday: number;
	/** Revenue % change vs yesterday */
	revenueChangePct: number;

	/** Count of profiles.created_at today */
	newRegistrations: number;
	/** vs yesterday delta */
	registrationsChange: number;

	/** Count of bookings where booking_status = 'in_progress' right now */
	activeNow: number;
}

/** One row in the booking pipeline breakdown */
export interface PipelineItem {
	status: BookingStatus;
	label: string;
	count: number;
	/** Percentage of total bookings today (0-100) */
	pct: number;
}

/** A single booking row for the today's bookings list
 *  Derived from: bookings JOIN services JOIN profiles (customer + provider)
 */
export interface BookingRow {
	id: string;
	/** profiles.first_name + last_name of customer */
	customer: string;
	/** services.title */
	service: string;
	/** Provider's profiles.first_name + last_name (or business name) */
	provider: string;
	/** bookings.scheduled_start_time — display string e.g. "09:00" */
	time: string;
	status: BookingStatus;
	/** bookings.total_price */
	price: number;
	/** bookings.address */
	address: string;
}

/** One event in the live activity feed
 *  Derived from bookings state changes + wallet_transactions + profiles inserts
 */
export interface ActivityEvent {
	type: ActivityEventType;
	/** Human-readable headline */
	msg: string;
	/** Supporting detail line */
	sub: string;
	/** Relative time string e.g. "2m ago", "1h 14m ago" */
	time: string;
}

/** One row in the top providers leaderboard
 *  Derived from wallets + bookings grouped by provider_id
 */
export interface ProviderStat {
	/** profiles.first_name + last_name or business name */
	name: string;
	/** Count of bookings today */
	bookings: number;
	/** Sum of wallet_transactions.amount credited today */
	earnings: number;
}

/** Count of bookings per hour for the last 12 hours
 *  Derived from bookings.created_at bucketed by hour
 */
export interface HourlyBucket {
	/** Display label e.g. "9a", "12p" */
	label: string;
	count: number;
	/** Whether this is the current hour */
	isCurrent: boolean;
}

// ─── Root prop ─────────────────────────────────────────────────────────────────

export interface DailyDashboardData {
	kpis: DailyKpis;
	pipeline: PipelineItem[];
	recentBookings: BookingRow[];
	activityFeed: ActivityEvent[];
	topProviders: ProviderStat[];
	/** 12-item array: one bucket per hour for the past 12 hours */
	hourlyActivity: HourlyBucket[];
}

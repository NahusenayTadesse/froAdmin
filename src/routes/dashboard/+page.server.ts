// src/routes/admin/+page.server.ts
import type { PageServerLoad } from './$types';
import type {
	DailyDashboardData,
	BookingStatus,
	ActivityEvent,
	ActivityEventType,
	HourlyBucket
} from '$lib/components/dashboard/dashboard.types';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function todayRange() {
	const start = new Date();
	start.setHours(0, 0, 0, 0);
	const end = new Date();
	end.setHours(23, 59, 59, 999);
	return { start: start.toISOString(), end: end.toISOString() };
}

function yesterdayRange() {
	const start = new Date(Date.now() - 864e5);
	start.setHours(0, 0, 0, 0);
	const end = new Date(start);
	end.setHours(23, 59, 59, 999);
	return { start: start.toISOString(), end: end.toISOString() };
}

function pctChange(today: number, yesterday: number): number {
	if (yesterday === 0) return today > 0 ? 100 : 0;
	return Math.round(((today - yesterday) / yesterday) * 100);
}

function hourLabel(h: number): string {
	if (h === 0) return '12a';
	if (h < 12) return `${h}a`;
	if (h === 12) return '12p';
	return `${h - 12}p`;
}

// ─── Loader ────────────────────────────────────────────────────────────────────

export const load: PageServerLoad = async ({ locals }) => {
	// `locals.supabase` is set up via @supabase/auth-helpers-sveltekit.
	// Swap for your own DB client if you use Drizzle directly.
	const supabase = locals.supabase;

	const { start: todayStart, end: todayEnd } = todayRange();
	const { start: yStart, end: yEnd } = yesterdayRange();
	const currentHour = new Date().getHours();

	// ── Run all queries concurrently ──────────────────────────────────────────
	const [
		todayBookingsRes,
		yBookingsRes,
		todayRevenueRes,
		yRevenueRes,
		todayUsersRes,
		yUsersRes,
		activeRes,
		pipelineRes,
		recentRes,
		feedRes,
		reportCasesRes,
		reportMessagesRes,
		providersRes,
		hourlyRes
	] = await Promise.all([
		// 1. Total bookings today
		supabase
			.from('bookings')
			.select('id', { count: 'exact', head: true })
			.gte('created_at', todayStart)
			.lte('created_at', todayEnd),

		// 2. Total bookings yesterday
		supabase
			.from('bookings')
			.select('id', { count: 'exact', head: true })
			.gte('created_at', yStart)
			.lte('created_at', yEnd),

		// 3. Revenue today (sum of wallet_transactions where type = 'payment')
		supabase
			.from('wallet_transactions')
			.select('amount')
			.eq('type', 'payment')
			.eq('status', 'completed')
			.gte('created_at', todayStart)
			.lte('created_at', todayEnd),

		// 4. Revenue yesterday
		supabase
			.from('wallet_transactions')
			.select('amount')
			.eq('type', 'payment')
			.eq('status', 'completed')
			.gte('created_at', yStart)
			.lte('created_at', yEnd),

		// 5. New profiles today
		supabase
			.from('profiles')
			.select('id', { count: 'exact', head: true })
			.gte('created_at', todayStart)
			.lte('created_at', todayEnd),

		// 6. New profiles yesterday
		supabase
			.from('profiles')
			.select('id', { count: 'exact', head: true })
			.gte('created_at', yStart)
			.lte('created_at', yEnd),

		// 7. Active bookings right now
		supabase
			.from('bookings')
			.select('id', { count: 'exact', head: true })
			.eq('booking_status', 'in_progress'),

		// 8. Pipeline: count per status for today
		supabase
			.from('bookings')
			.select('booking_status')
			.gte('created_at', todayStart)
			.lte('created_at', todayEnd),

		// 9. Recent bookings with joined service + profiles
		supabase
			.from('bookings')
			.select(
				`
				id,
				scheduled_start_time,
				total_price,
				booking_status,
				address,
				services ( title ),
				customer:profiles!bookings_customer_id_fkey ( first_name, last_name ),
				provider:profiles!bookings_provider_id_fkey ( first_name, last_name )
			`
			)
			.gte('scheduled_date', new Date().toISOString().slice(0, 10))
			.order('scheduled_start_time', { ascending: true })
			.limit(8),

		// 10. Activity feed — last 20 bookings updated today with status changes
		supabase
			.from('bookings')
			.select(
				`
				id,
				booking_status,
				updated_at,
				total_price,
				cancellation_reason,
				services ( title ),
				customer:profiles!bookings_customer_id_fkey ( first_name, last_name ),
				provider:profiles!bookings_provider_id_fkey ( first_name, last_name )
			`
			)
			.gte('updated_at', todayStart)
			.order('updated_at', { ascending: false })
			.limit(20),

		// 11. Recent dispute/report cases for the admin activity feed
		supabase
			.from('report_cases')
			.select('id,type,subject,description,status,severity,created_at,updated_at')
			.order('updated_at', { ascending: false })
			.limit(10),

		// 12. Recent dispute/report chat messages for the admin activity feed
		supabase
			.from('report_case_messages')
			.select('id,case_id,sender_role,body,created_at,report_cases ( type, subject )')
			.order('created_at', { ascending: false })
			.limit(10),

		// 13. Top providers by earnings today
		supabase
			.from('wallet_transactions')
			.select('wallet_id, amount, wallets ( user_id, profiles ( first_name, last_name ) )')
			.eq('type', 'payment')
			.eq('status', 'completed')
			.gte('created_at', todayStart)
			.lte('created_at', todayEnd),

		// 14. Hourly booking counts for the past 12 hours
		supabase
			.from('bookings')
			.select('created_at')
			.gte('created_at', new Date(Date.now() - 12 * 36e5).toISOString())
			.lte('created_at', todayEnd)
	]);

	// ── Shape the data ────────────────────────────────────────────────────────

	// KPIs
	const todayCount = todayBookingsRes.count ?? 0;
	const yCount = yBookingsRes.count ?? 0;

	const sumAmounts = (rows: { amount: string }[] | null) =>
		(rows ?? []).reduce((s, r) => s + parseFloat(r.amount), 0);

	const revenueToday = sumAmounts(todayRevenueRes.data);
	const revenueYest = sumAmounts(yRevenueRes.data);

	const newUsersToday = todayUsersRes.count ?? 0;
	const newUsersYest = yUsersRes.count ?? 0;

	// Pipeline
	const STATUS_ORDER: BookingStatus[] = [
		'pending',
		'confirmed',
		'in_progress',
		'completed',
		'canceled'
	];
	const STATUS_LABELS: Record<BookingStatus, string> = {
		pending: 'Pending',
		confirmed: 'Confirmed',
		in_progress: 'In Progress',
		completed: 'Completed',
		canceled: 'Cancelled'
	};
	const rawStatuses = (pipelineRes.data ?? []).map((r) => r.booking_status as BookingStatus);
	const total = rawStatuses.length || 1;
	const pipeline = STATUS_ORDER.map((s) => {
		const count = rawStatuses.filter((x) => x === s).length;
		return { status: s, label: STATUS_LABELS[s], count, pct: Math.round((count / total) * 100) };
	});

	// Recent bookings
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const recentBookings = (recentRes.data ?? []).map((b: any) => ({
		id: b.id,
		customer:
			[b.customer?.first_name, b.customer?.last_name].filter(Boolean).join(' ') || 'Unknown',
		service: b.services?.title ?? 'Service',
		provider:
			[b.provider?.first_name, b.provider?.last_name].filter(Boolean).join(' ') || 'Unknown',
		time: (b.scheduled_start_time as string).slice(0, 5),
		status: b.booking_status as BookingStatus,
		price: Math.round(parseFloat(b.total_price)),
		address: b.address ?? ''
	}));

	// Activity feed — convert booking status changes to feed events
	function relTime(iso: string): string {
		const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
		if (diff < 1) return 'just now';
		if (diff < 60) return `${diff}m ago`;
		const h = Math.floor(diff / 60);
		const m = diff % 60;
		return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const bookingActivity = (feedRes.data ?? []).slice(0, 8).map((b: any) => {
		const svc = b.services?.title ?? 'Service';
		const customer = [b.customer?.first_name, b.customer?.last_name].filter(Boolean).join(' ');
		const provider = [b.provider?.first_name, b.provider?.last_name].filter(Boolean).join(' ');

		type EventMap = Record<string, { type: ActivityEventType; msg: string }>;
		const map: EventMap = {
			in_progress: { type: 'booking_started', msg: `${provider} started a booking` },
			completed: { type: 'booking_completed', msg: `Booking completed by ${provider}` },
			canceled: {
				type: 'cancelled',
				msg: `Booking cancelled${b.cancellation_reason ? `: ${b.cancellation_reason}` : ''}`
			},
			confirmed: { type: 'booking_created', msg: `Booking confirmed — ${svc}` },
			pending: { type: 'booking_created', msg: `New booking request from ${customer}` }
		};
		const ev = map[b.booking_status] ?? { type: 'booking_created', msg: 'Booking updated' };
		return {
			type: ev.type,
			msg: ev.msg,
			sub: `${svc} · ${customer}`,
			time: relTime(b.updated_at),
			at: b.updated_at
		};
	});

	// Include recent report/dispute cases and dispute chat messages in the main
	// dashboard feed so admins see the newest support activity immediately.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const reportCaseActivity = (reportCasesRes.data ?? []).map((c: any) => ({
		type: 'report_case',
		msg: `Report/dispute ${c.status ?? 'updated'} — ${c.subject ?? c.type ?? 'Case'}`,
		sub: `${c.severity ?? 'medium'} priority · ${String(c.description ?? '').slice(0, 80)}`,
		time: relTime(c.updated_at ?? c.created_at),
		at: c.updated_at ?? c.created_at
	}));

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const reportMessageActivity = (reportMessagesRes.data ?? []).map((m: any) => ({
		type: 'report_case_message',
		msg: `New ${m.sender_role === 'admin' ? 'admin' : 'reporter'} message`,
		sub: `${m.report_cases?.subject ?? m.report_cases?.type ?? m.case_id} · ${String(m.body ?? '').slice(0, 90)}`,
		time: relTime(m.created_at),
		at: m.created_at
	}));

	const activityFeed: ActivityEvent[] = [...reportMessageActivity, ...reportCaseActivity, ...bookingActivity]
		.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
		.slice(0, 12)
		.map(({ at: _at, ...event }) => event as ActivityEvent);

	// Top providers
	type ProviderAcc = Record<string, { name: string; earnings: number; bookings: number }>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const providerMap = (providersRes.data ?? []).reduce<ProviderAcc>((acc, row: any) => {
		const uid = row.wallets?.user_id ?? row.wallet_id;
		const name =
			[row.wallets?.profiles?.first_name, row.wallets?.profiles?.last_name]
				.filter(Boolean)
				.join(' ') || uid;
		if (!acc[uid]) acc[uid] = { name, earnings: 0, bookings: 0 };
		acc[uid].earnings += parseFloat(row.amount);
		acc[uid].bookings += 1;
		return acc;
	}, {});

	const topProviders = Object.values(providerMap)
		.sort((a, b) => b.earnings - a.earnings)
		.slice(0, 5)
		.map((p) => ({ name: p.name, bookings: p.bookings, earnings: Math.round(p.earnings) }));

	// Hourly activity — bucket into 12 slots
	const startHour = (currentHour - 11 + 24) % 24;
	const buckets: HourlyBucket[] = Array.from({ length: 12 }, (_, i) => {
		const h = (startHour + i) % 24;
		return { label: hourLabel(h), count: 0, isCurrent: h === currentHour };
	});
	for (const row of hourlyRes.data ?? []) {
		const h = new Date(row.created_at).getHours();
		const idx = (h - startHour + 24) % 24;
		if (idx < 12) buckets[idx].count++;
	}

	// ── Assemble ─────────────────────────────────────────────────────────────
	const dashboard: DailyDashboardData = {
		kpis: {
			totalBookings: todayCount,
			bookingsChange: todayCount - yCount,
			revenueToday: Math.round(revenueToday),
			revenueChangePct: pctChange(revenueToday, revenueYest),
			newRegistrations: newUsersToday,
			registrationsChange: newUsersToday - newUsersYest,
			activeNow: activeRes.count ?? 0
		},
		pipeline,
		recentBookings,
		activityFeed,
		topProviders,
		hourlyActivity: buckets
	};

	return { dashboard };
};

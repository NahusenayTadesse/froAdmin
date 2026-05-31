<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import {
		Search,
		ChevronDown,
		ChevronUp,
		ArrowRight,
		MapPin,
		Clock,
		User,
		Scissors,
		Calendar,
		Image,
		BookOpen,
		CreditCard,
		AlertCircle,
		CheckCircle2,
		XCircle,
		Timer,
		Navigation
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';

	type Booking = {
		id: string;
		customerId: string;
		providerId: string;
		serviceId: string;
		scheduledDate: string;
		scheduledStartTime: string;
		scheduledEndTime: string;
		address: string | null;
		latitude: number | null;
		longitude: number | null;
		notesFromCustomer: string | null;
		bookingStatus: string;
		paymentStatus: string;
		paymentFailureCode: string | null;
		paymentFailureMessage: string | null;
		paymentFailedAt: string | null;
		totalPrice: string; // numeric comes back as string in drizzle
		createdAt: string | null;
		updatedAt: string | null;
		startedAt: string | null;
		providerMarkedDoneAt: string | null;
		completedAt: string | null;
		canceledAt: string | null;
		cancellationReason: string | null;
		providerLiveState: string | null;
		arrivedAt: string | null;
		serviceStartedAt: string | null;
		autoCompletedAt: string | null;
		beforeImageUrls: string[];
		afterImageUrls: string[];
		customerName: string;
		providerName: string;
		serviceName: string | null;
	};

	type SortKey = 'scheduledDate' | 'totalPrice' | 'customerName' | 'providerName' | 'bookingStatus';

	let { bookings = [] }: { bookings: Booking[] } = $props();

	let search = $state('');
	let activeBookingStatus = $state('all');
	let activePaymentStatus = $state('all');
	let sortKey = $state<SortKey>('scheduledDate');
	let sortAsc = $state(false);
	let expandedId = $state<string | null>(null);

	// ── Status configs ──────────────────────────────────────────────

	type StatusCfg = { label: string; class: string; dot: string; icon: typeof CheckCircle2 };

	const BOOKING_STATUS: Record<string, StatusCfg> = {
		pending: {
			label: 'Pending',
			icon: Timer,
			dot: 'bg-amber-500',
			class:
				'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
		},
		confirmed: {
			label: 'Confirmed',
			icon: CheckCircle2,
			dot: 'bg-blue-500',
			class:
				'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
		},
		'in-progress': {
			label: 'In Progress',
			icon: Navigation,
			dot: 'bg-violet-500',
			class:
				'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800'
		},
		completed: {
			label: 'Completed',
			icon: CheckCircle2,
			dot: 'bg-emerald-500',
			class:
				'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
		},
		cancelled: {
			label: 'Cancelled',
			icon: XCircle,
			dot: 'bg-rose-500',
			class:
				'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
		},
		canceled: {
			label: 'Cancelled',
			icon: XCircle,
			dot: 'bg-rose-500',
			class:
				'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
		}
	};

	const PAYMENT_STATUS: Record<string, { label: string; class: string; dot: string }> = {
		pending: {
			label: 'Unpaid',
			dot: 'bg-amber-500',
			class:
				'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
		},
		paid: {
			label: 'Paid',
			dot: 'bg-emerald-500',
			class:
				'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
		},
		failed: {
			label: 'Failed',
			dot: 'bg-rose-500',
			class:
				'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
		},
		refunded: {
			label: 'Refunded',
			dot: 'bg-gray-500',
			class:
				'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
		}
	};

	function bookingCfg(status: string): StatusCfg {
		return (
			BOOKING_STATUS[status.toLowerCase()] ?? {
				label: status,
				icon: BookOpen,
				dot: 'bg-gray-400',
				class:
					'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
			}
		);
	}

	function paymentCfg(status: string) {
		return (
			PAYMENT_STATUS[status.toLowerCase()] ?? {
				label: status,
				dot: 'bg-gray-400',
				class:
					'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
			}
		);
	}

	// ── Formatting ───────────────────────────────────────────────────

	function formatCurrency(v: string | number | null) {
		if (v == null) return '—';
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v));
	}

	function formatDate(iso: string | null) {
		if (!iso) return '—';
		return new Date(iso + (iso.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatTime(t: string | null) {
		if (!t) return '—';
		const [h, m] = t.split(':').map(Number);
		return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
	}

	function formatTs(ts: string | null) {
		if (!ts) return null;
		return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
	}

	function duration(start: string, end: string) {
		const [sh, sm] = start.split(':').map(Number);
		const [eh, em] = end.split(':').map(Number);
		const mins = eh * 60 + em - (sh * 60 + sm);
		if (mins < 60) return `${mins}m`;
		return `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ''}`;
	}

	// ── Timeline events for expanded card ────────────────────────────

	function timeline(b: Booking) {
		return [
			{ label: 'Booked', ts: b.createdAt, icon: BookOpen },
			{ label: 'Arrived', ts: b.arrivedAt, icon: Navigation },
			{ label: 'Started', ts: b.serviceStartedAt ?? b.startedAt, icon: Timer },
			{ label: 'Done', ts: b.providerMarkedDoneAt, icon: CheckCircle2 },
			{ label: 'Completed', ts: b.completedAt ?? b.autoCompletedAt, icon: CheckCircle2 },
			{ label: 'Cancelled', ts: b.canceledAt, icon: XCircle }
		].filter((e) => e.ts != null);
	}

	// ── Filters / sort ────────────────────────────────────────────────

	function toggleSort(key: SortKey) {
		if (sortKey === key) sortAsc = !sortAsc;
		else {
			sortKey = key;
			sortAsc = true;
		}
	}

	const bookingStatuses = $derived(() => {
		const set = new Set(bookings.map((b) => b.bookingStatus));
		return ['all', ...Array.from(set).sort()];
	});

	const bookingStatusCounts = $derived(() => {
		const map: Record<string, number> = { all: bookings.length };
		for (const b of bookings) map[b.bookingStatus] = (map[b.bookingStatus] ?? 0) + 1;
		return map;
	});

	const paymentStatuses = $derived(() => {
		const set = new Set(bookings.map((b) => b.paymentStatus));
		return ['all', ...Array.from(set).sort()];
	});

	const filtered = $derived(() => {
		const q = search.toLowerCase().trim();
		return bookings
			.filter((b) => {
				const matchSearch =
					!q ||
					b.customerName.toLowerCase().includes(q) ||
					b.providerName.toLowerCase().includes(q) ||
					(b.serviceName ?? '').toLowerCase().includes(q) ||
					(b.address ?? '').toLowerCase().includes(q);
				const matchBooking =
					activeBookingStatus === 'all' || b.bookingStatus === activeBookingStatus;
				const matchPayment =
					activePaymentStatus === 'all' || b.paymentStatus === activePaymentStatus;
				return matchSearch && matchBooking && matchPayment;
			})
			.sort((a, b) => {
				let av: string | number = a[sortKey] ?? '';
				let bv: string | number = b[sortKey] ?? '';
				if (typeof av === 'string') av = av.toLowerCase();
				if (typeof bv === 'string') bv = bv.toLowerCase();
				if (av < bv) return sortAsc ? -1 : 1;
				if (av > bv) return sortAsc ? 1 : -1;
				return 0;
			});
	});

	const totals = $derived(() => ({
		revenue: filtered().reduce((s, b) => s + Number(b.totalPrice), 0),
		withImages: filtered().filter(
			(b) => b.beforeImageUrls?.length > 0 || b.afterImageUrls?.length > 0
		).length
	}));

	const COLS = [
		{ key: 'scheduledDate', label: 'Date & Time' },
		{ key: 'customerName', label: 'Customer' },
		{ key: 'providerName', label: 'Provider' },
		{ key: null, label: 'Service' },
		{ key: 'bookingStatus', label: 'Booking' },
		{ key: null, label: 'Payment' },
		{ key: 'totalPrice', label: 'Total' },
		{ key: null, label: 'Location' },
		{ key: null, label: '' }
	] as const;
</script>

<div class="block w-full space-y-4 font-sans lg:hidden">
	<!-- Header -->
	<div class="flex flex-col gap-1">
		<h2 class="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">Bookings</h2>
		<p class="text-sm text-gray-500 dark:text-gray-400">
			{filtered().length} of {bookings.length} bookings
		</p>
	</div>

	<!-- Summary cards -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div
			class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
		>
			<p class="text-[11px] font-medium tracking-wider text-gray-400 uppercase">Revenue</p>
			<p class="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
				{formatCurrency(totals().revenue)}
			</p>
		</div>
		<div
			class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
		>
			<p class="text-[11px] font-medium tracking-wider text-gray-400 uppercase">Bookings</p>
			<p class="mt-1 text-lg font-bold text-gray-900 dark:text-gray-50">{filtered().length}</p>
		</div>
		<div
			class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
		>
			<p class="text-[11px] font-medium tracking-wider text-gray-400 uppercase">Completed</p>
			<p class="mt-1 text-lg font-bold text-gray-900 dark:text-gray-50">
				{filtered().filter((b) => b.bookingStatus === 'completed').length}
			</p>
		</div>
		<div
			class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
		>
			<p class="text-[11px] font-medium tracking-wider text-gray-400 uppercase">With Photos</p>
			<p class="mt-1 text-lg font-bold text-gray-900 dark:text-gray-50">{totals().withImages}</p>
		</div>
	</div>

	<!-- Search -->
	<div class="relative">
		<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
		<Input
			bind:value={search}
			placeholder="Search customer, provider, service, address…"
			class="h-10 bg-white pl-9 placeholder:text-gray-400 focus-visible:ring-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:focus-visible:ring-gray-600"
		/>
	</div>

	<!-- Booking status filter -->
	<div class="flex scrollbar-none gap-1.5 overflow-x-auto pb-1">
		{#each bookingStatuses() as status}
			{@const cfg = status === 'all' ? null : bookingCfg(status)}
			<button
				onclick={() => (activeBookingStatus = status)}
				class="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all
					{activeBookingStatus === status
					? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900'
					: 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'}"
			>
				{#if cfg}<span class="size-1.5 rounded-full {cfg.dot}"></span>{/if}
				{status === 'all' ? 'All bookings' : (cfg?.label ?? status)}
				<span
					class="rounded-full px-1.5 py-0.5 text-[10px] font-semibold
					{activeBookingStatus === status
						? 'bg-white/20 text-white dark:bg-black/20 dark:text-gray-900'
						: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}"
				>
					{bookingStatusCounts()[status] ?? 0}
				</span>
			</button>
		{/each}
	</div>

	<!-- Payment status filter -->
	{#if paymentStatuses().length > 2}
		<div class="flex scrollbar-none items-center gap-2 overflow-x-auto pb-1">
			<span
				class="flex shrink-0 items-center gap-1 text-[11px] font-medium tracking-wider text-gray-400 uppercase"
			>
				<CreditCard class="size-3" /> Payment
			</span>
			{#each paymentStatuses() as status}
				{@const cfg = paymentCfg(status)}
				<button
					onclick={() => (activePaymentStatus = status)}
					class="flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all
						{activePaymentStatus === status
						? 'border-gray-700 bg-gray-700 text-white dark:border-gray-300 dark:bg-gray-300 dark:text-gray-900'
						: 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'}"
				>
					{#if status !== 'all'}<span class="size-1.5 rounded-full {cfg.dot}"></span>{/if}
					{status === 'all' ? 'All payments' : cfg.label}
				</button>
			{/each}
		</div>
	{/if}

	<!-- ─── Mobile: Cards ─── -->
	<div class="flex flex-col gap-3 md:hidden">
		{#if filtered().length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center dark:border-gray-700"
			>
				<BookOpen class="mb-3 size-8 text-gray-300 dark:text-gray-600" />
				<p class="text-sm font-medium text-gray-500 dark:text-gray-400">No bookings found</p>
				<p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
					Try adjusting your search or filters
				</p>
			</div>
		{/if}

		{#each filtered() as booking (booking.id)}
			{@const bCfg = bookingCfg(booking.bookingStatus)}
			{@const pCfg = paymentCfg(booking.paymentStatus)}
			{@const tl = timeline(booking)}
			{@const isOpen = expandedId === booking.id}

			<div
				class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
			>
				<!-- Card header: tap to expand -->
				<button
					onclick={() => (expandedId = isOpen ? null : booking.id)}
					class="flex w-full items-start justify-between gap-3 p-4 text-left"
				>
					<div class="flex min-w-0 flex-col gap-1">
						<span class="truncate font-semibold text-gray-900 dark:text-gray-50">
							{booking.customerName}
						</span>
						<span class="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
							<Scissors class="size-3 shrink-0" />
							{booking.serviceName ?? '—'}
						</span>
						<span class="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
							<Calendar class="size-3 shrink-0" />
							{formatDate(booking.scheduledDate)}
							<span class="text-gray-300 dark:text-gray-600">·</span>
							<Clock class="size-3 shrink-0" />
							{formatTime(booking.scheduledStartTime)} – {formatTime(booking.scheduledEndTime)}
						</span>
					</div>
					<div class="flex shrink-0 flex-col items-end gap-2">
						<span
							class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium {bCfg.class}"
						>
							<span class="size-1.5 rounded-full {bCfg.dot}"></span>
							{bCfg.label}
						</span>
						<span class="text-sm font-bold text-gray-900 dark:text-gray-50">
							{formatCurrency(booking.totalPrice)}
						</span>
					</div>
				</button>

				<!-- Expandable details -->
				{#if isOpen}
					<div class="border-t border-gray-100 dark:border-gray-800">
						<!-- Provider + payment -->
						<div class="grid grid-cols-2 gap-px bg-gray-100 dark:bg-gray-800">
							<div class="bg-white p-3 dark:bg-gray-900">
								<p class="mb-0.5 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
									Provider
								</p>
								<p
									class="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-200"
								>
									<User class="size-3 text-gray-400" />{booking.providerName}
								</p>
							</div>
							<div class="bg-white p-3 dark:bg-gray-900">
								<p class="mb-0.5 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
									Payment
								</p>
								<span
									class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium {pCfg.class}"
								>
									<span class="size-1.5 rounded-full {pCfg.dot}"></span>
									{pCfg.label}
								</span>
							</div>
						</div>

						<!-- Address -->
						{#if booking.address}
							<div
								class="border-t border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
							>
								<p class="mb-0.5 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
									Address
								</p>
								<a
									href="https://maps.google.com/?q={booking.latitude},{booking.longitude}"
									target="_blank"
									rel="noopener noreferrer"
									class="flex items-start gap-1.5 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
								>
									<MapPin class="mt-0.5 size-3 shrink-0" />{booking.address}
								</a>
							</div>
						{/if}

						<!-- Customer notes -->
						{#if booking.notesFromCustomer}
							<div
								class="border-t border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
							>
								<p class="mb-0.5 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
									Notes
								</p>
								<p class="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
									{booking.notesFromCustomer}
								</p>
							</div>
						{/if}

						<!-- Cancellation reason -->
						{#if booking.cancellationReason}
							<div
								class="border-t border-rose-100 bg-rose-50 p-3 dark:border-rose-900 dark:bg-rose-950/30"
							>
								<p
									class="mb-0.5 flex items-center gap-1 text-[10px] font-medium tracking-wider text-rose-400 uppercase"
								>
									<AlertCircle class="size-3" />Cancellation reason
								</p>
								<p class="text-xs text-rose-700 dark:text-rose-300">{booking.cancellationReason}</p>
							</div>
						{/if}

						<!-- Payment failure -->
						{#if booking.paymentStatus === 'failed' && booking.paymentFailureMessage}
							<div
								class="border-t border-rose-100 bg-rose-50 p-3 dark:border-rose-900 dark:bg-rose-950/30"
							>
								<p
									class="mb-0.5 flex items-center gap-1 text-[10px] font-medium tracking-wider text-rose-400 uppercase"
								>
									<AlertCircle class="size-3" />Payment failure
								</p>
								<p class="text-xs text-rose-700 dark:text-rose-300">
									{booking.paymentFailureCode
										? `[${booking.paymentFailureCode}] `
										: ''}{booking.paymentFailureMessage}
								</p>
							</div>
						{/if}

						<!-- Timeline -->
						{#if tl.length > 0}
							<div
								class="border-t border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
							>
								<p class="mb-2 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
									Timeline
								</p>
								<div class="flex flex-wrap gap-2">
									{#each tl as event}
										<div class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
											<event.icon class="size-3 text-gray-400" />
											<span class="font-medium">{event.label}</span>
											<span class="text-gray-400">{formatTs(event.ts)}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Before / after images -->
						{#if booking.beforeImageUrls?.length > 0 || booking.afterImageUrls?.length > 0}
							<div class="border-t border-gray-100 p-3 dark:border-gray-800">
								{#if booking.beforeImageUrls?.length > 0}
									<p class="mb-1.5 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
										Before
									</p>
									<div class="mb-3 flex gap-2 overflow-x-auto">
										{#each booking.beforeImageUrls as url}
											<img
												src={url}
												alt="Before"
												class="h-20 w-20 shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
											/>
										{/each}
									</div>
								{/if}
								{#if booking.afterImageUrls?.length > 0}
									<p class="mb-1.5 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
										After
									</p>
									<div class="flex gap-2 overflow-x-auto">
										{#each booking.afterImageUrls as url}
											<img
												src={url}
												alt="After"
												class="h-20 w-20 shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
											/>
										{/each}
									</div>
								{/if}
							</div>
						{/if}

						<!-- Footer action -->
						<div class="flex justify-end border-t border-gray-100 px-4 py-2.5 dark:border-gray-800">
							<Button
								size="sm"
								variant="ghost"
								href="/dashboard/bookings/single/{booking.id}"
								class="h-7 gap-1 px-2 text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
							>
								View full details
								<ArrowRight class="size-3" />
							</Button>
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- ─── Desktop: Table ─── -->
	<div
		class="hidden overflow-hidden rounded-xl border border-gray-200 md:block dark:border-gray-700"
	>
		<table class="w-full text-sm">
			<thead class="bg-gray-50 dark:bg-gray-800/60">
				<tr>
					{#each COLS as col}
						<th
							class="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400
								{col.key ? 'cursor-pointer select-none hover:text-gray-800 dark:hover:text-gray-200' : ''}"
							onclick={() => col.key && toggleSort(col.key as SortKey)}
						>
							<span class="flex items-center gap-1">
								{col.label}
								{#if col.key && sortKey === col.key}
									{#if sortAsc}<ChevronUp class="size-3" />{:else}<ChevronDown
											class="size-3"
										/>{/if}
								{/if}
							</span>
						</th>
					{/each}
				</tr>
			</thead>

			<tbody class="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
				{#if filtered().length === 0}
					<tr>
						<td colspan={COLS.length} class="py-16 text-center">
							<div class="flex flex-col items-center gap-2">
								<BookOpen class="size-8 text-gray-300 dark:text-gray-600" />
								<p class="text-sm font-medium text-gray-500 dark:text-gray-400">
									No bookings found
								</p>
							</div>
						</td>
					</tr>
				{/if}

				{#each filtered() as booking (booking.id)}
					{@const bCfg = bookingCfg(booking.bookingStatus)}
					{@const pCfg = paymentCfg(booking.paymentStatus)}
					<tr class="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40">
						<!-- Date & time -->
						<td class="px-4 py-3 whitespace-nowrap">
							<div class="font-medium text-gray-900 dark:text-gray-50">
								{formatDate(booking.scheduledDate)}
							</div>
							<div class="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
								<Clock class="size-3" />
								{formatTime(booking.scheduledStartTime)} · {duration(
									booking.scheduledStartTime,
									booking.scheduledEndTime
								)}
							</div>
						</td>

						<!-- Customer -->
						<td class="px-4 py-3">
							<div class="font-medium text-gray-900 dark:text-gray-50">{booking.customerName}</div>
						</td>

						<!-- Provider -->
						<td class="px-4 py-3">
							<div class="flex items-center gap-2">
								<div
									class="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300"
								>
									{booking.providerName.charAt(0).toUpperCase()}
								</div>
								<span class="text-gray-700 dark:text-gray-300">{booking.providerName}</span>
							</div>
						</td>

						<!-- Service -->
						<td class="px-4 py-3">
							{#if booking.serviceName}
								<span class="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
									<Scissors class="size-3.5 shrink-0 text-gray-400" />
									{booking.serviceName}
								</span>
							{:else}
								<span class="text-xs text-gray-300 dark:text-gray-600">—</span>
							{/if}
						</td>

						<!-- Booking status -->
						<td class="px-4 py-3">
							<span
								class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium {bCfg.class}"
							>
								<span class="size-1.5 rounded-full {bCfg.dot}"></span>
								{bCfg.label}
							</span>
						</td>

						<!-- Payment status -->
						<td class="px-4 py-3">
							<span
								class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium {pCfg.class}"
							>
								<span class="size-1.5 rounded-full {pCfg.dot}"></span>
								{pCfg.label}
							</span>
							{#if booking.paymentStatus === 'failed' && booking.paymentFailureCode}
								<p class="mt-0.5 text-[10px] text-rose-500">{booking.paymentFailureCode}</p>
							{/if}
						</td>

						<!-- Total -->
						<td
							class="px-4 py-3 font-bold whitespace-nowrap text-emerald-600 dark:text-emerald-400"
						>
							{formatCurrency(booking.totalPrice)}
						</td>

						<!-- Location -->
						<td class="max-w-[160px] px-4 py-3">
							{#if booking.address}
								<a
									href="https://maps.google.com/?q={booking.latitude},{booking.longitude}"
									target="_blank"
									rel="noopener noreferrer"
									class="flex items-start gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
								>
									<MapPin class="mt-0.5 size-3 shrink-0" />
									<span class="truncate">{booking.address}</span>
								</a>
							{:else}
								<span class="text-xs text-gray-300 dark:text-gray-600">—</span>
							{/if}
						</td>

						<!-- Action -->
						<td class="px-4 py-3 text-right">
							<div
								class="flex items-center justify-end gap-1.5 opacity-0 transition-opacity group-hover:opacity-100"
							>
								{#if (booking.beforeImageUrls?.length ?? 0) + (booking.afterImageUrls?.length ?? 0) > 0}
									<span class="flex items-center gap-1 text-xs text-gray-400">
										<Image class="size-3.5" />
										{(booking.beforeImageUrls?.length ?? 0) + (booking.afterImageUrls?.length ?? 0)}
									</span>
								{/if}
								<Button
									size="sm"
									variant="ghost"
									onclick={() => goto(`/dashboard/bookings/${booking.id}`)}
									class="h-8 gap-1.5 px-3 text-xs font-medium"
								>
									View
									<ArrowRight class="size-3" />
								</Button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>

			<!-- Footer -->
			{#if filtered().length > 0}
				<tfoot
					class="border-t-2 border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60"
				>
					<tr>
						<td
							class="px-4 py-2.5 text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400"
							colspan="6"
						>
							{filtered().length} booking{filtered().length !== 1 ? 's' : ''}
						</td>
						<td
							class="px-4 py-2.5 font-bold whitespace-nowrap text-emerald-600 dark:text-emerald-400"
						>
							{formatCurrency(totals().revenue)}
						</td>
						<td class="px-4 py-2.5"></td>
						<td class="px-4 py-2.5"></td>
					</tr>
				</tfoot>
			{/if}
		</table>
	</div>
</div>

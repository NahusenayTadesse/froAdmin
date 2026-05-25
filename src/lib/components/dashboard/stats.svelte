<script lang="ts">
	import { onMount } from 'svelte';
	import type { DailyDashboardData, BookingStatus } from './dashboard.types';

	// ─── Props ─────────────────────────────────────────────────────────────────
	interface Props {
		data: DailyDashboardData;
		/** Admin's display initials shown in the avatar */
		adminInitials?: string;
		/** Link target for the "View all →" bookings button */
		bookingsHref?: string;

		activeNow?: number;
	}

	let { data, adminInitials = 'AD', bookingsHref = '/admin/bookings', activeNow }: Props = $props();

	// ─── Clock ─────────────────────────────────────────────────────────────────
	let now = $state(new Date());

	onMount(() => {
		const id = setInterval(() => (now = new Date()), 1000);
		return () => clearInterval(id);
	});

	// ─── Derived ───────────────────────────────────────────────────────────────
	const today = $derived(
		now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
	);

	const clockStr = $derived(
		now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
	);

	const maxHourly = $derived(Math.max(...data.hourlyActivity.map((h) => h.count), 1));

	const totalBookings = $derived(data.pipeline.reduce((s, p) => s + p.count, 0));

	// ─── Helpers ───────────────────────────────────────────────────────────────
	const STATUS_META: Record<BookingStatus, { label: string; color: string; bg: string }> = {
		pending: { label: 'Pending', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
		confirmed: { label: 'Confirmed', color: '#14B8A6', bg: 'rgba(20,184,166,0.12)' },
		in_progress: { label: 'In Progress', color: '#818CF8', bg: 'rgba(129,140,248,0.12)' },
		completed: { label: 'Completed', color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
		canceled: { label: 'Cancelled', color: '#F87171', bg: 'rgba(248,113,113,0.12)' }
	};

	const ACTIVITY_COLOR: Record<string, string> = {
		booking_created: '#F59E0B',
		booking_started: '#818CF8',
		booking_completed: '#34D399',
		cancelled: '#F87171',
		payment: '#34D399',
		new_user: '#14B8A6',
		report_case: '#F87171',
		report_case_message: '#60A5FA'
	};

	function fmtMoney(n: number): string {
		return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;
	}

	function fmtChange(n: number, suffix = ''): string {
		return `${n > 0 ? '▲' : '▼'} ${Math.abs(n)}${suffix} vs yesterday`;
	}
</script>

<div class="dashboard">
	<!-- ── Header ── -->
	<header class="header">
		<div class="header-left">
			<div class="brand">
				<span class="brand-icon">
					<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"
						/>
					</svg>
				</span>
				<span class="brand-name">Ops Center</span>
			</div>
			<div class="header-date">
				<span class="date-text">{today}</span>
				<span class="live-badge">
					<span class="live-dot"></span>
					Live
				</span>
			</div>
		</div>
		<div class="header-right">
			<div class="time-display">{clockStr}</div>
			<div class="admin-avatar">{adminInitials}</div>
		</div>
	</header>

	<!-- ── KPIs ── -->
	<section class="kpi-grid">
		<!-- Bookings -->
		<div class="kpi-card">
			<div class="kpi-top">
				<span class="kpi-label">Today's Bookings</span>
				<span class="kpi-icon teal">
					<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				</span>
			</div>
			<div class="kpi-value teal">{data.kpis.totalBookings}</div>
			{#if data.kpis.bookingsChange !== 0}
				<div class="kpi-change" class:positive={data.kpis.bookingsChange > 0}>
					{fmtChange(data.kpis.bookingsChange)}
				</div>
			{:else}
				<div class="kpi-change neutral">● real-time count</div>
			{/if}
		</div>

		<!-- Revenue -->
		<div class="kpi-card">
			<div class="kpi-top">
				<span class="kpi-label">Revenue Today</span>
				<span class="kpi-icon amber">
					<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</span>
			</div>
			<div class="kpi-value amber">${data.kpis.revenueToday.toLocaleString()}</div>
			{#if data.kpis.revenueChangePct !== 0}
				<div class="kpi-change" class:positive={data.kpis.revenueChangePct > 0}>
					{fmtChange(data.kpis.revenueChangePct, '%')}
				</div>
			{:else}
				<div class="kpi-change neutral">● no change</div>
			{/if}
		</div>

		<!-- Registrations -->
		<div class="kpi-card">
			<div class="kpi-top">
				<span class="kpi-label">New Registrations</span>
				<span class="kpi-icon purple">
					<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
						/>
					</svg>
				</span>
			</div>
			<div class="kpi-value purple">{data.kpis.newRegistrations}</div>
			{#if data.kpis.registrationsChange !== 0}
				<div class="kpi-change" class:positive={data.kpis.registrationsChange > 0}>
					{fmtChange(data.kpis.registrationsChange)}
				</div>
			{:else}
				<div class="kpi-change neutral">● same as yesterday</div>
			{/if}
		</div>

		<!-- Active now -->
		<div class="kpi-card">
			<div class="kpi-top">
				<span class="kpi-label">Active Right Now</span>
				<span class="kpi-icon green">
					<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M8.464 15.536a5 5 0 010-7.072m7.072 0a5 5 0 010 7.072M12 12h.01"
						/>
					</svg>
				</span>
			</div>
			<div class="kpi-value green">{activeNow}</div>
			<div class="kpi-change neutral">● real-time count</div>
		</div>
	</section>

	<div class="main-grid">
		<!-- ── Left column ── -->
		<div class="left-col">
			<!-- Pipeline -->
			<div class="card">
				<div class="card-header">
					<h2 class="card-title">Booking Pipeline</h2>
					<span class="card-sub">Today · {totalBookings} total</span>
				</div>
				<div class="pipeline">
					{#each data.pipeline as p}
						<div class="pipeline-row">
							<div class="pipeline-label">
								<span class="p-dot" style:background={STATUS_META[p.status].color}></span>
								<span class="p-name">{p.label}</span>
							</div>
							<div class="pipeline-bar-wrap">
								<div
									class="pipeline-bar"
									style:width="{p.pct}%"
									style:background={STATUS_META[p.status].color}
								></div>
							</div>
							<div class="pipeline-count" style:color={STATUS_META[p.status].color}>{p.count}</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Hourly chart -->
			<div class="card">
				<div class="card-header">
					<h2 class="card-title">Booking Activity</h2>
					<span class="card-sub">Hourly · today</span>
				</div>
				<div class="chart-area">
					{#each data.hourlyActivity as bucket}
						<div class="chart-col">
							<div class="chart-bar-wrap">
								<div
									class="chart-bar"
									class:current={bucket.isCurrent}
									style:height="{(bucket.count / maxHourly) * 100}%"
								></div>
							</div>
							<span class="chart-label">{bucket.label}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Top providers -->
			<div class="card">
				<div class="card-header">
					<h2 class="card-title">Top Providers Today</h2>
					<span class="card-sub">by earnings</span>
				</div>
				<div class="provider-list">
					{#each data.topProviders as p, i}
						<div class="provider-row">
							<div class="provider-rank">{i + 1}</div>
							<div class="provider-info">
								<span class="provider-name">{p.name}</span>
								<span class="provider-meta">{p.bookings} bookings</span>
							</div>
							<div class="provider-earn">{fmtMoney(p.earnings)}</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- ── Right column ── -->
		<div class="right-col">
			<!-- Live activity feed -->
			<div class="card">
				<div class="card-header">
					<h2 class="card-title">Live Activity</h2>
					<span class="card-sub">
						<span class="live-dot-small"></span> streaming
					</span>
				</div>
				<div class="feed">
					{#each data.activityFeed as event}
						<div class="feed-item">
							<div
								class="feed-dot"
								style:background={ACTIVITY_COLOR[event.type] ?? '#6B6B78'}
							></div>
							<div class="feed-body">
								<p class="feed-msg">{event.msg}</p>
								<p class="feed-sub">{event.sub}</p>
							</div>
							<span class="feed-time">{event.time}</span>
						</div>
					{/each}
				</div>
			</div>

			<!-- Today's bookings list -->
			<div class="card">
				<div class="card-header">
					<h2 class="card-title">Today's Bookings</h2>
					<a href={bookingsHref} class="card-link">View all →</a>
				</div>
				<div class="booking-list">
					{#each data.recentBookings as b}
						{@const meta = STATUS_META[b.status]}
						<div class="booking-item">
							<div class="booking-time">{b.time}</div>
							<div class="booking-details">
								<p class="booking-service">{b.service}</p>
								<p class="booking-customer">{b.customer} · {b.provider}</p>
							</div>
							<div class="booking-right">
								<span class="status-badge" style:color={meta.color} style:background={meta.bg}
									>{meta.label}</span
								>
								<span class="booking-price">${b.price}</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:root {
		/* Light Mode (Default) */
		--bg-main: #f8f9fa;
		--bg-card: #ffffff;
		--border-color: rgba(0, 0, 0, 0.08);
		--text-primary: #1a1a1e;
		--text-secondary: #6b6b78;
		--text-muted: #94a3b8;
		--kpi-bg: #f1f5f9;
	}

	.dark {
		/* Dark Mode Overrides */
		--bg-main: #09090b;
		--bg-card: #111117;
		--border-color: rgba(255, 255, 255, 0.07);
		--text-primary: #e8e8ec;
		--text-secondary: #8888a0;
		--text-muted: #4a4a56;
		--kpi-bg: #111117;
	}

	/* ── Base Updates ── */
	.dashboard {
		min-height: 100vh;
		padding: 1.5rem 2rem 3rem;
		max-width: 1400px;
		margin: 0 auto;
		/* Uses variable */
		color: var(--text-primary); /* Uses variable */
		font-family: 'DM Sans', system-ui, sans-serif;
		transition:
			background-color 0.3s ease,
			color 0.3s ease;
	}

	.card,
	.kpi-card {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		transition: all 0.3s ease;
	}

	/* Update text classes to use variables */
	.brand-name,
	.kpi-value,
	.card-title,
	.provider-name,
	.booking-service {
		color: var(--text-primary);
	}

	.date-text,
	.kpi-label,
	.p-name,
	.provider-meta,
	.booking-customer,
	.feed-sub {
		color: var(--text-secondary);
	}
	.dashboard {
		min-height: 100vh;
		padding: 1.5rem 2rem 3rem;
		max-width: 1400px;
		margin: 0 auto;
		color: #e8e8ec;
		font-family: 'DM Sans', system-ui, sans-serif;
	}

	/* ── Header ── */
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 1.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		margin-bottom: 1.75rem;
	}
	.header-left {
		display: flex;
		align-items: center;
		gap: 2rem;
	}
	.header-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}
	.brand-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background: rgba(20, 184, 166, 0.12);
		border: 1px solid rgba(20, 184, 166, 0.25);
		border-radius: 10px;
		color: #14b8a6;
	}
	.brand-name {
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.header-date {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.date-text {
		font-size: 0.875rem;
		color: #6b6b78;
	}

	.live-badge {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #34d399;
		background: rgba(52, 211, 153, 0.1);
		border: 1px solid rgba(52, 211, 153, 0.2);
		border-radius: 999px;
		padding: 0.2rem 0.625rem;
	}
	.live-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #34d399;
		animation: blink 2s ease-in-out infinite;
	}
	.live-dot-small {
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #34d399;
		animation: blink 1.5s ease-in-out infinite;
	}
	@keyframes blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}

	.time-display {
		font-family: 'DM Mono', 'Fira Code', monospace;
		font-size: 0.875rem;
		color: #6b6b78;
		letter-spacing: 0.04em;
	}
	.admin-avatar {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		background: rgba(129, 140, 248, 0.15);
		border: 1px solid rgba(129, 140, 248, 0.25);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.7rem;
		font-weight: 700;
		color: #818cf8;
		letter-spacing: 0.05em;
	}

	/* ── KPI grid ── */
	.kpi-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	.kpi-card {
		background: #111117;
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 14px;
		padding: 1.25rem 1.5rem;
		transition: border-color 0.2s;
	}
	.kpi-card:hover {
		border-color: rgba(255, 255, 255, 0.13);
	}

	.kpi-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.875rem;
	}
	.kpi-label {
		font-size: 0.78rem;
		font-weight: 500;
		color: #6b6b78;
		letter-spacing: 0.01em;
		text-transform: uppercase;
	}
	.kpi-icon {
		display: flex;
		opacity: 0.85;
	}
	.kpi-icon.teal {
		color: #14b8a6;
	}
	.kpi-icon.amber {
		color: #f59e0b;
	}
	.kpi-icon.purple {
		color: #818cf8;
	}
	.kpi-icon.green {
		color: #34d399;
	}

	.kpi-value {
		font-size: 2rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		line-height: 1;
		margin-bottom: 0.5rem;
		font-family: 'DM Mono', monospace;
	}
	.kpi-value.teal {
		color: #14b8a6;
	}
	.kpi-value.amber {
		color: #f59e0b;
	}
	.kpi-value.purple {
		color: #818cf8;
	}
	.kpi-value.green {
		color: #34d399;
	}

	.kpi-change {
		font-size: 0.75rem;
		color: #f87171;
	}
	.kpi-change.positive {
		color: #34d399;
	}
	.kpi-change.neutral {
		color: #6b6b78;
	}

	/* ── Main grid ── */
	.main-grid {
		display: grid;
		grid-template-columns: 1fr 1.4fr;
		gap: 1.5rem;
		align-items: start;
	}
	.left-col,
	.right-col {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	/* ── Card ── */
	.card {
		background: #111117;
		border: 1px solid rgba(255, 255, 255, 0.07);
		border-radius: 14px;
		padding: 1.5rem;
	}
	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.25rem;
	}
	.card-title {
		font-size: 0.9rem;
		font-weight: 600;
		color: #d0d0d8;
		margin: 0;
		letter-spacing: -0.01em;
	}
	.card-sub {
		font-size: 0.75rem;
		color: #4a4a56;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.card-link {
		font-size: 0.75rem;
		color: #14b8a6;
		text-decoration: none;
		opacity: 0.8;
		transition: opacity 0.15s;
	}
	.card-link:hover {
		opacity: 1;
	}

	/* ── Pipeline ── */
	.pipeline {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.pipeline-row {
		display: grid;
		grid-template-columns: 110px 1fr 2rem;
		align-items: center;
		gap: 0.75rem;
	}
	.pipeline-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.p-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.p-name {
		font-size: 0.8rem;
		color: #8888a0;
	}
	.pipeline-bar-wrap {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 999px;
		height: 6px;
		overflow: hidden;
	}
	.pipeline-bar {
		height: 100%;
		border-radius: 999px;
		opacity: 0.85;
		transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.pipeline-count {
		font-size: 0.8rem;
		font-weight: 600;
		font-family: 'DM Mono', monospace;
		text-align: right;
	}

	/* ── Chart ── */
	.chart-area {
		display: grid;
		grid-template-columns: repeat(12, 1fr);
		gap: 4px;
		height: 100px;
		align-items: end;
	}
	.chart-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		height: 100%;
	}
	.chart-bar-wrap {
		flex: 1;
		width: 100%;
		display: flex;
		align-items: flex-end;
	}
	.chart-bar {
		width: 100%;
		border-radius: 3px 3px 0 0;
		background: rgba(20, 184, 166, 0.35);
		transition: height 0.4s ease;
		min-height: 4px;
	}
	.chart-bar.current {
		background: #14b8a6;
	}
	.chart-label {
		font-size: 0.65rem;
		color: #4a4a56;
		font-family: 'DM Mono', monospace;
	}

	/* ── Provider list ── */
	.provider-list {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}
	.provider-row {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.5rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
	}
	.provider-row:last-child {
		border-bottom: none;
	}
	.provider-rank {
		font-family: 'DM Mono', monospace;
		font-size: 0.75rem;
		color: #3a3a48;
		width: 16px;
		text-align: center;
		font-weight: 600;
	}
	.provider-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.provider-name {
		font-size: 0.85rem;
		color: #c8c8d4;
		font-weight: 500;
	}
	.provider-meta {
		font-size: 0.72rem;
		color: #4a4a56;
	}
	.provider-earn {
		font-family: 'DM Mono', monospace;
		font-size: 0.875rem;
		color: #f59e0b;
		font-weight: 600;
	}

	/* ── Feed ── */
	.feed {
		display: flex;
		flex-direction: column;
	}
	.feed-item {
		display: flex;
		align-items: flex-start;
		gap: 0.875rem;
		padding: 0.875rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
	}
	.feed-item:last-child {
		border-bottom: none;
	}
	.feed-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		margin-top: 0.3rem;
		flex-shrink: 0;
	}
	.feed-body {
		flex: 1;
	}
	.feed-msg {
		font-size: 0.82rem;
		color: #c0c0cc;
		margin: 0 0 2px;
		font-weight: 500;
	}
	.feed-sub {
		font-size: 0.73rem;
		color: #4a4a56;
		margin: 0;
	}
	.feed-time {
		font-size: 0.7rem;
		color: #38383f;
		font-family: 'DM Mono', monospace;
		white-space: nowrap;
		padding-top: 2px;
	}

	/* ── Booking list ── */
	.booking-list {
		display: flex;
		flex-direction: column;
	}
	.booking-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.875rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
	}
	.booking-item:last-child {
		border-bottom: none;
	}
	.booking-time {
		font-family: 'DM Mono', monospace;
		font-size: 0.78rem;
		color: #4a4a56;
		width: 36px;
		flex-shrink: 0;
	}
	.booking-details {
		flex: 1;
	}
	.booking-service {
		font-size: 0.83rem;
		color: #c8c8d4;
		font-weight: 500;
		margin: 0 0 2px;
	}
	.booking-customer {
		font-size: 0.72rem;
		color: #4a4a56;
		margin: 0;
	}
	.booking-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 4px;
	}
	.status-badge {
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.03em;
		padding: 0.18rem 0.55rem;
		border-radius: 999px;
		white-space: nowrap;
	}
	.booking-price {
		font-family: 'DM Mono', monospace;
		font-size: 0.78rem;
		color: #6b6b78;
	}

	/* ── Responsive ── */
	@media (max-width: 1100px) {
		.kpi-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		.main-grid {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 640px) {
		.dashboard {
			padding: 1rem 1rem 2rem;
		}
		.kpi-grid {
			grid-template-columns: 1fr 1fr;
		}
		.header-left {
			gap: 1rem;
		}
		.date-text {
			display: none;
		}
	}
</style>

<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { tick, untrack } from 'svelte';
	import { onDestroy, onMount } from 'svelte';
	import type { SupabaseClient } from '@supabase/supabase-js';
	import { supabase as realtimeClient } from '$lib/supabaseClient';

	let { data } = $props();

	// ─── Local types ────────────────────────────────────────────────────────────
	type CaseEvent = {
		event_type?: string;
		type?: string;
		note?: string;
		created_at?: string;
		actor_id?: string;
	};

	type CaseMessage = {
		id?: string;
		case_id?: string;
		body: string;
		sender_role: string;
		created_at?: string;
	};

	// ─── Meta maps ──────────────────────────────────────────────────────────────
	const STATUS_META: Record<string, { label: string; chip: string; dot: string }> = {
		submitted: {
			label: 'Submitted',
			chip: 'bg-blue-50 text-blue-800 ring-1 ring-blue-200',
			dot: 'bg-blue-400'
		},
		triaged: {
			label: 'Triaged',
			chip: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
			dot: 'bg-amber-400'
		},
		investigating: {
			label: 'Investigating',
			chip: 'bg-orange-50 text-orange-800 ring-1 ring-orange-200',
			dot: 'bg-orange-400'
		},
		awaiting_parties: {
			label: 'Awaiting parties',
			chip: 'bg-pink-50 text-pink-800 ring-1 ring-pink-200',
			dot: 'bg-pink-400'
		},
		escalated: {
			label: 'Escalated',
			chip: 'bg-red-50 text-red-800 ring-1 ring-red-200',
			dot: 'bg-red-500'
		},
		resolved: {
			label: 'Resolved',
			chip: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
			dot: 'bg-emerald-500'
		},
		rejected: {
			label: 'Rejected',
			chip: 'bg-red-50 text-red-800 ring-1 ring-red-200',
			dot: 'bg-red-400'
		},
		closed: {
			label: 'Closed',
			chip: 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200',
			dot: 'bg-zinc-400'
		}
	};

	const REFUND_META: Record<string, { label: string; chip: string }> = {
		not_requested: { label: 'No refund request', chip: 'bg-zinc-100 text-zinc-600' },
		requested: { label: 'Refund requested', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' },
		under_review: {
			label: 'Under review',
			chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
		},
		approved: {
			label: 'Approved',
			chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
		},
		rejected: {
			label: 'Refund rejected',
			chip: 'bg-red-50 text-red-700 ring-1 ring-red-200'
		},
		processed: {
			label: 'Processed',
			chip: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
		}
	};

	const SEVERITY_BAR: Record<string, string> = {
		low: 'bg-zinc-300',
		medium: 'bg-amber-400',
		high: 'bg-orange-500',
		critical: 'bg-red-600'
	};

	const VIEW_LABELS: Record<string, string> = {
		triage: 'Triage inbox',
		disputes: 'Disputes',
		reports: 'Reports',
		refunds: 'Refunds',
		all: 'All cases'
	};

	const VIEW_DESCRIPTIONS: Record<string, string> = {
		triage: 'Unassigned open cases — handle these first.',
		disputes: 'Booking and payment disputes. Open disputes block booking completion.',
		reports: 'User abuse and safety incident reports.',
		refunds: 'Cases with pending or under-review refund requests.',
		all: 'Full case queue across all types and statuses.'
	};

	// ─── Action loading state ────────────────────────────────────────────────────
	let updatingCase = $state(false);
	let sendingMessage = $state(false);

	// ─── Toast ───────────────────────────────────────────────────────────────────
	let toast = $state<{ message: string; ok: boolean } | null>(null);
	let toastTimer: ReturnType<typeof setTimeout>;

	function showToast(message: string, ok = true) {
		clearTimeout(toastTimer);
		toast = { message, ok };
		toastTimer = setTimeout(() => {
			toast = null;
		}, 3500);
	}

	// ─── Derived data ────────────────────────────────────────────────────────────
	const selected = $derived(data.selectedCase);

	const events = $derived(
		(data.selectedDetails?.events as CaseEvent[] | undefined) ?? []
	);
	const timelineActions = $derived(
		(data.selectedDetails?.actions as CaseEvent[] | undefined) ?? []
	);
	const messages = $derived(
		(data.selectedConversation?.messages as CaseMessage[] | undefined) ?? []
	);
	let liveMessages = $state<CaseMessage[]>([]);
	const displayedMessages = $derived(liveMessages);

	// ─── Realtime state ──
	let pgChannel: ReturnType<SupabaseClient['channel']> | null = null;
	let chatScrollEl = $state<HTMLDivElement | null>(null);
	let unreadByCaseId = $state<Record<string, number>>({});
	let lastMessageAtByCaseId = $state<Record<string, string>>({});
	let lastMessagePreviewByCaseId = $state<Record<string, string>>({});
	let currentSelectedCaseId = $state<string | null>(null);
	let refreshTimer: ReturnType<typeof setTimeout> | null = null;
	let refreshInFlight = $state(false);
	let realtimeWorksOnce = false;
	const debugRealtime = true;

	function debugLog(message: string, extra?: unknown) {
		if (!debugRealtime) return;
		console.log(`[ReportCaseChat][AdminWeb] ${message}`, extra ?? '');
	}

	// ─── Shared helpers ──────────────────────────────────────────────────────────
	function sortMessages(input: CaseMessage[]) {
		return [...input].sort(
			(a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
		);
	}

	function mergeMessage(message: CaseMessage) {
		const existsById = message.id && liveMessages.some((m) => m.id === message.id);
		if (existsById) return;

		const withoutMatchingOptimistic = liveMessages.filter((m) => {
			if (!m.id?.startsWith('admin-local-')) return true;
			return !(
				m.sender_role === message.sender_role &&
				m.body === message.body &&
				Math.abs(
					new Date(m.created_at ?? 0).getTime() - new Date(message.created_at ?? 0).getTime()
				) < 30_000
			);
		});

		liveMessages = sortMessages([...withoutMatchingOptimistic, message]);
	}

	function rowToMessage(row: Record<string, unknown>): CaseMessage {
		return {
			id: row.id?.toString(),
			case_id: row.case_id?.toString(),
			body: row.body?.toString() ?? '',
			sender_role: row.sender_role?.toString() ?? 'reporter',
			created_at: row.created_at?.toString() ?? new Date().toISOString()
		};
	}

	function updateRealtimeCasePreview(caseId: string, body: string, createdAt: string) {
		const currentTimes = untrack(() => lastMessageAtByCaseId);
		const currentPreviews = untrack(() => lastMessagePreviewByCaseId);
		lastMessageAtByCaseId = { ...currentTimes, [caseId]: createdAt };
		lastMessagePreviewByCaseId = { ...currentPreviews, [caseId]: body };
	}

	async function scrollChatToBottom(smooth = true) {
		await tick();
		if (!chatScrollEl) return;
		chatScrollEl.scrollTo({
			top: chatScrollEl.scrollHeight,
			behavior: smooth ? 'smooth' : 'auto'
		});
	}

	function scheduleRefresh(reason: string, payload?: unknown) {
		if (refreshTimer) clearTimeout(refreshTimer);
		refreshTimer = setTimeout(async () => {
			if (refreshInFlight) return;
			refreshInFlight = true;
			try {
				await invalidateAll();
			} finally {
				refreshInFlight = false;
			}
		}, 150);
	}

	// ─── Main realtime message handler ──────────────────────────────────────────
	function handleRealtimeMessage(row: Record<string, unknown>) {
		if (!row || !row.id) return;

		const rowCaseId = row.case_id?.toString();
		const senderRole = row.sender_role?.toString() ?? 'reporter';
		const rowCreatedAt = row.created_at?.toString() ?? new Date().toISOString();
		const selectedCaseId = currentSelectedCaseId;

		// Update queue sidebar preview for all cases
		if (rowCaseId) {
			updateRealtimeCasePreview(rowCaseId, row.body?.toString() ?? '', rowCreatedAt);
		}

		// Merge into active chat if viewing this case
		if (rowCaseId && rowCaseId === selectedCaseId) {
			mergeMessage(rowToMessage(row));
			if (senderRole !== 'admin') showToast('New reporter message received.');
			void scrollChatToBottom();
		}

		// Bump unread counter for other cases
		if (rowCaseId && rowCaseId !== selectedCaseId && senderRole !== 'admin') {
			const current = untrack(() => unreadByCaseId);
			unreadByCaseId = { ...current, [rowCaseId]: (current[rowCaseId] ?? 0) + 1 };
			showToast('New dispute/report message received.');
		}

		// Refresh server data for side-effects (thread preview, event log, etc.)
		scheduleRefresh('handleRealtimeMessage', row);
	}

	// ─── Mount: seed data + open realtime channels ──────────────────────────────
	onMount(() => {
		liveMessages = sortMessages(messages);
		debugLog('onMount -> seeded liveMessages', {
			selectedCaseId: data.selectedCaseId,
			seedCount: messages.length
		});

		if (data.flash === 'updated') showToast('Case updated successfully.');
		if (data.flash === 'sent') showToast('Message sent.');
		if (data.flash) {
			const clean = new URL(window.location.href);
			clean.searchParams.delete('flash');
			history.replaceState({}, '', clean.toString());
		}

		currentSelectedCaseId = (data.selectedCaseId as string | null) ?? null;
		const CASE_ID = currentSelectedCaseId;

		// ── Unified channel: postgres_changes CDC + broadcast diagnostic ──────
		pgChannel = realtimeClient
			.channel(`admin-report-cases-${CASE_ID ?? 'all'}`)
			.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'report_case_messages' }, (payload: { new?: Record<string, unknown>; old?: Record<string, unknown> }) => {
				debugLog('PG_INSERT -> report_case_messages', payload);
				if (payload.new) {
					realtimeWorksOnce = true;
					handleRealtimeMessage(payload.new as Record<string, unknown>);
				}
			})
			.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'report_case_messages' }, (payload: { new?: Record<string, unknown> }) => {
				debugLog('PG_UPDATE -> report_case_messages', payload);
				if (payload.new) {
					realtimeWorksOnce = true;
					handleRealtimeMessage(payload.new as Record<string, unknown>);
				}
			})
			.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'report_cases' }, (payload: unknown) => {
				debugLog('PG_INSERT -> report_cases', payload);
				scheduleRefresh('report_cases insert', payload);
			})
			.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'report_cases' }, (payload: unknown) => {
				debugLog('PG_UPDATE -> report_cases', payload);
				scheduleRefresh('report_cases update', payload);
			})
			// Broadcast fallback: processes DB trigger payload when CDC fails
			.on('broadcast', { event: '*' }, (payload: { payload?: Record<string, unknown> }) => {
				debugLog('BROADCAST_RAW -> received', payload);
				if (payload?.payload?.table === 'report_case_messages' && payload?.payload?.record) {
					realtimeWorksOnce = true;
					handleRealtimeMessage(payload.payload.record as Record<string, unknown>);
				} else {
					scheduleRefresh('broadcast event', payload);
				}
			})
			.subscribe((status: string, err?: Error) => {
				debugLog('pgChannel status', { status, err: err?.message });
			});

		// ── Polling fallback: activates if no realtime events within 15s ──────
		let pollFallbackTimer: ReturnType<typeof setInterval> | null = null;
		function activatePollingFallback() {
			debugLog('realtime fallback: activating 20s polling');
			pollFallbackTimer = setInterval(async () => {
				debugLog('FALLBACK_POLL -> invalidateAll');
				await invalidateAll();
			}, 20_000);
		}

		setTimeout(() => {
			if (!realtimeWorksOnce) {
				debugLog('realtime fallback: no events in 15s, switching to polling');
				activatePollingFallback();
			}
		}, 15_000);

		return () => {
			if (pgChannel) {
				pgChannel.unsubscribe();
				pgChannel = null;
			}
			if (pollFallbackTimer) clearInterval(pollFallbackTimer);
			if (refreshTimer) clearTimeout(refreshTimer);
		};
	});

	// ─── Effects ────────────────────────────────────────────────────────────────────
	$effect(() => {
		const selectedCaseId = (data.selectedCaseId as string | null) ?? null;
		if (untrack(() => currentSelectedCaseId) !== selectedCaseId) {
			currentSelectedCaseId = selectedCaseId;
		}
		if (selectedCaseId) {
			const current = untrack(() => unreadByCaseId);
			if (current[selectedCaseId]) {
				const next = { ...current };
				delete next[selectedCaseId];
				unreadByCaseId = next;
			}
		}
	});

	$effect(() => {
		const selectedCaseId = data.selectedCaseId as string | null;
		const seededMessages = sortMessages(messages);
		liveMessages = seededMessages;
		if (selectedCaseId) {
			const previousLastMessageAt = untrack(() => lastMessageAtByCaseId);
			lastMessageAtByCaseId = {
				...previousLastMessageAt,
				[selectedCaseId]: seededMessages[seededMessages.length - 1]?.created_at ?? selected?.created_at ?? ''
			};
		}
	});

	$effect(() => {
		void displayedMessages.length;
		void scrollChatToBottom();
	});

	onDestroy(() => {
		if (pgChannel) {
			pgChannel.unsubscribe();
			pgChannel = null;
		}
		if (refreshTimer) clearTimeout(refreshTimer);
	});

	// ─── Timeline ───────────────────────────────────────────────────────────────
	const timeline = $derived(
		[...events, ...timelineActions].sort(
			(a, b) =>
				new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
		)
	);

	const staleSet = $derived(new Set(data.staleIds ?? []));

	function caseActivityTs(c: (typeof data.cases)[number]) {
		const fromRealtime = lastMessageAtByCaseId[c.id];
		return new Date(fromRealtime ?? c.last_message_at ?? c.created_at ?? 0).getTime();
	}

	function caseLatestPreview(c: (typeof data.cases)[number]) {
		return lastMessagePreviewByCaseId[c.id] ?? c.last_message_preview ?? '';
	}

	const escalatedCases = $derived(
		data.cases
			.filter(
				(c: (typeof data.cases)[number]) =>
					c.status === 'escalated' || (c.severity ?? '').toLowerCase() === 'critical'
			)
			.sort((a, b) => caseActivityTs(b) - caseActivityTs(a))
	);
	const escalatedIds = $derived(new Set(escalatedCases.map((c: (typeof data.cases)[number]) => c.id)));
	const normalCases = $derived(
		data.cases
			.filter((c: (typeof data.cases)[number]) => !escalatedIds.has(c.id))
			.sort((a, b) => caseActivityTs(b) - caseActivityTs(a))
	);

	const isOpenDispute = $derived(
		!!selected &&
			['booking_dispute', 'payment_dispute', 'dispute'].includes(
				(selected.type ?? '').toLowerCase()
			) &&
			['submitted', 'triaged', 'investigating', 'awaiting_parties', 'escalated'].includes(
				(selected.status ?? '').toLowerCase()
			) &&
			!!selected.booking_id
	);

	// ─── URL helpers ─────────────────────────────────────────────────────────────
	const currentParams = $derived(new URLSearchParams($page.url.searchParams));

	function buildViewHref(view: string) {
		const p = new URLSearchParams();
		p.set('view', view);
		const q = currentParams.get('q');
		if (q) p.set('q', q);
		return `?${p.toString()}`;
	}

	function buildSelectHref(caseId: string) {
		const p = new URLSearchParams(currentParams);
		p.set('caseId', caseId);
		p.delete('flash');
		return `?${p.toString()}`;
	}

	// ─── Formatting ──────────────────────────────────────────────────────────────
	const pretty = (v: string) =>
		(v || '')
			.replaceAll('_', ' ')
			.split(' ')
			.map((w) => (w ? `${w[0].toUpperCase()}${w.slice(1)}` : w))
			.join(' ');

	function fmtTime(iso?: string) {
		if (!iso) return '';
		return new Date(iso).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	const NAV_TABS = $derived([
		{ view: 'triage', badge: data.stats.unassignedCount },
		{ view: 'disputes', badge: data.stats.openDisputes },
		{ view: 'reports', badge: data.stats.openReports },
		{ view: 'refunds', badge: data.stats.pendingRefunds },
		{ view: 'all', badge: data.stats.openCount }
	]);
</script>

<svelte:head>
	<title>Disputes & Reports — Admin</title>
</svelte:head>

{#if toast}
	<div
		class="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm shadow-lg {toast.ok
			? 'border-emerald-200 bg-emerald-50 text-emerald-800'
			: 'border-red-200 bg-red-50 text-red-800'}"
	>
		{#if toast.ok}
			<svg class="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
				<path
					fill-rule="evenodd"
					d="M10 18a16 16 0 100-32 8 8 0 0116 0zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
					clip-rule="evenodd"
				/>
			</svg>
		{:else}
			<svg class="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
					clip-rule="evenodd"
				/>
			</svg>
		{/if}
		{toast.message}
	</div>
{/if}

<div class="flex h-[calc(100vh-5.5rem)] flex-col gap-2 overflow-hidden p-4">

	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-lg font-semibold leading-none">Disputes & Reports</h1>
			<p class="mt-0.5 text-xs text-muted-foreground">
				{VIEW_DESCRIPTIONS[data.view] ?? ''}
			</p>
		</div>
		<div class="flex shrink-0 items-center gap-5 text-xs">
			<div class="text-center">
				<div class="text-base font-semibold text-red-600">{data.stats.openCount}</div>
				<div class="text-muted-foreground">Open</div>
			</div>
			<div class="text-center">
				<div class="text-base font-semibold text-orange-600">{data.stats.openDisputes}</div>
				<div class="text-muted-foreground">Disputes</div>
			</div>
			<div class="text-center">
				<div class="text-base font-semibold text-blue-600">{data.stats.pendingRefunds}</div>
				<div class="text-muted-foreground">Refunds</div>
			</div>
			<div class="text-center">
				<div class="text-base font-semibold text-amber-600">{data.stats.unassignedCount}</div>
				<div class="text-muted-foreground">Unassigned</div>
			</div>
		</div>
	</div>

	<div class="flex gap-0.5 border-b">
		{#each NAV_TABS as tab}
			<a
				href={buildViewHref(tab.view)}
				class="flex items-center gap-1.5 rounded-t border-b-2 px-3 py-1.5 text-sm transition-colors {data.view ===
				tab.view
					? 'border-primary font-medium text-primary'
					: 'border-transparent text-muted-foreground hover:text-foreground'}"
			>
				{VIEW_LABELS[tab.view]}
				{#if tab.badge > 0}
					<span
						class="rounded-full px-1.5 py-0.5 text-[10px] font-medium {data.view === tab.view
							? 'bg-primary/10 text-primary'
							: 'bg-zinc-100 text-zinc-600'}"
					>
						{tab.badge}
					</span>
				{/if}
			</a>
		{/each}
	</div>

	<form method="GET" class="flex flex-wrap items-center gap-2">
		<input type="hidden" name="view" value={data.view} />
		<input
			class="w-56 rounded border px-2 py-1 text-xs"
			name="q"
			placeholder="Search ID, subject, reporter…"
			value={data.filters.q}
		/>
		<select class="rounded border px-2 py-1 text-xs" name="status">
			<option value="all" selected={data.filters.status === 'all'}>All statuses</option>
			<option value="open" selected={data.filters.status === 'open'}>Open</option>
			<option value="closed" selected={data.filters.status === 'closed'}>Closed</option>
			{#each Object.keys(STATUS_META) as key}
				<option value={key} selected={data.filters.status === key}
					>{STATUS_META[key].label}</option
				>
			{/each}
		</select>
		<select class="rounded border px-2 py-1 text-xs" name="severity">
			<option value="all" selected={data.filters.severity === 'all'}>All severities</option>
			<option value="critical" selected={data.filters.severity === 'critical'}>Critical</option>
			<option value="high" selected={data.filters.severity === 'high'}>High</option>
			<option value="medium" selected={data.filters.severity === 'medium'}>Medium</option>
			<option value="low" selected={data.filters.severity === 'low'}>Low</option>
		</select>
		<button class="rounded bg-primary px-3 py-1 text-xs text-primary-foreground" type="submit">
			Apply
		</button>
		<a class="rounded border px-3 py-1 text-xs" href={buildViewHref(data.view)}>Reset</a>
	</form>

	{#if data.error}
		<div class="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
			{data.error}
		</div>
	{/if}

	<div class="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-[300px_1fr]">

		<aside class="flex min-h-0 flex-col overflow-hidden rounded-md border">
			<div class="flex items-center justify-between border-b px-3 py-2 text-xs">
				<span class="font-semibold">{VIEW_LABELS[data.view] ?? 'Cases'}</span>
				<span class="text-muted-foreground">
					{data.cases.length}
					{data.cases.length === 1 ? 'case' : 'cases'}
				</span>
			</div>

			<div class="flex-1 overflow-y-auto">
				{#if data.cases.length === 0}
					<div class="flex flex-col items-center gap-2 p-6 text-center">
						<svg class="h-8 w-8 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
								d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
						</svg>
						<p class="text-xs text-muted-foreground">
							{#if data.view === 'triage'}Inbox clear — no unassigned open cases.
							{:else if data.view === 'disputes'}No disputes match your filters.
							{:else if data.view === 'reports'}No reports match your filters.
							{:else if data.view === 'refunds'}No pending refund cases.
							{:else}No cases match your filters.{/if}
						</p>
					</div>
				{:else}
					{#if escalatedCases.length > 0}
						<div class="border-b bg-red-50/50 px-3 pb-2 pt-2.5">
							<div class="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
								<svg class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd"
										d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
										clip-rule="evenodd" />
								</svg>
								Escalated / Critical
							</div>
							{#each escalatedCases as c}
								<a
									href={buildSelectHref(c.id)}
									class="flex gap-2 rounded px-2 py-2 hover:bg-red-100/70 {data.selectedCaseId ===
									c.id ? 'bg-red-100' : ''}"
								>
									<div class="mt-1 w-1 flex-shrink-0 self-stretch rounded-full {SEVERITY_BAR[c.severity?.toLowerCase()] ?? 'bg-zinc-300'}"></div>
									<div class="min-w-0 flex-1">
										<div class="flex items-center gap-1">
											<span class="truncate text-xs font-medium">
												{c.subject ?? c.description?.slice(0, 60) ?? '—'}
											</span>
											{#if (unreadByCaseId[c.id] ?? 0) > 0}
												<span class="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
													{unreadByCaseId[c.id]}
												</span>
											{/if}
											{#if staleSet.has(c.id)}
												<span class="ml-auto flex-shrink-0 text-amber-600">
													<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
												</span>
											{/if}
										</div>
										<div class="mt-1 flex flex-wrap gap-1">
											{#if caseLatestPreview(c)}
												<div class="w-full truncate text-[10px] text-muted-foreground">Latest: {caseLatestPreview(c)}</div>
											{/if}
											<span class="rounded-full px-1.5 py-0.5 text-[10px] {STATUS_META[c.status]?.chip ?? 'bg-zinc-100 text-zinc-800'}">
												{STATUS_META[c.status]?.label ?? pretty(c.status)}
											</span>
										</div>
									</div>
								</a>
							{/each}
						</div>
					{/if}

					{#each normalCases as c}
						<a
							href={buildSelectHref(c.id)}
							class="flex gap-2 border-b px-3 py-2.5 hover:bg-muted/40 {data.selectedCaseId === c.id ? 'bg-muted' : ''}"
						>
							<div class="mt-1.5 w-1 flex-shrink-0 self-stretch rounded-full {SEVERITY_BAR[c.severity?.toLowerCase()] ?? 'bg-zinc-300'}"></div>
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-1">
									<span class="text-[10px] text-muted-foreground">{c.id} · {pretty(c.type)}</span>
									{#if (unreadByCaseId[c.id] ?? 0) > 0}
										<span class="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
											{unreadByCaseId[c.id]}
										</span>
									{/if}
									{#if staleSet.has(c.id)}
										<span class="ml-auto flex-shrink-0 text-amber-500">
											<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
										</span>
									{/if}
								</div>
								<div class="truncate text-sm">{c.subject ?? c.description?.slice(0, 60) ?? '—'}</div>
								{#if caseLatestPreview(c)}
									<div class="mt-0.5 truncate text-xs text-muted-foreground">Latest: {caseLatestPreview(c)}</div>
								{/if}
								<div class="mt-1.5 flex flex-wrap gap-1">
									<span class="rounded-full px-1.5 py-0.5 text-[10px] {STATUS_META[c.status]?.chip ?? 'bg-zinc-100 text-zinc-800'}">
										{STATUS_META[c.status]?.label ?? pretty(c.status)}
									</span>
									{#if c.refund_status && c.refund_status !== 'not_requested'}
										<span class="rounded-full px-1.5 py-0.5 text-[10px] {REFUND_META[c.refund_status]?.chip ?? 'bg-zinc-100 text-zinc-700'}">
											{REFUND_META[c.refund_status]?.label}
										</span>
									{/if}
								</div>
							</div>
						</a>
					{/each}
				{/if}
			</div>
		</aside>

		<section class="min-h-0 overflow-hidden rounded-md border">
			{#if !selected}
				<div class="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
					<svg class="h-10 w-10 text-muted-foreground/25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					<p class="text-sm text-muted-foreground">Select a case from the queue to inspect and handle it.</p>
				</div>
			{:else}
				<div class="border-b px-3 py-2.5">
					{#if isOpenDispute}
						<div class="mb-2.5 flex items-center gap-2 rounded bg-orange-50 px-2.5 py-2 text-xs text-orange-800 ring-1 ring-orange-200">
							<svg class="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
							</svg>
							Booking <span class="mx-0.5 font-medium">{selected.booking_id}</span> is locked — completion is blocked until this dispute is resolved.
						</div>
					{/if}

					<div class="mb-0.5 text-xs text-muted-foreground">
						{selected.id} · {pretty(selected.type)}
						{#if selected.booking_id && !isOpenDispute}· Booking {selected.booking_id}{/if}
					</div>
					<div class="text-base font-semibold">{selected.subject ?? 'Report case'}</div>

					<div class="mt-1.5 flex flex-wrap items-center gap-1.5">
						<span class="rounded-full px-2 py-0.5 text-xs {STATUS_META[selected.status]?.chip ?? 'bg-zinc-100 text-zinc-800'}">
							<span class="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle {STATUS_META[selected.status]?.dot ?? 'bg-zinc-400'}"></span>
							{STATUS_META[selected.status]?.label ?? pretty(selected.status)}
						</span>
						<span class="rounded-full px-2 py-0.5 text-xs {REFUND_META[selected.refund_status]?.chip ?? 'bg-zinc-100 text-zinc-700'}">
							{REFUND_META[selected.refund_status]?.label ?? pretty(selected.refund_status)}
						</span>
						<span class="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 ring-1 ring-zinc-200">
							<span class="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle {SEVERITY_BAR[selected.severity?.toLowerCase()] ?? 'bg-zinc-300'}"></span>
							{pretty(selected.severity)}
						</span>
						{#if selected.admin_owner_id}
							<span class="ml-auto text-xs text-muted-foreground">Assigned</span>
						{:else}
							<span class="ml-auto rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 ring-1 ring-amber-200">Unassigned</span>
						{/if}
					</div>
				</div>

				<div class="grid h-[calc(100%-6rem)] min-h-0 gap-3 p-3 xl:grid-cols-[1.1fr_0.9fr]">

					<div class="min-h-0 space-y-3 overflow-y-auto pr-1">

						<div class="rounded border p-3">
							<div class="mb-2.5 text-sm font-semibold">Update case</div>
							<form
								method="POST"
								action="?/updateCase"
								use:enhance={() => {
									updatingCase = true;
									return async ({ update, result }) => {
										updatingCase = false;
										if (result.type === 'failure') {
											const d = result.data as Record<string, string> | undefined;
											showToast(d?.updateError ?? 'Update failed.', false);
										} else if (result.type === 'success') {
											showToast('Case updated successfully.');
											await update();
										}
									};
								}}
								class="space-y-2.5"
							>
								<input type="hidden" name="caseId" value={selected.id} />
								<div class="grid grid-cols-2 gap-2">
									<div>
										<label class="mb-1 block text-xs text-muted-foreground" for="update-status">Status</label>
										<select id="update-status" name="status" class="w-full rounded border px-2 py-1 text-sm" value={selected.status}>
											{#each Object.keys(STATUS_META) as key}
												<option value={key}>{STATUS_META[key].label}</option>
											{/each}
										</select>
									</div>
									<div>
										<label class="mb-1 block text-xs text-muted-foreground" for="update-refund">Refund status</label>
										<select id="update-refund" name="refundStatus" class="w-full rounded border px-2 py-1 text-sm" value={selected.refund_status}>
											{#each Object.keys(REFUND_META) as key}
												<option value={key}>{REFUND_META[key].label}</option>
											{/each}
										</select>
									</div>
								</div>
								<div>
									<label class="mb-1 block text-xs text-muted-foreground" for="resolution-summary">Resolution summary</label>
									<textarea id="resolution-summary" class="w-full rounded border px-2 py-1 text-sm" rows="2"
										name="resolutionSummary" placeholder="How was this resolved…">{selected.resolution_summary ?? ''}</textarea>
								</div>
								<div>
									<label class="mb-1 block text-xs text-muted-foreground" for="action-note">Action note (logged to) timeline</label>
									<input id="action-note" class="w-full rounded border px-2 py-1 text-sm" name="actionNote"
										placeholder="e.g. Reviewed GPS data and booking logs…" />
								</div>
								<button class="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-60"
									type="submit" disabled={updatingCase}>
									{#if updatingCase}
										<svg class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
											<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
										</svg>
										Updating…
									{:else}Apply update{/if}
								</button>
							</form>
						</div>

						<div class="rounded border p-3">
							<div class="mb-1.5 text-sm font-semibold">Description</div>
							<p class="text-sm leading-relaxed text-foreground">{selected.description}</p>
							{#if selected.resolution_summary}
								<div class="mt-3 rounded bg-emerald-50 p-2.5 text-sm text-emerald-800 ring-1 ring-emerald-200">
									<span class="font-medium">Resolution: </span>{selected.resolution_summary}
								</div>
							{/if}
						</div>

						<div class="rounded border p-3">
							<div class="mb-2 text-sm font-semibold">Timeline</div>
							{#if timeline.length === 0}
								<p class="text-sm text-muted-foreground">No timeline entries yet.</p>
							{:else}
								<div class="relative pl-4">
									<div class="absolute bottom-2 left-[5px] top-2 w-px bg-border"></div>
									<div class="space-y-3.5">
										{#each timeline as entry}
											<div class="relative">
												<div class="absolute -left-4 top-1.5 h-2 w-2 rounded-full bg-primary/50 ring-2 ring-background"></div>
												<div class="text-xs font-medium">{pretty((entry.event_type ?? entry.type ?? '').toString()) || '—'}</div>
												{#if entry.note}<div class="text-xs text-muted-foreground">{entry.note}</div>{/if}
												{#if entry.created_at}
													<div class="mt-0.5 text-[10px] text-muted-foreground/60">{fmtTime(entry.created_at)}</div>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</div>

					<div class="flex h-full min-h-0 flex-col rounded border">
						<div class="flex items-center justify-between border-b px-3 py-2">
							<span class="text-sm font-semibold">Support chat</span>
							<span class="text-xs text-muted-foreground">
								{displayedMessages.length} {displayedMessages.length === 1 ? 'message' : 'messages'}
							</span>
						</div>

						<div bind:this={chatScrollEl} class="flex-1 space-y-2 overflow-y-auto p-3">
							{#if displayedMessages.length === 0}
								<div class="flex h-full flex-col items-center justify-center gap-1.5 text-center">
									<svg class="h-7 w-7 text-muted-foreground/25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
											d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
									</svg>
									<p class="text-xs text-muted-foreground">No messages yet. Start the conversation with the reporter.</p>
								</div>
							{:else}
								{#each displayedMessages as msg}
									<div class="flex {msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}">
										<div class="max-w-[88%] rounded-lg px-3 py-2 text-sm {msg.sender_role === 'admin'
											? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}">
											<div class="mb-0.5 text-[10px] opacity-60">
												{msg.sender_role === 'admin' ? 'Admin' : 'Reporter'}{msg.created_at ? ` · ${fmtTime(msg.created_at)}` : ''}
											</div>
											{msg.body}
										</div>
									</div>
								{/each}
							{/if}
						</div>

						<form
							method="POST"
							action="?/sendMessage"
							use:enhance={({ formElement }) => {
								sendingMessage = true;
								return async ({ update, result }) => {
									sendingMessage = false;
									if (result.type === 'failure') {
										const d = result.data as Record<string, string> | undefined;
										showToast(d?.messageError ?? 'Failed to send.', false);
									} else if (result.type === 'success') {
										const payload = result.data as { body?: string; caseId?: string } | undefined;
										const body = payload?.body?.trim();
										if (body) {
											const optimistic: CaseMessage = {
												id: `admin-local-${Date.now()}`,
												body,
												sender_role: 'admin',
												created_at: new Date().toISOString()
											};
											liveMessages = [...liveMessages, optimistic].sort(
												(a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
											);
										}
										formElement.reset();
										showToast('Message sent.');
									}
								};
							}}
							class="flex gap-2 border-t p-2.5"
						>
							<input type="hidden" name="caseId" value={selected.id} />
							<input name="body" class="flex-1 rounded border px-2 py-1.5 text-sm" placeholder="Reply to reporter…" />
							<button class="flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-60"
								type="submit" disabled={sendingMessage}>
								{#if sendingMessage}
									<svg class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
									</svg>
								{:else}Send{/if}
							</button>
						</form>
					</div>
				</div>
			{/if}
		</section>
	</div>
</div>

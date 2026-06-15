<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import {
		Search,
		ChevronDown,
		ChevronUp,
		ArrowRight,
		Copy,
		Check,
		Users,
		TrendingUp,
		Clock,
		AlertCircle,
		CheckCircle2,
		XCircle,
		Timer,
		CalendarDays,
		Link
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';

	type Affiliate = {
		id: string;
		affiliateUserId: string;
		activeCode: string;
		isCodeActive: boolean;
		createdAt: string | null;
		lifetimeGrossEarned: string;
		lifetimePaidOut: string;
		pendingHoldAmount: string;
		payableAmount: string;
		totalReferralEventsCount: number;
		uniqueReferredUsersCount: number;
		lastBatchGross: string | null;
		lastBatchNet: string | null;
		lastBatchStatus: string | null;
		lastBatchId: string | null;
		lastBatchPeriodEnd: string | null;
		latestWithdrawalAmount: string | null;
		latestWithdrawalStatus: string | null;
		latestWithdrawalDate: string | null;
		latestWithdrawalFailure: string | null;
	};

	type SortKey =
		| 'lifetimeGrossEarned'
		| 'payableAmount'
		| 'lifetimePaidOut'
		| 'uniqueReferredUsersCount'
		| 'totalReferralEventsCount'
		| 'createdAt';

	let { affiliates = [] }: { affiliates: Affiliate[] } = $props();

	let search = $state('');
	let activeCodeFilter = $state<'all' | 'active' | 'inactive'>('all');
	let activeWithdrawalFilter = $state('all');
	let sortKey = $state<SortKey>('lifetimeGrossEarned');
	let sortAsc = $state(false);
	let expandedId = $state<string | null>(null);
	let copiedCode = $state<string | null>(null);

	// ── Status configs ───────────────────────────────────────────────

	const BATCH_STATUS: Record<string, { label: string; class: string; dot: string }> = {
		pending: {
			label: 'Pending',
			dot: 'bg-amber-500',
			class:
				'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
		},
		processing: {
			label: 'Processing',
			dot: 'bg-blue-500',
			class:
				'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
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
		cancelled: {
			label: 'Cancelled',
			dot: 'bg-gray-400',
			class:
				'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
		}
	};

	const WITHDRAWAL_STATUS: Record<
		string,
		{ label: string; class: string; dot: string; icon: typeof CheckCircle2 }
	> = {
		pending: {
			label: 'Pending',
			dot: 'bg-amber-500',
			icon: Timer,
			class:
				'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
		},
		approved: {
			label: 'Approved',
			dot: 'bg-blue-500',
			icon: CheckCircle2,
			class:
				'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
		},
		processing: {
			label: 'Processing',
			dot: 'bg-violet-500',
			icon: Timer,
			class:
				'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800'
		},
		completed: {
			label: 'Completed',
			dot: 'bg-emerald-500',
			icon: CheckCircle2,
			class:
				'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
		},
		failed: {
			label: 'Failed',
			dot: 'bg-rose-500',
			icon: XCircle,
			class:
				'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
		},
		rejected: {
			label: 'Rejected',
			dot: 'bg-rose-500',
			icon: XCircle,
			class:
				'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
		}
	};

	function batchCfg(status: string | null) {
		if (!status) return null;
		return (
			BATCH_STATUS[status.toLowerCase()] ?? {
				label: status,
				dot: 'bg-gray-400',
				class:
					'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
			}
		);
	}

	function withdrawalCfg(status: string | null) {
		if (!status) return null;
		return (
			WITHDRAWAL_STATUS[status.toLowerCase()] ?? {
				label: status,
				dot: 'bg-gray-400',
				icon: Timer,
				class:
					'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
			}
		);
	}

	// ── Formatting ───────────────────────────────────────────────────

	function money(v: string | number | null) {
		if (v == null) return '—';
		const n = Number(v);
		if (n === 0) return '$0';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2
		}).format(n);
	}

	function formatDate(v: string | null) {
		if (!v) return '—';
		return new Date(v).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function balanceOwed(a: Affiliate) {
		return Number(a.lifetimeGrossEarned) - Number(a.lifetimePaidOut);
	}

	async function copyCode(code: string) {
		await navigator.clipboard.writeText(code);
		copiedCode = code;
		setTimeout(() => (copiedCode = null), 2000);
	}

	function toggleSort(key: SortKey) {
		if (sortKey === key) sortAsc = !sortAsc;
		else {
			sortKey = key;
			sortAsc = true;
		}
	}

	// ── Derived ──────────────────────────────────────────────────────

	const withdrawalStatuses = $derived(() => {
		const set = new Set(
			affiliates.map((a) => a.latestWithdrawalStatus).filter(Boolean) as string[]
		);
		return ['all', ...Array.from(set).sort()];
	});

	const filtered = $derived(() => {
		const q = search.toLowerCase().trim();
		return affiliates
			.filter((a) => {
				const matchSearch =
					!q ||
					a.activeCode.toLowerCase().includes(q) ||
					a.affiliateUserId.toLowerCase().includes(q);
				const matchCode =
					activeCodeFilter === 'all' ||
					(activeCodeFilter === 'active' ? a.isCodeActive : !a.isCodeActive);
				const matchWithdrawal =
					activeWithdrawalFilter === 'all' ||
					(a.latestWithdrawalStatus ?? '') === activeWithdrawalFilter;
				return matchSearch && matchCode && matchWithdrawal;
			})
			.sort((a, b) => {
				const numericKeys: SortKey[] = ['lifetimeGrossEarned', 'payableAmount', 'lifetimePaidOut'];
				let av: number | string = numericKeys.includes(sortKey)
					? Number(a[sortKey] ?? 0)
					: (a[sortKey] ?? 0);
				let bv: number | string = numericKeys.includes(sortKey)
					? Number(b[sortKey] ?? 0)
					: (b[sortKey] ?? 0);
				if (typeof av === 'string') av = av.toLowerCase();
				if (typeof bv === 'string') bv = bv.toLowerCase();
				if (av < bv) return sortAsc ? -1 : 1;
				if (av > bv) return sortAsc ? 1 : -1;
				return 0;
			});
	});

	const totals = $derived(() => ({
		gross: filtered().reduce((s, a) => s + Number(a.lifetimeGrossEarned), 0),
		paid: filtered().reduce((s, a) => s + Number(a.lifetimePaidOut), 0),
		payable: filtered().reduce((s, a) => s + Number(a.payableAmount), 0),
		hold: filtered().reduce((s, a) => s + Number(a.pendingHoldAmount), 0),
		referrals: filtered().reduce((s, a) => s + a.uniqueReferredUsersCount, 0)
	}));

	const CODE_FILTER = [
		{ value: 'all' as const, label: 'All codes' },
		{ value: 'active' as const, label: 'Active' },
		{ value: 'inactive' as const, label: 'Inactive' }
	];

	const SORT_BUTTONS: { key: SortKey; label: string }[] = [
		{ key: 'lifetimeGrossEarned', label: 'Gross' },
		{ key: 'payableAmount', label: 'Payable' },
		{ key: 'uniqueReferredUsersCount', label: 'Referrals' }
	];

	const COLS = [
		{ key: 'activeCode', label: 'Code' },
		{ key: 'lifetimeGrossEarned', label: 'Lifetime Gross' },
		{ key: 'lifetimePaidOut', label: 'Paid Out' },
		{ key: 'payableAmount', label: 'Payable' },
		{ key: null, label: 'Hold' },
		{ key: 'uniqueReferredUsersCount', label: 'Referrals' },
		{ key: 'totalReferralEventsCount', label: 'Events' },
		{ key: null, label: 'Last Batch' },
		{ key: null, label: 'Withdrawal' },
		{ key: null, label: '' }
	] as const;
</script>

<div class="block w-full space-y-4 font-sans lg:hidden">
	<!-- Header -->
	<div class="flex items-start justify-between gap-3">
		<div>
			<h2 class="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
				Affiliates
			</h2>
			<p class="text-sm text-gray-500 dark:text-gray-400">
				{filtered().length} of {affiliates.length} affiliates
			</p>
		</div>
		<!-- Code active toggle -->
		<div
			class="flex gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800"
		>
			{#each CODE_FILTER as f}
				<button
					onclick={() => (activeCodeFilter = f.value)}
					class="rounded-md px-3 py-1.5 text-xs font-medium transition-all
						{activeCodeFilter === f.value
						? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-50'
						: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}"
				>
					{f.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Summary stat cards -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
		<div
			class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
		>
			<p class="text-[11px] font-medium tracking-wider text-gray-400 uppercase">Gross Earned</p>
			<p class="mt-1 text-lg font-bold text-gray-900 dark:text-gray-50">{money(totals().gross)}</p>
		</div>
		<div
			class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
		>
			<p class="text-[11px] font-medium tracking-wider text-gray-400 uppercase">Paid Out</p>
			<p class="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
				{money(totals().paid)}
			</p>
		</div>
		<div
			class="rounded-xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40"
		>
			<p
				class="text-[11px] font-medium tracking-wider text-amber-500 uppercase dark:text-amber-400"
			>
				Payable Now
			</p>
			<p class="mt-1 text-lg font-bold text-amber-700 dark:text-amber-300">
				{money(totals().payable)}
			</p>
		</div>
		<div
			class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
		>
			<p class="text-[11px] font-medium tracking-wider text-gray-400 uppercase">In Hold</p>
			<p class="mt-1 text-lg font-bold text-gray-600 dark:text-gray-300">{money(totals().hold)}</p>
		</div>
		<div
			class="col-span-2 rounded-xl border border-gray-200 bg-white p-4 sm:col-span-1 dark:border-gray-700 dark:bg-gray-900"
		>
			<p class="text-[11px] font-medium tracking-wider text-gray-400 uppercase">Referrals</p>
			<p class="mt-1 text-lg font-bold text-gray-900 dark:text-gray-50">{totals().referrals}</p>
		</div>
	</div>

	<!-- Search -->
	<div class="relative">
		<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
		<Input
			bind:value={search}
			placeholder="Search by code or user ID…"
			class="h-10 bg-white pl-9 placeholder:text-gray-400 focus-visible:ring-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:focus-visible:ring-gray-600"
		/>
	</div>

	<!-- Sort buttons + withdrawal filter -->
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div class="flex items-center gap-1.5">
			<span class="text-[11px] font-medium tracking-wider text-gray-400 uppercase">Sort</span>
			{#each SORT_BUTTONS as btn}
				<button
					onclick={() => toggleSort(btn.key)}
					class="flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all
						{sortKey === btn.key
						? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900'
						: 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'}"
				>
					{btn.label}
					{#if sortKey === btn.key}
						{#if sortAsc}<ChevronUp class="size-3" />{:else}<ChevronDown class="size-3" />{/if}
					{/if}
				</button>
			{/each}
		</div>

		<!-- Withdrawal status filter -->
		{#if withdrawalStatuses().length > 2}
			<div class="flex scrollbar-none items-center gap-1.5 overflow-x-auto">
				<span class="shrink-0 text-[11px] font-medium tracking-wider text-gray-400 uppercase"
					>Withdrawal</span
				>
				{#each withdrawalStatuses() as status}
					{@const cfg = status === 'all' ? null : withdrawalCfg(status)}
					<button
						onclick={() => (activeWithdrawalFilter = status)}
						class="flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all
							{activeWithdrawalFilter === status
							? 'border-gray-700 bg-gray-700 text-white dark:border-gray-300 dark:bg-gray-300 dark:text-gray-900'
							: 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'}"
					>
						{#if cfg}<span class="size-1.5 rounded-full {cfg.dot}"></span>{/if}
						{status === 'all' ? 'All' : (cfg?.label ?? status)}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- ─── Mobile: Cards ─── -->
	<div class="flex flex-col gap-3 md:hidden">
		{#if filtered().length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center dark:border-gray-700"
			>
				<Link class="mb-3 size-8 text-gray-300 dark:text-gray-600" />
				<p class="text-sm font-medium text-gray-500 dark:text-gray-400">No affiliates found</p>
				<p class="mt-1 text-xs text-gray-400 dark:text-gray-500">Try adjusting your filters</p>
			</div>
		{/if}

		{#each filtered() as aff (aff.id)}
			{@const wCfg = withdrawalCfg(aff.latestWithdrawalStatus)}
			{@const bCfg = batchCfg(aff.lastBatchStatus)}
			{@const isOpen = expandedId === aff.id}
			{@const owed = balanceOwed(aff)}

			<div
				class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
			>
				<!-- Header: tap to expand -->
				<button
					onclick={() => (expandedId = isOpen ? null : aff.id)}
					class="flex w-full items-start justify-between gap-3 p-4 text-left"
				>
					<div class="flex min-w-0 flex-col gap-1.5">
						<!-- Code + active badge -->
						<div class="flex items-center gap-2">
							<span
								class="font-mono text-sm font-bold tracking-widest text-gray-900 dark:text-gray-50"
							>
								{aff.activeCode}
							</span>
							<span
								class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold
								{aff.isCodeActive
									? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
									: 'border border-gray-200 bg-gray-100 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}"
							>
								{aff.isCodeActive ? 'Active' : 'Inactive'}
							</span>
						</div>
						<div class="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
							<span class="flex items-center gap-1"
								><Users class="size-3" />{aff.uniqueReferredUsersCount} referred</span
							>
							<span class="flex items-center gap-1"
								><TrendingUp class="size-3" />{aff.totalReferralEventsCount} events</span
							>
						</div>
					</div>
					<div class="flex shrink-0 flex-col items-end gap-1">
						<span class="text-base font-bold text-gray-900 dark:text-gray-50"
							>{money(aff.lifetimeGrossEarned)}</span
						>
						<span class="text-xs text-gray-400">gross</span>
					</div>
				</button>

				<!-- Quick-view finance bar -->
				<div
					class="grid grid-cols-3 gap-px border-t border-gray-100 bg-gray-100 dark:border-gray-800 dark:bg-gray-800"
				>
					<div class="bg-white p-3 dark:bg-gray-900">
						<p class="text-[10px] font-medium tracking-wider text-gray-400 uppercase">Paid Out</p>
						<p class="mt-0.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
							{money(aff.lifetimePaidOut)}
						</p>
					</div>
					<div class="bg-amber-50 p-3 dark:bg-amber-950/30">
						<p class="text-[10px] font-medium tracking-wider text-amber-500 uppercase">Payable</p>
						<p class="mt-0.5 text-sm font-bold text-amber-700 dark:text-amber-300">
							{money(aff.payableAmount)}
						</p>
					</div>
					<div class="bg-white p-3 dark:bg-gray-900">
						<p class="text-[10px] font-medium tracking-wider text-gray-400 uppercase">Hold</p>
						<p class="mt-0.5 text-sm font-semibold text-gray-600 dark:text-gray-300">
							{money(aff.pendingHoldAmount)}
						</p>
					</div>
				</div>

				<!-- Expandable details -->
				{#if isOpen}
					<div class="border-t border-gray-100 dark:border-gray-800">
						<!-- Last batch -->
						{#if aff.lastBatchId}
							<div class="border-b border-gray-100 p-4 dark:border-gray-800">
								<p class="mb-2 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
									Last Payout Batch
								</p>
								<div class="flex items-center justify-between gap-3">
									<div class="flex flex-col gap-0.5">
										<div class="flex items-center gap-2">
											<span class="text-sm font-semibold text-gray-800 dark:text-gray-100"
												>{money(aff.lastBatchNet)}</span
											>
											<span class="text-xs text-gray-400">net</span>
											{#if aff.lastBatchGross !== aff.lastBatchNet}
												<span class="text-xs text-gray-400"
													>({money(aff.lastBatchGross)} gross)</span
												>
											{/if}
										</div>
										{#if aff.lastBatchPeriodEnd}
											<span class="flex items-center gap-1 text-xs text-gray-400">
												<CalendarDays class="size-3" />Period ended {formatDate(
													aff.lastBatchPeriodEnd
												)}
											</span>
										{/if}
									</div>
									{#if bCfg}
										<span
											class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium {bCfg.class}"
										>
											<span class="size-1.5 rounded-full {bCfg.dot}"></span>
											{bCfg.label}
										</span>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Latest withdrawal -->
						{#if aff.latestWithdrawalDate}
							<div class="border-b border-gray-100 p-4 dark:border-gray-800">
								<p class="mb-2 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
									Latest Withdrawal
								</p>
								<div class="flex items-center justify-between gap-3">
									<div class="flex flex-col gap-0.5">
										<span class="text-sm font-semibold text-gray-800 dark:text-gray-100"
											>{money(aff.latestWithdrawalAmount)}</span
										>
										<span class="flex items-center gap-1 text-xs text-gray-400">
											<Clock class="size-3" />{formatDate(aff.latestWithdrawalDate)}
										</span>
										{#if aff.latestWithdrawalFailure}
											<span
												class="mt-1 flex items-start gap-1 text-xs text-rose-600 dark:text-rose-400"
											>
												<AlertCircle class="mt-0.5 size-3 shrink-0" />
												{aff.latestWithdrawalFailure}
											</span>
										{/if}
									</div>
									{#if wCfg}
										<span
											class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium {wCfg.class}"
										>
											<span class="size-1.5 rounded-full {wCfg.dot}"></span>
											{wCfg.label}
										</span>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Balance owed -->
						<div
							class="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-800"
						>
							<div>
								<p class="text-[10px] font-medium tracking-wider text-gray-400 uppercase">
									Balance Owed
								</p>
								<p
									class="mt-0.5 text-sm font-bold
									{owed > 0 ? 'text-gray-900 dark:text-gray-50' : 'text-gray-400 dark:text-gray-500'}"
								>
									{money(owed)}
								</p>
								<p class="text-[10px] text-gray-400">gross – paid out</p>
							</div>
							<!-- Copy code -->
							<button
								onclick={() => copyCode(aff.activeCode)}
								class="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
							>
								{#if copiedCode === aff.activeCode}
									<Check class="size-3 text-emerald-500" />Copied
								{:else}
									<Copy class="size-3" />Copy code
								{/if}
							</button>
						</div>

						<!-- Footer action -->
						<div class="flex justify-end px-4 py-2.5">
							<Button
								size="sm"
								variant="ghost"
								onclick={() => goto(`/dashboard/affiliates/${aff.id}`)}
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
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-gray-50 dark:bg-gray-800/60">
					<tr>
						{#each COLS as col}
							<th
								class="px-4 py-3 text-left text-xs font-semibold tracking-wider whitespace-nowrap text-gray-500 uppercase dark:text-gray-400
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
									<Link class="size-8 text-gray-300 dark:text-gray-600" />
									<p class="text-sm font-medium text-gray-500 dark:text-gray-400">
										No affiliates found
									</p>
								</div>
							</td>
						</tr>
					{/if}

					{#each filtered() as aff (aff.id)}
						{@const wCfg = withdrawalCfg(aff.latestWithdrawalStatus)}
						{@const bCfg = batchCfg(aff.lastBatchStatus)}
						<tr class="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40">
							<!-- Code -->
							<td class="px-4 py-3">
								<div class="flex items-center gap-2">
									<span
										class="font-mono text-sm font-bold tracking-widest text-gray-900 dark:text-gray-50"
									>
										{aff.activeCode}
									</span>
									<button
										onclick={() => copyCode(aff.activeCode)}
										class="shrink-0 text-gray-400 transition-colors hover:text-gray-700 dark:hover:text-gray-200"
										title="Copy code"
									>
										{#if copiedCode === aff.activeCode}
											<Check class="size-3.5 text-emerald-500" />
										{:else}
											<Copy class="size-3.5" />
										{/if}
									</button>
									<span
										class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold
										{aff.isCodeActive
											? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
											: 'border border-gray-200 bg-gray-100 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'}"
									>
										{aff.isCodeActive ? '●' : '○'}
									</span>
								</div>
								<div class="mt-0.5 font-mono text-[10px] text-gray-400">
									{aff.affiliateUserId.slice(0, 8)}…
								</div>
							</td>

							<!-- Lifetime gross -->
							<td class="px-4 py-3 font-semibold whitespace-nowrap text-gray-900 dark:text-gray-50">
								{money(aff.lifetimeGrossEarned)}
							</td>

							<!-- Paid out -->
							<td
								class="px-4 py-3 font-semibold whitespace-nowrap text-emerald-600 dark:text-emerald-400"
							>
								{money(aff.lifetimePaidOut)}
							</td>

							<!-- Payable -->
							<td class="px-4 py-3 whitespace-nowrap">
								<span
									class="font-bold {Number(aff.payableAmount) > 0
										? 'text-amber-600 dark:text-amber-400'
										: 'text-gray-400 dark:text-gray-500'}"
								>
									{money(aff.payableAmount)}
								</span>
							</td>

							<!-- Hold -->
							<td class="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
								{money(aff.pendingHoldAmount)}
							</td>

							<!-- Referrals -->
							<td class="px-4 py-3">
								<span
									class="flex items-center gap-1.5 font-semibold text-gray-800 dark:text-gray-100"
								>
									<Users class="size-3.5 text-gray-400" />
									{aff.uniqueReferredUsersCount}
								</span>
							</td>

							<!-- Events -->
							<td class="px-4 py-3 text-gray-600 dark:text-gray-300">
								{aff.totalReferralEventsCount}
							</td>

							<!-- Last batch -->
							<td class="px-4 py-3">
								{#if aff.lastBatchId && bCfg}
									<div class="flex flex-col gap-0.5">
										<span class="font-medium text-gray-800 dark:text-gray-100"
											>{money(aff.lastBatchNet)}</span
										>
										<span
											class="inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium {bCfg.class}"
										>
											<span class="size-1.5 rounded-full {bCfg.dot}"></span>
											{bCfg.label}
										</span>
									</div>
								{:else}
									<span class="text-xs text-gray-300 dark:text-gray-600">—</span>
								{/if}
							</td>

							<!-- Withdrawal -->
							<td class="px-4 py-3">
								{#if aff.latestWithdrawalDate && wCfg}
									<div class="flex flex-col gap-0.5">
										<span class="font-medium text-gray-800 dark:text-gray-100"
											>{money(aff.latestWithdrawalAmount)}</span
										>
										<span
											class="inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium {wCfg.class}"
										>
											<span class="size-1.5 rounded-full {wCfg.dot}"></span>
											{wCfg.label}
										</span>
										{#if aff.latestWithdrawalFailure}
											<span
												class="max-w-[140px] truncate text-[10px] text-rose-500"
												title={aff.latestWithdrawalFailure}
											>
												{aff.latestWithdrawalFailure}
											</span>
										{/if}
									</div>
								{:else}
									<span class="text-xs text-gray-300 dark:text-gray-600">—</span>
								{/if}
							</td>

							<!-- Action -->
							<td class="px-4 py-3 text-right">
								<Button
									size="sm"
									variant="ghost"
									onclick={() => goto(`/dashboard/affiliates/${aff.id}`)}
									class="h-8 gap-1.5 px-3 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100"
								>
									View <ArrowRight class="size-3" />
								</Button>
							</td>
						</tr>
					{/each}
				</tbody>

				<!-- Totals footer -->
				{#if filtered().length > 0}
					<tfoot
						class="border-t-2 border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60"
					>
						<tr>
							<td
								class="px-4 py-2.5 text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400"
							>
								{filtered().length} total
							</td>
							<td class="px-4 py-2.5 font-bold whitespace-nowrap text-gray-900 dark:text-gray-50">
								{money(totals().gross)}
							</td>
							<td
								class="px-4 py-2.5 font-bold whitespace-nowrap text-emerald-600 dark:text-emerald-400"
							>
								{money(totals().paid)}
							</td>
							<td
								class="px-4 py-2.5 font-bold whitespace-nowrap text-amber-600 dark:text-amber-400"
							>
								{money(totals().payable)}
							</td>
							<td
								class="px-4 py-2.5 font-semibold whitespace-nowrap text-gray-600 dark:text-gray-300"
							>
								{money(totals().hold)}
							</td>
							<td class="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200">
								{totals().referrals}
							</td>
							<td colspan="4" class="px-4 py-2.5"></td>
						</tr>
					</tfoot>
				{/if}
			</table>
		</div>
	</div>
</div>

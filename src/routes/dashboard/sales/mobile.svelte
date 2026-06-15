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
		BadgePercent,
		Clock,
		Activity,
		UserCheck,
		UserX,
		ShieldAlert
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';

	type SalesPerson = {
		id: string;
		userId: string;
		status: string;
		totalSignups: number;
		totalEarnings: string;
		pendingEarnings: string;
		availableBalance: string;
		createdAt: string | null;
		tierName: string | null;
		tierRate: string | null;
		activeCodes: string[];
		recentSignups30Days: number;
	};

	type SortKey =
		| 'totalEarnings'
		| 'availableBalance'
		| 'totalSignups'
		| 'recentSignups30Days'
		| 'createdAt';

	let { salesPersons = [] }: { salesPersons: SalesPerson[] } = $props();

	let search = $state('');
	let activeStatus = $state('all');
	let activeTier = $state('all');
	let sortKey = $state<SortKey>('totalEarnings');
	let sortAsc = $state(false);
	let expandedId = $state<string | null>(null);
	let copiedCode = $state<string | null>(null);

	// ── Status config ────────────────────────────────────────────────

	const STATUS_CFG: Record<
		string,
		{ label: string; dot: string; class: string; icon: typeof UserCheck }
	> = {
		active: {
			label: 'Active',
			dot: 'bg-emerald-500',
			icon: UserCheck,
			class:
				'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
		},
		inactive: {
			label: 'Inactive',
			dot: 'bg-gray-400',
			icon: UserX,
			class:
				'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
		},
		suspended: {
			label: 'Suspended',
			dot: 'bg-rose-500',
			icon: ShieldAlert,
			class:
				'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
		},
		pending: {
			label: 'Pending',
			dot: 'bg-amber-500',
			icon: Clock,
			class:
				'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
		}
	};

	function statusCfg(s: string) {
		return (
			STATUS_CFG[s?.toLowerCase()] ?? {
				label: s,
				dot: 'bg-gray-400',
				icon: UserCheck,
				class:
					'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
			}
		);
	}

	// Tier colour cycling so each tier name gets a consistent hue
	const TIER_COLORS = [
		'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
		'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800',
		'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
		'bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800',
		'bg-pink-50 text-pink-700 border border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800'
	];

	// ── Formatting ───────────────────────────────────────────────────

	function money(v: string | number | null) {
		if (v == null) return '—';
		const n = Number(v);
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2
		}).format(n);
	}

	function formatRate(v: string | null) {
		if (!v) return '—';
		return `${money(v)} / signup`;
	}

	function formatDate(v: string | null) {
		if (!v) return '—';
		return new Date(v).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
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

	const statuses = $derived(() => {
		const set = new Set(salesPersons.map((s) => s.status));
		return ['all', ...Array.from(set).sort()];
	});

	const tiers = $derived(() => {
		const set = new Set(salesPersons.map((s) => s.tierName ?? 'No tier'));
		return ['all', ...Array.from(set).sort()];
	});

	const tierColorMap = $derived(() => {
		const map: Record<string, string> = {};
		let i = 0;
		for (const t of tiers()) {
			if (t !== 'all') map[t] = TIER_COLORS[i++ % TIER_COLORS.length];
		}
		return map;
	});

	const statusCounts = $derived(() => {
		const map: Record<string, number> = { all: salesPersons.length };
		for (const s of salesPersons) map[s.status] = (map[s.status] ?? 0) + 1;
		return map;
	});

	const filtered = $derived(() => {
		const q = search.toLowerCase().trim();
		return salesPersons
			.filter((s) => {
				const matchSearch =
					!q ||
					s.userId.toLowerCase().includes(q) ||
					s.activeCodes.some((c) => c.toLowerCase().includes(q)) ||
					(s.tierName ?? '').toLowerCase().includes(q);
				const matchStatus = activeStatus === 'all' || s.status === activeStatus;
				const matchTier = activeTier === 'all' || (s.tierName ?? 'No tier') === activeTier;
				return matchSearch && matchStatus && matchTier;
			})
			.sort((a, b) => {
				const numericKeys: SortKey[] = ['totalEarnings', 'availableBalance'];
				let av: string | number = numericKeys.includes(sortKey)
					? Number(a[sortKey] ?? 0)
					: (a[sortKey] ?? 0);
				let bv: string | number = numericKeys.includes(sortKey)
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
		earnings: filtered().reduce((s, p) => s + Number(p.totalEarnings), 0),
		pending: filtered().reduce((s, p) => s + Number(p.pendingEarnings), 0),
		balance: filtered().reduce((s, p) => s + Number(p.availableBalance), 0),
		signups: filtered().reduce((s, p) => s + p.totalSignups, 0),
		recent: filtered().reduce((s, p) => s + p.recentSignups30Days, 0)
	}));

	const SORT_BUTTONS: { key: SortKey; label: string }[] = [
		{ key: 'totalEarnings', label: 'Earnings' },
		{ key: 'availableBalance', label: 'Balance' },
		{ key: 'totalSignups', label: 'Signups' },
		{ key: 'recentSignups30Days', label: 'Last 30d' }
	];

	const COLS = [
		{ key: null, label: 'Sales Person' },
		{ key: null, label: 'Tier' },
		{ key: null, label: 'Status' },
		{ key: 'totalEarnings', label: 'Total Earned' },
		{ key: null, label: 'Pending' },
		{ key: 'availableBalance', label: 'Balance' },
		{ key: 'totalSignups', label: 'Signups' },
		{ key: 'recentSignups30Days', label: '30d' },
		{ key: null, label: 'Codes' },
		{ key: null, label: '' }
	] as const;
</script>

<div class="block w-full space-y-4 font-sans lg:hidden">
	<!-- Header -->
	<div class="flex flex-col gap-1">
		<h2 class="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">Sales Team</h2>
		<p class="text-sm text-gray-500 dark:text-gray-400">
			{filtered().length} of {salesPersons.length} sales persons
		</p>
	</div>

	<!-- Summary cards -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
		<div
			class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
		>
			<p class="text-[11px] font-medium tracking-wider text-gray-400 uppercase">Total Earned</p>
			<p class="mt-1 text-lg font-bold text-gray-900 dark:text-gray-50">
				{money(totals().earnings)}
			</p>
		</div>
		<div
			class="rounded-xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40"
		>
			<p
				class="text-[11px] font-medium tracking-wider text-amber-500 uppercase dark:text-amber-400"
			>
				Pending
			</p>
			<p class="mt-1 text-lg font-bold text-amber-700 dark:text-amber-300">
				{money(totals().pending)}
			</p>
		</div>
		<div
			class="rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40"
		>
			<p
				class="text-[11px] font-medium tracking-wider text-emerald-600 uppercase dark:text-emerald-400"
			>
				Available
			</p>
			<p class="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-300">
				{money(totals().balance)}
			</p>
		</div>
		<div
			class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
		>
			<p class="text-[11px] font-medium tracking-wider text-gray-400 uppercase">Total Signups</p>
			<p class="mt-1 text-lg font-bold text-gray-900 dark:text-gray-50">{totals().signups}</p>
		</div>
		<div
			class="col-span-2 rounded-xl border border-gray-200 bg-white p-4 sm:col-span-1 dark:border-gray-700 dark:bg-gray-900"
		>
			<p class="text-[11px] font-medium tracking-wider text-gray-400 uppercase">Signups (30d)</p>
			<p class="mt-1 text-lg font-bold text-gray-900 dark:text-gray-50">{totals().recent}</p>
		</div>
	</div>

	<!-- Search -->
	<div class="relative">
		<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
		<Input
			bind:value={search}
			placeholder="Search by user ID, code, or tier…"
			class="h-10 bg-white pl-9 placeholder:text-gray-400 focus-visible:ring-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:focus-visible:ring-gray-600"
		/>
	</div>

	<!-- Status filter -->
	<div class="flex scrollbar-none gap-1.5 overflow-x-auto pb-1">
		{#each statuses() as status}
			{@const cfg = status === 'all' ? null : statusCfg(status)}
			<button
				onclick={() => (activeStatus = status)}
				class="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all
					{activeStatus === status
					? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900'
					: 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'}"
			>
				{#if cfg}<span class="size-1.5 rounded-full {cfg.dot}"></span>{/if}
				{status === 'all' ? 'All statuses' : (cfg?.label ?? status)}
				<span
					class="rounded-full px-1.5 py-0.5 text-[10px] font-semibold
					{activeStatus === status
						? 'bg-white/20 text-white dark:bg-black/20 dark:text-gray-900'
						: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}"
				>
					{statusCounts()[status] ?? 0}
				</span>
			</button>
		{/each}
	</div>

	<!-- Tier + sort row -->
	<div class="flex flex-wrap items-center justify-between gap-3">
		<!-- Tier filter -->
		{#if tiers().length > 2}
			<div class="flex scrollbar-none items-center gap-2 overflow-x-auto">
				<span
					class="flex shrink-0 items-center gap-1 text-[11px] font-medium tracking-wider text-gray-400 uppercase"
				>
					<BadgePercent class="size-3" />Tier
				</span>
				{#each tiers() as tier}
					<button
						onclick={() => (activeTier = tier)}
						class="shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-all
							{activeTier === tier
							? 'border-gray-700 bg-gray-700 text-white dark:border-gray-300 dark:bg-gray-300 dark:text-gray-900'
							: 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'}"
					>
						{tier === 'all' ? 'All tiers' : tier}
					</button>
				{/each}
			</div>
		{/if}

		<!-- Sort buttons -->
		<div class="flex items-center gap-1.5">
			<span class="shrink-0 text-[11px] font-medium tracking-wider text-gray-400 uppercase"
				>Sort</span
			>
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
	</div>

	<!-- ─── Mobile: Cards ─── -->
	<div class="flex flex-col gap-3 md:hidden">
		{#if filtered().length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center dark:border-gray-700"
			>
				<Users class="mb-3 size-8 text-gray-300 dark:text-gray-600" />
				<p class="text-sm font-medium text-gray-500 dark:text-gray-400">No sales persons found</p>
				<p class="mt-1 text-xs text-gray-400 dark:text-gray-500">Try adjusting your filters</p>
			</div>
		{/if}

		{#each filtered() as sp (sp.id)}
			{@const sCfg = statusCfg(sp.status)}
			{@const tierColor = tierColorMap()[sp.tierName ?? 'No tier'] ?? TIER_COLORS[0]}
			{@const isOpen = expandedId === sp.id}

			<div
				class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
			>
				<!-- Card header -->
				<button
					onclick={() => (expandedId = isOpen ? null : sp.id)}
					class="flex w-full items-start justify-between gap-3 p-4 text-left"
				>
					<div class="flex min-w-0 flex-col gap-1.5">
						<div class="flex flex-wrap items-center gap-2">
							<span class="font-mono text-xs text-gray-500 dark:text-gray-400">
								{sp.userId.slice(0, 8)}…
							</span>
							<span
								class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium {sCfg.class}"
							>
								<span class="size-1.5 rounded-full {sCfg.dot}"></span>
								{sCfg.label}
							</span>
							{#if sp.tierName}
								<span
									class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium {tierColor}"
								>
									<BadgePercent class="size-2.5" />{sp.tierName}
								</span>
							{/if}
						</div>
						<div class="flex items-center gap-3 text-xs text-gray-400">
							<span class="flex items-center gap-1"
								><Users class="size-3" />{sp.totalSignups} signups</span
							>
							<span class="flex items-center gap-1"
								><Activity class="size-3" />{sp.recentSignups30Days} in 30d</span
							>
						</div>
					</div>
					<div class="flex shrink-0 flex-col items-end gap-0.5">
						<span class="text-base font-bold text-gray-900 dark:text-gray-50"
							>{money(sp.totalEarnings)}</span
						>
						<span class="text-xs text-gray-400">total earned</span>
					</div>
				</button>

				<!-- Finance bar -->
				<div
					class="grid grid-cols-3 gap-px border-t border-gray-100 bg-gray-100 dark:border-gray-800 dark:bg-gray-800"
				>
					<div class="bg-amber-50 p-3 dark:bg-amber-950/30">
						<p class="text-[10px] font-medium tracking-wider text-amber-500 uppercase">Pending</p>
						<p class="mt-0.5 text-sm font-bold text-amber-700 dark:text-amber-300">
							{money(sp.pendingEarnings)}
						</p>
					</div>
					<div class="bg-emerald-50 p-3 dark:bg-emerald-950/30">
						<p class="text-[10px] font-medium tracking-wider text-emerald-600 uppercase">
							Available
						</p>
						<p class="mt-0.5 text-sm font-bold text-emerald-700 dark:text-emerald-300">
							{money(sp.availableBalance)}
						</p>
					</div>
					<div class="bg-white p-3 dark:bg-gray-900">
						<p class="text-[10px] font-medium tracking-wider text-gray-400 uppercase">Rate</p>
						<p class="mt-0.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
							{money(sp.tierRate)}
						</p>
					</div>
				</div>

				<!-- Expanded details -->
				{#if isOpen}
					<div class="border-t border-gray-100 dark:border-gray-800">
						<!-- Active codes -->
						<div class="border-b border-gray-100 p-4 dark:border-gray-800">
							<p class="mb-2 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
								Active Codes ({sp.activeCodes.length})
							</p>
							{#if sp.activeCodes.length > 0}
								<div class="flex flex-wrap gap-2">
									{#each sp.activeCodes as code}
										<button
											onclick={() => copyCode(code)}
											class="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 font-mono text-xs font-semibold tracking-widest text-gray-800 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
										>
											{code}
											{#if copiedCode === code}
												<Check class="size-3 text-emerald-500" />
											{:else}
												<Copy class="size-3 text-gray-400" />
											{/if}
										</button>
									{/each}
								</div>
							{:else}
								<p class="text-xs text-gray-400">No active codes</p>
							{/if}
						</div>

						<!-- Joined + rate -->
						<div class="grid grid-cols-2 gap-px bg-gray-100 dark:bg-gray-800">
							<div class="bg-white p-3 dark:bg-gray-900">
								<p class="mb-0.5 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
									Joined
								</p>
								<p class="text-xs font-medium text-gray-700 dark:text-gray-200">
									{formatDate(sp.createdAt)}
								</p>
							</div>
							<div class="bg-white p-3 dark:bg-gray-900">
								<p class="mb-0.5 text-[10px] font-medium tracking-wider text-gray-400 uppercase">
									Commission Rate
								</p>
								<p class="text-xs font-semibold text-gray-700 dark:text-gray-200">
									{formatRate(sp.tierRate)}
								</p>
							</div>
						</div>

						<!-- Footer action -->
						<div class="flex justify-end px-4 py-2.5">
							<Button
								size="sm"
								variant="ghost"
								onclick={() => goto(`/dashboard/sales-persons/${sp.id}`)}
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
								<Users class="size-8 text-gray-300 dark:text-gray-600" />
								<p class="text-sm font-medium text-gray-500 dark:text-gray-400">
									No sales persons found
								</p>
							</div>
						</td>
					</tr>
				{/if}

				{#each filtered() as sp (sp.id)}
					{@const sCfg = statusCfg(sp.status)}
					{@const tierColor = tierColorMap()[sp.tierName ?? 'No tier'] ?? TIER_COLORS[0]}
					<tr class="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40">
						<!-- Sales person -->
						<td class="px-4 py-3">
							<div class="font-mono text-xs text-gray-500 dark:text-gray-400">
								{sp.userId.slice(0, 8)}…
							</div>
							<div class="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
								Joined {formatDate(sp.createdAt)}
							</div>
						</td>

						<!-- Tier -->
						<td class="px-4 py-3">
							{#if sp.tierName}
								<div class="flex flex-col gap-0.5">
									<span
										class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium {tierColor}"
									>
										<BadgePercent class="size-3" />{sp.tierName}
									</span>
									<span class="text-[10px] text-gray-400">{money(sp.tierRate)}/signup</span>
								</div>
							{:else}
								<span class="text-xs text-gray-300 dark:text-gray-600">—</span>
							{/if}
						</td>

						<!-- Status -->
						<td class="px-4 py-3">
							<span
								class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium {sCfg.class}"
							>
								<span class="size-1.5 rounded-full {sCfg.dot}"></span>
								{sCfg.label}
							</span>
						</td>

						<!-- Total earned -->
						<td class="px-4 py-3 font-semibold whitespace-nowrap text-gray-900 dark:text-gray-50">
							{money(sp.totalEarnings)}
						</td>

						<!-- Pending -->
						<td class="px-4 py-3 whitespace-nowrap">
							<span
								class={Number(sp.pendingEarnings) > 0
									? 'font-semibold text-amber-600 dark:text-amber-400'
									: 'text-gray-400 dark:text-gray-500'}
							>
								{money(sp.pendingEarnings)}
							</span>
						</td>

						<!-- Available balance -->
						<td class="px-4 py-3 whitespace-nowrap">
							<span
								class={Number(sp.availableBalance) > 0
									? 'font-bold text-emerald-600 dark:text-emerald-400'
									: 'text-gray-400 dark:text-gray-500'}
							>
								{money(sp.availableBalance)}
							</span>
						</td>

						<!-- Total signups -->
						<td class="px-4 py-3">
							<span
								class="flex items-center gap-1.5 font-semibold text-gray-800 dark:text-gray-100"
							>
								<Users class="size-3.5 text-gray-400" />{sp.totalSignups}
							</span>
						</td>

						<!-- 30d signups -->
						<td class="px-4 py-3">
							<span
								class="flex items-center gap-1.5
								{sp.recentSignups30Days > 0
									? 'font-semibold text-blue-600 dark:text-blue-400'
									: 'text-gray-400 dark:text-gray-500'}"
							>
								<TrendingUp
									class="size-3.5 {sp.recentSignups30Days > 0 ? 'text-blue-400' : 'text-gray-300'}"
								/>
								{sp.recentSignups30Days}
							</span>
						</td>

						<!-- Active codes -->
						<td class="px-4 py-3">
							{#if sp.activeCodes.length > 0}
								<div class="flex flex-wrap gap-1">
									{#each sp.activeCodes.slice(0, 2) as code}
										<button
											onclick={() => copyCode(code)}
											class="flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
										>
											{code}
											{#if copiedCode === code}
												<Check class="size-2.5 text-emerald-500" />
											{:else}
												<Copy class="size-2.5 text-gray-400" />
											{/if}
										</button>
									{/each}
									{#if sp.activeCodes.length > 2}
										<span
											class="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-400 dark:border-gray-700 dark:bg-gray-800"
										>
											+{sp.activeCodes.length - 2}
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
								onclick={() => goto(`/dashboard/sales-persons/${sp.id}`)}
								class="h-8 gap-1.5 px-3 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100"
							>
								View <ArrowRight class="size-3" />
							</Button>
						</td>
					</tr>
				{/each}
			</tbody>

			{#if filtered().length > 0}
				<tfoot
					class="border-t-2 border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60"
				>
					<tr>
						<td
							class="px-4 py-2.5 text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400"
							colspan="3"
						>
							{filtered().length} total
						</td>
						<td class="px-4 py-2.5 font-bold whitespace-nowrap text-gray-900 dark:text-gray-50">
							{money(totals().earnings)}
						</td>
						<td class="px-4 py-2.5 font-bold whitespace-nowrap text-amber-600 dark:text-amber-400">
							{money(totals().pending)}
						</td>
						<td
							class="px-4 py-2.5 font-bold whitespace-nowrap text-emerald-600 dark:text-emerald-400"
						>
							{money(totals().balance)}
						</td>
						<td class="px-4 py-2.5 font-semibold text-gray-700 dark:text-gray-200"
							>{totals().signups}</td
						>
						<td class="px-4 py-2.5 font-semibold text-blue-600 dark:text-blue-400"
							>{totals().recent}</td
						>
						<td colspan="2" class="px-4 py-2.5"></td>
					</tr>
				</tfoot>
			{/if}
		</table>
	</div>
</div>

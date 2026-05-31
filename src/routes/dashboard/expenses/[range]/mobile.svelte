<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar';
	import { Search, Receipt, Tag, CalendarDays, TrendingDown } from '@lucide/svelte';

	type Expense = {
		id: string;
		date: string;
		expenseType: string | null;
		amount: number;
		reason: string | null;
		addedBy: string;
		addedById: string;
	};

	let { expenses = [] }: { expenses: Expense[] } = $props();

	let searchQuery = $state('');

	const filtered = $derived(
		expenses.filter((e) => {
			const q = searchQuery.toLowerCase();
			if (!q) return true;
			return (
				(e.expenseType ?? '').toLowerCase().includes(q) ||
				(e.reason ?? '').toLowerCase().includes(q) ||
				(e.addedBy ?? '').toLowerCase().includes(q) ||
				e.date.toLowerCase().includes(q)
			);
		})
	);

	const totalAmount = $derived(filtered.reduce((sum, e) => sum + e.amount, 0));

	// Group filtered expenses by date
	const grouped = $derived(() => {
		const map = new Map<string, Expense[]>();
		for (const e of filtered) {
			const group = map.get(e.date) ?? [];
			group.push(e);
			map.set(e.date, group);
		}
		return [...map.entries()];
	});

	function formatAmount(amount: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD'
		}).format(amount);
	}

	function initials(name: string) {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	// Deterministic colour per type tag
	const TAG_COLORS = [
		'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
		'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
		'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
		'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
		'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
		'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
	];

	function typeColor(type: string | null) {
		if (!type) return 'bg-muted text-muted-foreground';
		let hash = 0;
		for (let i = 0; i < type.length; i++) hash = type.charCodeAt(i) + ((hash << 5) - hash);
		return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
	}
</script>

<div class="mx-auto block w-full max-w-2xl space-y-4 px-4 py-6 lg:hidden">
	<!-- Header -->
	<div class="flex items-start justify-between gap-2">
		<div class="space-y-0.5">
			<div class="flex items-center gap-2">
				<TrendingDown class="h-5 w-5 text-muted-foreground" />
				<h1 class="text-2xl font-semibold tracking-tight">Expenses</h1>
			</div>
			<p class="text-xs text-muted-foreground">
				{filtered.length} of {expenses.length} record{expenses.length !== 1 ? 's' : ''}
			</p>
		</div>

		<!-- Total -->
		<div class="shrink-0 text-right">
			<p class="text-xs text-muted-foreground">Total</p>
			<p class="text-xl font-bold text-red-600 tabular-nums dark:text-red-400">
				{formatAmount(totalAmount)}
			</p>
		</div>
	</div>

	<!-- Search -->
	<div class="relative">
		<Search
			class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
		/>
		<Input
			type="search"
			placeholder="Search by type, reason, person, date…"
			bind:value={searchQuery}
			class="h-10 w-full pl-9"
		/>
	</div>

	<!-- Empty state -->
	{#if filtered.length === 0}
		<div class="flex flex-col items-center justify-center gap-2 py-16 text-center">
			<Receipt class="h-8 w-8 text-muted-foreground/40" />
			<p class="text-sm text-muted-foreground">No expenses match your search.</p>
		</div>
	{:else}
		<!-- Grouped by date -->
		<div class="space-y-5">
			{#each grouped() as [date, group]}
				<div class="space-y-2">
					<!-- Date header -->
					<div class="flex items-center gap-2">
						<CalendarDays class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
						<span class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
							{date}
						</span>
						<div class="h-px flex-1 bg-border"></div>
						<span class="text-xs font-medium text-muted-foreground tabular-nums">
							{formatAmount(group.reduce((s, e) => s + e.amount, 0))}
						</span>
					</div>

					<!-- Expense cards -->
					<ul class="space-y-2">
						{#each group as expense (expense.id)}
							<li>
								<Card class="overflow-hidden transition-shadow hover:shadow-sm">
									<CardContent class="p-4">
										<div class="flex items-start gap-3">
											<!-- Type icon bubble -->
											<div
												class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                          {typeColor(expense.expenseType)}"
											>
												<Tag class="h-3.5 w-3.5" />
											</div>

											<!-- Main content -->
											<div class="min-w-0 flex-1 space-y-1">
												<div class="flex items-start justify-between gap-2">
													<!-- Reason -->
													<p class="line-clamp-2 text-sm leading-snug font-medium">
														{expense.reason ?? 'No description'}
													</p>
													<!-- Amount -->
													<span
														class="shrink-0 text-sm font-bold text-red-600 tabular-nums dark:text-red-400"
													>
														{formatAmount(expense.amount)}
													</span>
												</div>

												<div class="flex flex-wrap items-center gap-2">
													<!-- Expense type badge -->
													{#if expense.expenseType}
														<span
															class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                                {typeColor(expense.expenseType)}"
														>
															{expense.expenseType}
														</span>
													{:else}
														<span class="text-xs text-muted-foreground italic">Uncategorised</span>
													{/if}
												</div>

												<!-- Added by -->
												<div class="flex items-center gap-1.5 pt-0.5">
													<Avatar class="h-5 w-5">
														<AvatarFallback class="text-[9px]">
															{initials(expense.addedBy)}
														</AvatarFallback>
													</Avatar>
													<span class="truncate text-xs text-muted-foreground">
														{expense.addedBy}
													</span>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	{/if}
</div>

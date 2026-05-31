<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Search, ArrowDownLeft, ArrowUpRight, Clock, Receipt, Wallet } from '@lucide/svelte';

	type TransactionType = 'credit' | 'debit' | string;
	type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed' | string;

	type Transaction = {
		id: string;
		amount: number;
		type: TransactionType;
		status: TransactionStatus;
		description: string | null;
		bookingId: string | null;
		createdAt: Date | null;
	};

	let { transactions = [] }: { transactions: Transaction[] } = $props();

	let searchQuery = $state('');

	const filtered = $derived(
		transactions.filter((t) => {
			const q = searchQuery.toLowerCase();
			if (!q) return true;
			return (
				(t.description ?? '').toLowerCase().includes(q) ||
				(t.bookingId ?? '').toLowerCase().includes(q) ||
				t.type.toLowerCase().includes(q) ||
				t.status.toLowerCase().includes(q) ||
				t.id.toLowerCase().includes(q)
			);
		})
	);

	const totals = $derived({
		credits: filtered
			.filter((t) => t.type === 'credit' && t.status === 'completed')
			.reduce((sum, t) => sum + t.amount, 0),
		debits: filtered
			.filter((t) => t.type === 'debit' && t.status === 'completed')
			.reduce((sum, t) => sum + t.amount, 0)
	});

	function formatAmount(amount: number) {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
			amount / 100
		);
	}

	function formatDate(date: Date | null) {
		if (!date) return '—';
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(date));
	}

	function statusConfig(status: TransactionStatus) {
		switch (status) {
			case 'completed':
				return { label: 'Completed', variant: 'default' } as const;
			case 'pending':
				return { label: 'Pending', variant: 'secondary' } as const;
			case 'failed':
				return { label: 'Failed', variant: 'destructive' } as const;
			case 'reversed':
				return { label: 'Reversed', variant: 'outline' } as const;
			default:
				return { label: status, variant: 'outline' } as const;
		}
	}

	function isCredit(type: TransactionType) {
		return type === 'credit';
	}
</script>

<div class="mx-auto block w-full space-y-4 px-4 py-6 lg:hidden">
	<!-- Header -->
	<div class="flex items-center gap-2">
		<Wallet class="h-5 w-5 text-muted-foreground" />
		<h1 class="text-2xl font-semibold tracking-tight">Transactions</h1>
	</div>

	<!-- Summary cards -->
	<div class="grid grid-cols-2 gap-3">
		<Card class="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
			<CardContent class="space-y-0.5 p-3">
				<p class="flex items-center gap-1 text-xs text-muted-foreground">
					<ArrowDownLeft class="h-3 w-3 text-green-600" /> Credits
				</p>
				<p class="text-lg font-bold text-green-700 dark:text-green-400">
					{formatAmount(totals.credits)}
				</p>
			</CardContent>
		</Card>
		<Card class="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
			<CardContent class="space-y-0.5 p-3">
				<p class="flex items-center gap-1 text-xs text-muted-foreground">
					<ArrowUpRight class="h-3 w-3 text-red-600" /> Debits
				</p>
				<p class="text-lg font-bold text-red-700 dark:text-red-400">
					{formatAmount(totals.debits)}
				</p>
			</CardContent>
		</Card>
	</div>

	<!-- Search + count -->
	<div class="space-y-2">
		<div class="relative">
			<Search
				class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
			/>
			<Input
				type="search"
				placeholder="Search by description, booking ID, type…"
				bind:value={searchQuery}
				class="h-10 w-full pl-9"
			/>
		</div>
		<p class="px-0.5 text-xs text-muted-foreground">
			{filtered.length} of {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
		</p>
	</div>

	<!-- List -->
	{#if filtered.length === 0}
		<div class="flex flex-col items-center justify-center gap-2 py-16 text-center">
			<Receipt class="h-8 w-8 text-muted-foreground/40" />
			<p class="text-sm text-muted-foreground">No transactions match your search.</p>
		</div>
	{:else}
		<ul class="space-y-2">
			{#each filtered as tx (tx.id)}
				{@const sc = statusConfig(tx.status)}
				{@const credit = isCredit(tx.type)}
				<li>
					<Card class="overflow-hidden transition-shadow hover:shadow-sm">
						<CardContent class="p-4">
							<div class="flex items-start gap-3">
								<!-- Icon -->
								<div
									class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                    {credit
										? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
										: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}"
								>
									{#if credit}
										<ArrowDownLeft class="h-4 w-4" />
									{:else}
										<ArrowUpRight class="h-4 w-4" />
									{/if}
								</div>

								<!-- Content -->
								<div class="min-w-0 flex-1 space-y-1">
									<div class="flex items-start justify-between gap-2">
										<!-- Description -->
										<p class="truncate text-sm leading-snug font-medium">
											{tx.description ?? 'No description'}
										</p>
										<!-- Amount -->
										<span
											class="shrink-0 text-sm font-bold tabular-nums
                        {credit
												? 'text-green-700 dark:text-green-400'
												: 'text-red-700 dark:text-red-400'}"
										>
											{credit ? '+' : '-'}{formatAmount(tx.amount)}
										</span>
									</div>

									<div class="flex flex-wrap items-center gap-2">
										<Badge variant={sc.variant} class="h-5 py-0 text-xs">{sc.label}</Badge>

										{#if tx.bookingId}
											<span class="max-w-40 truncate font-mono text-xs text-muted-foreground">
												#{tx.bookingId.slice(0, 8)}
											</span>
										{/if}
									</div>

									<div class="flex items-center gap-1 text-xs text-muted-foreground">
										<Clock class="h-3 w-3 shrink-0" />
										<span>{formatDate(tx.createdAt)}</span>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</li>
			{/each}
		</ul>
	{/if}
</div>

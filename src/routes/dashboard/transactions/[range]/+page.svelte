<script lang="ts">
	import { columns } from './columns';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import DateMonth from '$lib/formComponents/DateMonth.svelte';
	import { page } from '$app/state';
	import { Frown, ArrowLeft, CalendarDays } from '@lucide/svelte';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';
	import { formatDate } from '$lib/global.svelte.js';
	import Mobile from './mobile.svelte';

	let { data } = $props();

	let filteredList = $derived(data?.allTransactions);
</script>

<svelte:head>
	<title>Transactions</title>
</svelte:head>

<div class="mx-auto flex w-full flex-col justify-start gap-8 p-6">
	<div class="flex flex-col gap-4">
		<div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Transactions History</h1>
				<p class="mt-1 text-muted-foreground">
					Reviewing {data.allTransactions?.length ?? 0} transactions from {formatDate(
						new Date(data?.start)
					)} to {formatDate(new Date(data?.start))}
				</p>
			</div>

			<div class="flex items-center gap-2">
				<DateMonth start={data?.start} end={data?.end} link="/dashboard/transactions" />
			</div>
		</div>
	</div>

	<hr class="border-border" />

	{#if data.allTransactions.length === 0}
		<div
			class="flex min-h-100 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center"
		>
			<div class="flex size-20 items-center justify-center rounded-full bg-muted">
				<CalendarDays class="size-10 text-muted-foreground" />
			</div>
			<h3 class="mt-6 text-xl font-semibold">No transactions found</h3>
			<p class="mt-2 mb-8 max-w-sm text-muted-foreground">
				There are no transactions recorded for the selected date range. Try selecting a different
				period.
			</p>
			<DateMonth
				start={data?.start}
				end={data?.end}
				link="/dashboard/vendor/{page.params.id}/transactions"
			/>
		</div>
	{:else}
		<div class="rounded-lg border bg-card shadow-sm">
			<FilterMenu
				data={data?.allTransactions}
				bind:filteredList
				filterKeys={['type', 'amount', 'status']}
			/>
			<Mobile transactions={filteredList} />
			<DataTable
				data={filteredList}
				fileName="Transactions History - {data?.start} to {data?.end}"
				{columns}
			/>
		</div>
	{/if}
</div>

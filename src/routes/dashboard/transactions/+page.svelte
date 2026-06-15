<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import { columns } from './columns';

	import DataTable from '$lib/components/Table/data-table.svelte';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';
	import QueryBuilder, { type QueryFilterPayload } from '$lib/components/query-builder.svelte';

	import Mobile from './mobile.svelte';

	import Label from '$lib/components/ui/label/label.svelte';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';

	import { CalendarDays } from '@lucide/svelte';

	let { data } = $props();

	let filteredList = $derived(data?.allTransactions);

	type TransactionQueryFilters = {
		type: string;
		status: string;
	};

	const initialCustomFilters: TransactionQueryFilters = {
		type: data.query.type ?? '',
		status: data.query.status ?? ''
	};

	function updateUrl(payload: QueryFilterPayload<TransactionQueryFilters>) {
		const params = new URLSearchParams(page.url.searchParams);

		setOrDelete(params, 'search', payload.search);

		if (payload.dateRange) {
			setOrDelete(params, 'start', payload.dateRange.start.toString());
			setOrDelete(params, 'end', payload.dateRange.end.toString());
		}

		setOrDelete(params, 'type', payload.customFilters.type);
		setOrDelete(params, 'status', payload.customFilters.status);

		goto(`?${params.toString()}`, {
			keepFocus: true,
			noScroll: true
		});
	}

	function setOrDelete(
		params: URLSearchParams,
		key: string,
		value: string | number | null | undefined
	) {
		const normalizedValue = String(value ?? '').trim();

		if (normalizedValue) {
			params.set(key, normalizedValue);
		} else {
			params.delete(key);
		}
	}
</script>

<svelte:head>
	<title>Transactions</title>
</svelte:head>

<div class="mx-auto flex w-full flex-col justify-start gap-8 p-6">
	<div class="flex flex-col gap-4">
		<div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Transactions History</h1>
			</div>
		</div>
	</div>

	<hr class="border-border" />

	<QueryBuilder
		title="Transactions Dataset"
		description="Load transactions by date range, type, status, description, or booking ID"
		showDate
		showPageSize={false}
		initialSearch={data.query.search}
		initialStart={data.query.start}
		initialEnd={data.query.end}
		{initialCustomFilters}
		submitMode="manual"
		searchPlaceholder="Search description, booking ID, or transaction ID..."
		onQueryChange={updateUrl}
	>
		{#snippet children(filters, update)}
			<div class="flex flex-col gap-2">
				<Label class="text-sm font-medium">Transaction Type</Label>

				<Select type="single" value={filters.type} onValueChange={(value) => update('type', value)}>
					<SelectTrigger class="w-full">
						{filters.type || 'All transaction types'}
					</SelectTrigger>

					<SelectContent>
						<SelectItem value="">All transaction types</SelectItem>

						<!-- Adjust these values to match your actual DB values -->
						<SelectItem value="credit">Credit</SelectItem>
						<SelectItem value="debit">Debit</SelectItem>
						<SelectItem value="payment">Payment</SelectItem>
						<SelectItem value="refund">Refund</SelectItem>
						<SelectItem value="withdrawal">Withdrawal</SelectItem>
						<SelectItem value="deposit">Deposit</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div class="flex flex-col gap-2">
				<Label class="text-sm font-medium">Transaction Status</Label>

				<Select
					type="single"
					value={filters.status}
					onValueChange={(value) => update('status', value)}
				>
					<SelectTrigger class="w-full">
						{filters.status || 'All statuses'}
					</SelectTrigger>

					<SelectContent>
						<SelectItem value="">All statuses</SelectItem>

						<!-- Adjust these values to match your actual DB values -->
						<SelectItem value="pending">Pending</SelectItem>
						<SelectItem value="completed">Completed</SelectItem>
						<SelectItem value="failed">Failed</SelectItem>
						<SelectItem value="canceled">Canceled</SelectItem>
					</SelectContent>
				</Select>
			</div>
		{/snippet}
	</QueryBuilder>

	{#if data.allTransactions.length === 0}
		<div
			class="flex min-h-100 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center"
		>
			<div class="flex size-20 items-center justify-center rounded-full bg-muted">
				<CalendarDays class="size-10 text-muted-foreground" />
			</div>

			<h3 class="mt-6 text-xl font-semibold">No transactions found</h3>

			<p class="mt-2 mb-8 max-w-sm text-muted-foreground">
				There are no transactions for the selected filters.
			</p>
		</div>
	{:else}
		<div class="rounded-lg border bg-card p-4 shadow-sm">
			<FilterMenu
				data={data?.allTransactions}
				bind:filteredList
				filterKeys={['type', 'amount', 'status']}
			/>

			<Mobile transactions={filteredList} />

			<DataTable
				data={filteredList}
				fileName={`Transactions History ${data.query.start} - ${data.query.end}`}
				{columns}
			/>
		</div>
	{/if}
</div>

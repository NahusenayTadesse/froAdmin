<script lang="ts">
	import { columns } from './columns';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import DateMonth from '$lib/formComponents/DateMonth.svelte';
	import { page } from '$app/state';
	import { ArrowLeft, CalendarDays } from '@lucide/svelte';

	import { goto } from '$app/navigation';
	import QueryBuilder, { type QueryFilterPayload } from '$lib/components/query-builder.svelte';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';

	let { data } = $props();

	interface EarningsFilters {
		status: string;
	}

	// Deriving state from page data keeps the inputs synchronized with the current URL
	let initialCustomFilters = $derived<EarningsFilters>({
		status: data.statusFilter
	});

	// Triggered whenever any search, page size, or dropdown value alters
	function handleQueryChange(payload: QueryFilterPayload<EarningsFilters>) {
		const newUrl = new URL(page.url);

		// Update or clean global search parameters
		if (payload.search) {
			newUrl.searchParams.set('search', payload.search);
		} else {
			newUrl.searchParams.delete('search');
		}

		// Update page size
		newUrl.searchParams.set('pageSize', String(payload.pageSize));

		// Update custom domain parameters (status)
		if (payload.customFilters.status) {
			newUrl.searchParams.set('status', payload.customFilters.status);
		} else {
			newUrl.searchParams.delete('status');
		}

		// Reset page numbers back to page 1 on filter modification to avoid empty view indexes
		newUrl.searchParams.set('earningsPage', '1');

		// Perform shallow SvelteKit push state update
		goto(newUrl, { keepFocus: true, replaceState: true });
	}
</script>

<svelte:head>
	<title>Earnings| {data?.salesPerson?.name ?? 'Sales Person'}</title>
</svelte:head>

<div class="mx-auto flex w-full flex-col justify-start gap-8 p-6">
	<div class="flex flex-col gap-4">
		<Button href="/dashboard/sales/single/{page.params.id}" class="w-fit gap-2 ">
			<ArrowLeft class="size-4" />
			Back to {data?.salesPerson?.name}
		</Button>

		<QueryBuilder
			title="Earnings Analytics"
			description="Search referrals, filter payout status, and adjust table views"
			initialSearch={data.search}
			initialPageSize={data.pageSize}
			{initialCustomFilters}
			onQueryChange={handleQueryChange}
		>
			{#snippet children(filters, updateFilter)}
				<div class="flex flex-col gap-2">
					<label for="status-select" class="text-sm font-medium text-foreground">
						Payout Status
					</label>
					<Select
						type="single"
						bind:value={filters.status}
						onValueChange={(val) => updateFilter('status', val)}
					>
						<SelectTrigger id="status-select">
							{filters.status ?? 'All Statuses'}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="PENDING">Pending</SelectItem>
							<SelectItem value="PAID">Paid</SelectItem>
							<SelectItem value="FAILED">Failed</SelectItem>
						</SelectContent>
					</Select>
				</div>
			{/snippet}
		</QueryBuilder>

		<div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Earnings History</h1>
				<p class="mt-1 text-muted-foreground">
					Reviewing {data.earnings?.length ?? 0} Earnings for {data?.salesPerson?.name}
				</p>
			</div>
		</div>
	</div>

	<hr class="border-border" />

	{#if data.earnings.length === 0}
		<div
			class="flex min-h-100 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center"
		>
			<div class="flex size-20 items-center justify-center rounded-full bg-muted">
				<CalendarDays class="size-10 text-muted-foreground" />
			</div>
			<h3 class="mt-6 text-xl font-semibold">No Earnings found</h3>
		</div>
	{:else}
		<div class="rounded-lg border bg-card shadow-sm">
			<DataTable
				data={data.earnings}
				fileName="Earnings History - {data?.salesPerson?.name}"
				{columns}
			/>
		</div>
	{/if}
</div>

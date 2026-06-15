<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import { columns } from './columns';

	import DataTable from '$lib/components/Table/data-table.svelte';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';
	import QueryBuilder, { type QueryFilterPayload } from '$lib/components/query-builder.svelte';

	import Label from '$lib/components/ui/label/label.svelte';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';

	import { CalendarDays } from '@lucide/svelte';
	import Mobile from './mobile.svelte';

	let { data } = $props();

	let filteredList = $derived(data?.affiliates);

	type AffiliateQueryFilters = {
		isCodeActive: string;
		lastBatchStatus: string;
		latestWithdrawalStatus: string;
	};

	const initialCustomFilters: AffiliateQueryFilters = {
		isCodeActive:
			data.query.isCodeActive === null || data.query.isCodeActive === undefined
				? ''
				: String(data.query.isCodeActive),
		lastBatchStatus: data.query.lastBatchStatus ?? '',
		latestWithdrawalStatus: data.query.latestWithdrawalStatus ?? ''
	};

	function updateUrl(payload: QueryFilterPayload<AffiliateQueryFilters>) {
		const params = new URLSearchParams(page.url.searchParams);

		setOrDelete(params, 'search', payload.search);

		if (payload.dateRange) {
			setOrDelete(params, 'start', payload.dateRange.start.toString());
			setOrDelete(params, 'end', payload.dateRange.end.toString());
		}

		setOrDelete(params, 'isCodeActive', payload.customFilters.isCodeActive);
		setOrDelete(params, 'lastBatchStatus', payload.customFilters.lastBatchStatus);
		setOrDelete(params, 'latestWithdrawalStatus', payload.customFilters.latestWithdrawalStatus);

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
	<title>Affiliates List</title>
</svelte:head>

<div class="mx-auto flex w-full flex-col justify-start gap-8 lg:p-6">
	<div class="flex flex-col gap-4">
		<div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
			<div>
				<p class="mt-1 text-muted-foreground">
					Reviewing {data?.affiliates?.length ?? 0} Affiliates
				</p>
			</div>
		</div>
	</div>

	<hr class="border-border" />

	<QueryBuilder
		title="Affiliates Dataset"
		description="Load affiliates by date range, code, payout status, withdrawal status, or active state"
		showDate
		showPageSize={false}
		initialSearch={data.query.search}
		initialStart={data.query.start}
		initialEnd={data.query.end}
		{initialCustomFilters}
		submitMode="manual"
		searchPlaceholder="Search affiliate code, affiliate user ID, or affiliate code ID..."
		onQueryChange={updateUrl}
	>
		{#snippet children(filters, update)}
			<div class="flex flex-col gap-2">
				<Label class="text-sm font-medium">Code Status</Label>

				<Select
					type="single"
					value={filters.isCodeActive}
					onValueChange={(value) => update('isCodeActive', value)}
				>
					<SelectTrigger class="w-full">
						{filters.isCodeActive === 'true'
							? 'Active codes'
							: filters.isCodeActive === 'false'
								? 'Inactive codes'
								: 'All codes'}
					</SelectTrigger>

					<SelectContent>
						<SelectItem value="">All codes</SelectItem>
						<SelectItem value="true">Active codes</SelectItem>
						<SelectItem value="false">Inactive codes</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div class="flex flex-col gap-2">
				<Label class="text-sm font-medium">Latest Batch Status</Label>

				<Select
					type="single"
					value={filters.lastBatchStatus}
					onValueChange={(value) => update('lastBatchStatus', value)}
				>
					<SelectTrigger class="w-full">
						{filters.lastBatchStatus || 'All batch statuses'}
					</SelectTrigger>

					<SelectContent>
						<SelectItem value="">All batch statuses</SelectItem>

						<!-- Adjust values if your DB uses different status names -->
						<SelectItem value="pending">Pending</SelectItem>
						<SelectItem value="processing">Processing</SelectItem>
						<SelectItem value="paid">Paid</SelectItem>
						<SelectItem value="failed">Failed</SelectItem>
						<SelectItem value="canceled">Canceled</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div class="flex flex-col gap-2">
				<Label class="text-sm font-medium">Latest Withdrawal Status</Label>

				<Select
					type="single"
					value={filters.latestWithdrawalStatus}
					onValueChange={(value) => update('latestWithdrawalStatus', value)}
				>
					<SelectTrigger class="w-full">
						{filters.latestWithdrawalStatus || 'All withdrawal statuses'}
					</SelectTrigger>

					<SelectContent>
						<SelectItem value="">All withdrawal statuses</SelectItem>

						<!-- Adjust values if your DB uses different status names -->
						<SelectItem value="pending">Pending</SelectItem>
						<SelectItem value="approved">Approved</SelectItem>
						<SelectItem value="processing">Processing</SelectItem>
						<SelectItem value="paid">Paid</SelectItem>
						<SelectItem value="rejected">Rejected</SelectItem>
						<SelectItem value="failed">Failed</SelectItem>
					</SelectContent>
				</Select>
			</div>
		{/snippet}
	</QueryBuilder>

	{#if data?.affiliates.length === 0}
		<div
			class="flex min-h-100 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center"
		>
			<div class="flex size-20 items-center justify-center rounded-full bg-muted">
				<CalendarDays class="size-10 text-muted-foreground" />
			</div>

			<h3 class="mt-6 text-xl font-semibold">No affiliates found</h3>

			<p class="mt-2 mb-8 max-w-sm text-muted-foreground">
				There are no affiliates for the selected filters.
			</p>
		</div>
	{:else}
		<div class="rounded-lg border bg-card p-4 shadow-sm">
			<FilterMenu
				bind:filteredList
				data={data?.affiliates}
				filterKeys={['activeCode', 'isCodeActive', 'lastBatchStatus', 'latestWithdrawalStatus']}
			/>

			<br />
			<Mobile affiliates={filteredList} />
			<DataTable
				data={filteredList}
				fileName={`Affiliates Created from ${data.query.start} - ${data.query.end}`}
				{columns}
			/>
		</div>
	{/if}
</div>

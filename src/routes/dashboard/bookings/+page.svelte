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

	let filteredList = $derived(data?.allData);

	type BookingQueryFilters = {
		bookingStatus: string;
		paymentStatus: string;
	};

	const initialCustomFilters: BookingQueryFilters = {
		bookingStatus: data.query.bookingStatus ?? '',
		paymentStatus: data.query.paymentStatus ?? ''
	};

	function updateUrl(payload: QueryFilterPayload<BookingQueryFilters>) {
		const params = new URLSearchParams(page.url.searchParams);

		setOrDelete(params, 'search', payload.search);

		if (payload.dateRange) {
			setOrDelete(params, 'start', payload.dateRange.start.toString());
			setOrDelete(params, 'end', payload.dateRange.end.toString());
		}

		setOrDelete(params, 'bookingStatus', payload.customFilters.bookingStatus);
		setOrDelete(params, 'paymentStatus', payload.customFilters.paymentStatus);

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
	<title>Bookings</title>
</svelte:head>

<hr class="border-border" />

<div class="space-y-6">
	<QueryBuilder
		title="Bookings Dataset"
		description="Load bookings by date range, status, payment status, customer, provider, or service"
		showDate
		showPageSize={false}
		initialSearch={data.query.search}
		initialStart={data.query.start}
		initialEnd={data.query.end}
		{initialCustomFilters}
		submitMode="manual"
		searchPlaceholder="Search customer, provider, service, address, or notes..."
		onQueryChange={updateUrl}
	>
		{#snippet children(filters, update)}
			<div class="flex flex-col gap-2">
				<Label class="text-sm font-medium">Booking Status</Label>

				<Select
					type="single"
					value={filters.bookingStatus}
					onValueChange={(value) => update('bookingStatus', value)}
				>
					<SelectTrigger class="w-full">
						{filters.bookingStatus || 'All booking statuses'}
					</SelectTrigger>

					<SelectContent>
						<SelectItem value="">All booking statuses</SelectItem>
						<SelectItem value="pending">Pending</SelectItem>
						<SelectItem value="confirmed">Confirmed</SelectItem>
						<SelectItem value="in_progress">In Progress</SelectItem>
						<SelectItem value="completed">Completed</SelectItem>
						<SelectItem value="canceled">Canceled</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div class="flex flex-col gap-2">
				<Label class="text-sm font-medium">Payment Status</Label>

				<Select
					type="single"
					value={filters.paymentStatus}
					onValueChange={(value) => update('paymentStatus', value)}
				>
					<SelectTrigger class="w-full">
						{filters.paymentStatus || 'All payment statuses'}
					</SelectTrigger>

					<SelectContent>
						<SelectItem value="">All payment statuses</SelectItem>
						<SelectItem value="pending">Pending</SelectItem>
						<SelectItem value="paid">Paid</SelectItem>
						<SelectItem value="failed">Failed</SelectItem>
						<SelectItem value="refunded">Refunded</SelectItem>
					</SelectContent>
				</Select>
			</div>
		{/snippet}
	</QueryBuilder>

	{#if data.allData.length === 0}
		<div
			class="flex min-h-100 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center"
		>
			<div class="flex size-20 items-center justify-center rounded-full bg-muted">
				<CalendarDays class="size-10 text-muted-foreground" />
			</div>

			<h3 class="mt-6 text-xl font-semibold">No bookings found</h3>

			<p class="mt-2 mb-8 max-w-sm text-muted-foreground">
				There are no booking records for the selected filters.
			</p>
		</div>
	{:else}
		<div class="rounded-lg border bg-card p-4 shadow-sm">
			<FilterMenu
				bind:filteredList
				data={data?.allData}
				filterKeys={[
					'customerName',
					'providerName',
					'serviceName',
					'scheduledStartTime',
					'scheduledEndTime',
					'bookingStatus',
					'paymentStatus',
					'totalPrice'
				]}
			/>

			<br />

			<Mobile bookings={filteredList} />

			<DataTable
				data={filteredList}
				fileName={`Bookings ${data.query.start} - ${data.query.end}`}
				{columns}
			/>
		</div>
	{/if}
</div>

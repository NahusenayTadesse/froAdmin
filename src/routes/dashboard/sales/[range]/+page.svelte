<script lang="ts">
	import { columns } from './columns';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import DateMonth from '$lib/formComponents/DateMonth.svelte';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';

	import { CalendarDays } from '@lucide/svelte';

	let { data } = $props();

	let filteredList = $derived(data?.affiliates);
</script>

<svelte:head>
	<title>Sales</title>
</svelte:head>

<div class="mx-auto flex w-full flex-col justify-start gap-8 lg:p-6">
	<div class="flex flex-col gap-4">
		<div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
			<div>
				<p class="mt-1 text-muted-foreground">
					Reviewing {data?.affiliates?.length ?? 0} Affiliatess
				</p>
			</div>

			<div class="flex items-center gap-2">
				<DateMonth start={data?.start} end={data?.end} link="/dashboard/sales" />
			</div>
		</div>
	</div>

	<hr class="border-border" />

	{#if data?.affiliates.length === 0}
		<div
			class="flex min-h-100 flex-col items-center justify-center rounded-xl border border-dashed bg-card p-12 text-center"
		>
			<div class="flex size-20 items-center justify-center rounded-full bg-muted">
				<CalendarDays class="size-10 text-muted-foreground" />
			</div>
			<h3 class="mt-6 text-xl font-semibold">No Afflaites found</h3>
			<p class="mt-2 mb-8 max-w-sm text-muted-foreground">
				There are no afflaites recorded for the selected date range. Try selecting a different
				period.
			</p>
			<DateMonth start={data?.start} end={data?.end} link="/dashboard/sales" />
		</div>
	{:else}
		<div class="rounded-lg border bg-card shadow-sm">
			<FilterMenu
				bind:filteredList
				data={data?.affiliates}
				filterKeys={['activeCode', 'isCodeActive', 'lastBatchStatus', 'latestWithdrawalStatus']}
			/>
			<br />
			<!-- <Mobile bookings={filteredList} /> -->
			<DataTable
				data={filteredList}
				fileName="Affiliates Created from  {data?.start} - {data?.end}"
				{columns}
			/>
		</div>
	{/if}
</div>

<script lang="ts">
	import { columns } from './columns';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import DateMonth from '$lib/formComponents/DateMonth.svelte';
	import { page } from '$app/state';
	import { Frown, ArrowLeft, CalendarDays } from '@lucide/svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Bookings | {data?.cust?.fullName ?? 'User'}</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-6xl flex-col justify-start gap-8 p-6">
	<div class="flex flex-col gap-4">
		<Button href="/dashboard/users/{page.params.id}" class="w-fit gap-2 ">
			<ArrowLeft class="size-4" />
			Back to {data?.cust?.fullName}
		</Button>

		<div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Booking History</h1>
				<p class="mt-1 text-muted-foreground">
					Reviewing {data.allTransactions?.length ?? 0} transactions for {data?.cust?.fullName}
				</p>
			</div>

			<div class="flex items-center gap-2">
				<DateMonth
					start={data?.start}
					end={data?.end}
					link="/dashboard/vendor/{page.params.id}/bookings"
				/>
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
			<h3 class="mt-6 text-xl font-semibold">No bookings found</h3>
			<p class="mt-2 mb-8 max-w-sm text-muted-foreground">
				There are no transactions recorded for the selected date range. Try selecting a different
				period.
			</p>
			<DateMonth
				start={data?.start}
				end={data?.end}
				link="/dashboard/vendor/{page.params.id}/bookings"
			/>
		</div>
	{:else}
		<div class="rounded-lg border bg-card shadow-sm">
			<DataTable
				data={data.allTransactions}
				fileName="Booking History - {data?.cust?.fullName}"
				{columns}
			/>
		</div>
	{/if}
</div>

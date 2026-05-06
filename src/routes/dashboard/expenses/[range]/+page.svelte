<script lang="ts">
	import { columns } from './columns';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import DateMonth from '$lib/formComponents/DateMonth.svelte';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';

	import { CalendarDays } from '@lucide/svelte';
	import Piechart from '$lib/components/piechart.svelte';

	let { data } = $props();

	let filteredList = $derived(data?.allTransactions);

	import type { ChartData } from 'chart.js';
	import Chart from '$lib/components/chart.svelte';

	const barData: ChartData = {
		labels: ['January', 'February', 'March', 'April', 'May', 'June'],
		datasets: [
			{
				label: 'Sales 2024',
				data: [65, 59, 80, 81, 56, 55],
				backgroundColor: 'rgba(54, 162, 235, 0.5)',
				borderColor: 'rgb(54, 162, 235)',
				borderWidth: 1
			},
			{
				label: 'Sales 2023',
				data: [45, 49, 70, 71, 46, 45],
				backgroundColor: 'rgba(255, 99, 132, 0.5)',
				borderColor: 'rgb(255, 99, 132)',
				borderWidth: 1
			}
		]
	};

	const barOptions = {
		scales: {
			y: {
				beginAtZero: true,
				title: {
					display: true,
					text: 'Sales (in thousands)'
				}
			},
			x: {
				title: {
					display: true,
					text: 'Months'
				}
			}
		}
	};
</script>

<svelte:head>
	<title>Expenses</title>
</svelte:head>

<div class="mx-auto flex w-full max-w-6xl flex-col justify-start gap-8 p-6">
	<div class="flex flex-col gap-4">
		<div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
			<div>
				<p class="mt-1 text-muted-foreground">
					Reviewing {data.allTransactions?.length ?? 0} expenses
				</p>
			</div>

			<div class="flex items-center gap-2">
				<DateMonth start={data?.start} end={data?.end} link="/dashboard/expenses" />
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
			<h3 class="mt-6 text-xl font-semibold">No expenses found</h3>
			<p class="mt-2 mb-8 max-w-sm text-muted-foreground">
				There are no expenses recorded for the selected date range. Try selecting a different
				period.
			</p>
			<DateMonth start={data?.start} end={data?.end} link="/dashboard/bookings" />
		</div>
	{:else}
		<div class="rounded-lg border bg-card shadow-sm">
			<FilterMenu
				bind:filteredList
				data={data?.allTransactions}
				filterKeys={['amount', 'expenseType', 'date', 'addedBy']}
			/>
			<DataTable data={filteredList} fileName="Bookings  {data?.start} - {data?.end}" {columns} />
		</div>
	{/if}
</div>

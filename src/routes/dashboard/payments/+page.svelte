<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import { renderComponent } from '$lib/components/ui/data-table/index.js';
	import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
	import { toCurrency } from '$lib/features/payments/metrics';

	let { data } = $props();
	const metrics = $derived(data.metrics);
	const sources = $derived(data.sources);

	const statCards = $derived([
		{ label: 'Ledger net movement', value: toCurrency(metrics.ledgerNetMovement), view: 'net_movements' },
		{ label: 'Ledger credited amount', value: toCurrency(metrics.ledgerCreditAvailable), view: 'credit_breakdown' },
		{ label: 'Ledger withdrawal debits', value: toCurrency(metrics.ledgerDebitWithdrawal), view: 'debit_breakdown' },
		{ label: 'Failed metrics (all)', value: String((metrics.stripePaymentFailures ?? 0) + (metrics.failedBookingPaymentCount ?? 0) + (metrics.withdrawalFailedCount ?? 0)), view: 'failed_metrics' },
		{ label: 'Wallet withdrawable balance', value: toCurrency(metrics.providerAvailableBalance), view: 'providers' },
		{ label: 'In escrow total', value: toCurrency(metrics.escrowTotalAmount ?? 0), view: 'escrow_accounts' },
		{ label: 'In escrow bookings', value: String(metrics.escrowBookingCount ?? 0), view: 'escrow_accounts' },
		{ label: 'Ledger hold balance', value: toCurrency(metrics.ledgerHoldBalance), view: 'hold_balance' },
		{ label: 'Ledger release hold total', value: toCurrency(metrics.ledgerReleaseHoldTotal), view: 'release_hold' },
		{ label: 'Net hold outstanding', value: toCurrency(metrics.ledgerHoldOutstanding ?? 0), view: 'hold_outstanding' },
		{ label: 'Withdrawal total amount', value: toCurrency(metrics.withdrawalTotalAmount), view: 'withdrawals' }
	]);

	const moneyKpiDetails = $derived([
		{ label: 'Gross money in', value: toCurrency(metrics.ledgerCreditAvailable), source: 'provider_ledger_entries (credit_available)' },
		{ label: 'Gross money out (withdrawals)', value: toCurrency(metrics.ledgerDebitWithdrawal), source: 'provider_ledger_entries (debit_withdrawal)' },
		{ label: 'Net movement', value: toCurrency(metrics.ledgerNetMovement), source: 'computed from ledger entries' },
		{ label: 'In escrow total', value: toCurrency(metrics.escrowTotalAmount ?? 0), source: 'bookings where payment_status = in_escrow' },
		{ label: 'In escrow bookings', value: String(metrics.escrowBookingCount ?? 0), source: 'count(bookings where payment_status = in_escrow)' },
		{ label: 'On-hold balance (dispute freeze)', value: toCurrency(metrics.ledgerHoldBalance), source: 'provider_ledger_entries (hold)' },
		{ label: 'Released from hold', value: toCurrency(metrics.ledgerReleaseHoldTotal), source: 'provider_ledger_entries (release_hold)' },
		{ label: 'Total payouts requested+paid', value: toCurrency(metrics.withdrawalTotalAmount), source: 'provider_withdrawals.amount' },
		{ label: 'Payment failures', value: String(metrics.stripePaymentFailures ?? 0), source: 'payment_events (payment_intent.payment_failed)' },
		{ label: 'Failed booking payments', value: String(metrics.failedBookingPaymentCount ?? 0), source: 'bookings where payment_status = failed' },
		{ label: 'Failed payout cases', value: String(metrics.withdrawalFailedCount ?? 0), source: 'provider_withdrawals where status = failed' },
		{ label: 'Refund events', value: String(metrics.stripeRefundEvents ?? 0), source: 'payment_events (charge.refunded)' },
		{ label: 'Dispute events', value: String(metrics.stripeDisputeEvents ?? 0), source: 'payment_events (charge.dispute.*)' }
	]);

	const kpiColumns = [
		{
			accessorKey: 'label',
			header: ({ column }: any) =>
				renderComponent(DataTableSort, { name: 'Metric', onclick: column.getToggleSortingHandler() })
		},
		{
			accessorKey: 'value',
			header: ({ column }: any) =>
				renderComponent(DataTableSort, { name: 'Value', onclick: column.getToggleSortingHandler() })
		},
		{
			accessorKey: 'source',
			header: ({ column }: any) =>
				renderComponent(DataTableSort, { name: 'Source', onclick: column.getToggleSortingHandler() })
		}
	];

	const tableClass = 'w-full min-w-full lg:w-full lg:min-w-full';

</script>

<svelte:head>
	<title>Payments Overview</title>
</svelte:head>

<div class="mx-auto flex w-full flex-col gap-6 p-6">
	<div class="flex flex-col gap-2">
		<h1 class="text-3xl font-bold tracking-tight">Payments Overview</h1>
		<div class="flex flex-wrap gap-2">
			<Badge variant={sources.ledger ? 'secondary' : 'destructive'}>Ledger: {sources.ledger ? 'connected' : 'missing'}</Badge>
			<Badge variant={sources.wallets ? 'secondary' : 'destructive'}>Wallets: {sources.wallets ? 'connected' : 'missing'}</Badge>
			<Badge variant={sources.withdrawals ? 'secondary' : 'destructive'}>Withdrawals: {sources.withdrawals ? 'connected' : 'missing'}</Badge>
			<Badge variant={sources.events ? 'secondary' : 'destructive'}>Events: {sources.events ? 'connected' : 'missing'}</Badge>
		</div>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		{#each statCards as stat}
			<a class="text-left" href="/dashboard/payments/metrics?view={stat.view}">
				<Card class="hover:border-primary/60 cursor-pointer transition-colors">
					<CardHeader class="pb-2"><CardTitle class="text-sm text-muted-foreground">{stat.label}</CardTitle></CardHeader>
					<CardContent><p class="text-2xl font-semibold">{stat.value}</p></CardContent>
				</Card>
			</a>
		{/each}
	</div>

	<Card>
		<CardHeader><CardTitle>Money KPIs and definitions</CardTitle></CardHeader>
		<CardContent>
			<DataTable data={moneyKpiDetails} columns={kpiColumns} fileName="Payments KPI Definitions" class={tableClass} />
		</CardContent>
	</Card>
</div>

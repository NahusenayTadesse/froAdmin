<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';
	import { renderComponent } from '$lib/components/ui/data-table/index.js';
	import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import { toCurrency } from '$lib/features/payments/metrics';

	let { data } = $props();
	const view = $derived((data as any).view ?? 'net_movements');
	const providerBalances = $derived((data as any).providerBalances ?? []);
	const providerTransactions = $derived((data as any).providerTransactions ?? []);
	const ledgerByType = $derived((data as any).ledgerByType ?? []);
	const eventsByType = $derived((data as any).eventsByType ?? []);
	const escrowBookings = $derived((data as any).escrowBookings ?? []);
	const failedBookingPayments = $derived((data as any).failedBookingPayments ?? []);
	const failedWithdrawals = $derived((data as any).failedWithdrawals ?? []);
	const failedPaymentEvents = $derived((data as any).failedPaymentEvents ?? []);
	const metrics = $derived((data as any).metrics ?? {});
	const failedSummaryCards = $derived([
		{ label: 'Failed payment events', value: String(metrics.stripePaymentFailures ?? 0), view: 'failed_events' },
		{ label: 'Failed booking payments', value: String(metrics.failedBookingPaymentCount ?? 0), view: 'failed_bookings' },
		{ label: 'Critical capture/auth failures', value: String(metrics.criticalPaymentFailureCount ?? 0), view: 'critical_failures' },
		{ label: 'Failed payout cases', value: String(metrics.withdrawalFailedCount ?? 0), view: 'failed_payouts' }
	]);

	const enrichedFailedEvents = $derived((failedPaymentEvents as any[]) ?? []);

	const creditByProvider = $derived.by(() => {
		const map = new Map<string, { providerName: string; amount: number }>();
		for (const t of providerTransactions) {
			if (t.entryType !== 'credit_available') continue;
			const prev = map.get(t.providerId) ?? { providerName: t.providerName, amount: 0 };
			prev.amount += Number(t.amount ?? 0);
			map.set(t.providerId, prev);
		}
		return Array.from(map.values());
	});

	const debitByProvider = $derived.by(() => {
		const map = new Map<string, { providerName: string; amount: number }>();
		for (const t of providerTransactions) {
			if (t.entryType !== 'debit_withdrawal') continue;
			const prev = map.get(t.providerId) ?? { providerName: t.providerName, amount: 0 };
			prev.amount += Math.abs(Number(t.amount ?? 0));
			map.set(t.providerId, prev);
		}
		return Array.from(map.values());
	});

	const holdOnlyTransactions = $derived(
		providerTransactions.filter((t: any) => t.entryType === 'hold')
	);

	const releaseHoldTransactions = $derived(
		providerTransactions.filter((t: any) => t.entryType === 'release_hold')
	);

	const simpleMetricColumns = [
		{
			accessorKey: 'metric',
			header: ({ column }: any) =>
				renderComponent(DataTableSort, { name: 'Metric', onclick: column.getToggleSortingHandler() })
		},
		{
			accessorKey: 'value',
			header: ({ column }: any) =>
				renderComponent(DataTableSort, { name: 'Value', onclick: column.getToggleSortingHandler() })
		}
	];

	const providerBalanceColumns = [
		{ accessorKey: 'providerName', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Provider', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'availableBalance', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Available', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => toCurrency(row.original.availableBalance) },
		{ accessorKey: 'pendingBalance', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Pending', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => toCurrency(row.original.pendingBalance) },
		{ accessorKey: 'onHoldBalance', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'On Hold', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => toCurrency(row.original.onHoldBalance) },
		{ accessorKey: 'totalWithdrawn', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Withdrawn', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => toCurrency(row.original.totalWithdrawn) }
	];

	const netMovementColumns = [
		{ accessorKey: 'createdAt', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Date', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => (row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : '-') },
		{ accessorKey: 'providerName', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Provider', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'bookingReferenceId', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Booking', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => row.original.bookingReferenceId || '-' },
		{ accessorKey: 'status', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Status', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'entryType', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Type', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'amount', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Amount', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => toCurrency(row.original.amount, row.original.currency?.toUpperCase?.() ?? 'USD') },
		{ accessorKey: 'bookingTotalPrice', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Booking Gross', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => toCurrency(row.original.bookingTotalPrice, row.original.currency?.toUpperCase?.() ?? 'USD') }
	];

	const escrowColumns = [
		{ accessorKey: 'updatedAt', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Updated', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => (row.original.updatedAt ? new Date(row.original.updatedAt).toLocaleString() : '-') },
		{ accessorKey: 'providerName', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Provider', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'bookingId', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Booking', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'amount', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Amount', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => toCurrency(row.original.amount) },
		{ accessorKey: 'paymentStatus', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Payment Status', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'bookingStatus', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Booking Status', onclick: column.getToggleSortingHandler() }) }
	];

	const providerOnlyColumns = [
		{ accessorKey: 'providerName', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Provider', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'amount', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Amount', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => toCurrency(row.original.amount) }
	];

	const ledgerByTypeColumns = [
		{ accessorKey: 'entryType', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Type', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'totalAmount', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Total', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => toCurrency(row.original.totalAmount) },
		{ accessorKey: 'txnCount', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Count', onclick: column.getToggleSortingHandler() }) }
	];

	const eventsByTypeColumns = [
		{ accessorKey: 'eventType', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Event', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'count', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Count', onclick: column.getToggleSortingHandler() }) }
	];

	const holdMovementColumns = [
		{ accessorKey: 'createdAt', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Date', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => (row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : '-') },
		{ accessorKey: 'providerName', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Provider', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'entryType', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Type', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'amount', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Amount', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => toCurrency(row.original.amount, row.original.currency?.toUpperCase?.() ?? 'USD') },
		{ accessorKey: 'bookingReferenceId', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Booking', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => row.original.bookingReferenceId || '-' }
	];

	const failedBookingColumns = [
		{ accessorKey: 'updatedAt', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Updated', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => (row.original.updatedAt ? new Date(row.original.updatedAt).toLocaleString() : '-') },
		{ accessorKey: 'paymentFailedAt', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Failed At', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => (row.original.paymentFailedAt ? new Date(row.original.paymentFailedAt).toLocaleString() : '-') },
		{ accessorKey: 'providerName', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Provider', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'bookingId', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Booking', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'amount', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Amount', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => toCurrency(row.original.amount) },
		{ accessorKey: 'paymentFailureCode', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Failure Code', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'paymentFailureMessage', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Failure Message', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'paymentStatus', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Payment Status', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'bookingStatus', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Booking Status', onclick: column.getToggleSortingHandler() }) }
	];

	const criticalFailedBookings = $derived(
		failedBookingPayments.filter((b: any) =>
			['authorization_expired', 'amount_mismatch', 'insufficient_funds', 'payment_capture_failed'].includes(
				String(b.paymentFailureCode ?? '').toLowerCase()
			)
		)
	);

	const failedWithdrawalColumns = [
		{ accessorKey: 'requestedAt', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Requested', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => (row.original.requestedAt ? new Date(row.original.requestedAt).toLocaleString() : '-') },
		{ accessorKey: 'processedAt', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Processed', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => (row.original.processedAt ? new Date(row.original.processedAt).toLocaleString() : '-') },
		{ accessorKey: 'providerName', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Provider', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'amount', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Amount', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => toCurrency(row.original.amount, row.original.currency?.toUpperCase?.() ?? 'USD') },
		{ accessorKey: 'failureReason', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Failure Reason', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'status', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Status', onclick: column.getToggleSortingHandler() }) }
	];

	const failedEventColumns = [
		{ accessorKey: 'createdAt', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Created', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => (row.original.createdAt ? new Date(row.original.createdAt).toLocaleString() : '-') },
		{ accessorKey: 'providerName', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Provider', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'amount', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Amount', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => (row.original.amount === null || row.original.amount === undefined ? '-' : toCurrency(Number(row.original.amount))) },
		{ accessorKey: 'eventSource', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Source', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'eventType', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Event Type', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'stripeEventId', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Stripe Event ID', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'stripeObjectId', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Stripe Object ID', onclick: column.getToggleSortingHandler() }) }
	];

	const combinedFailedCases = $derived.by(() => {
		const bookingCases = failedBookingPayments.map((b: any) => ({
			caseType: 'booking_payment_failed',
			occurredAt: b.updatedAt,
			providerName: b.providerName,
			referenceId: b.bookingId,
			amount: b.amount,
			status: b.paymentStatus,
			details: `Booking status: ${b.bookingStatus}`
		}));

		const payoutCases = failedWithdrawals.map((w: any) => ({
			caseType: 'payout_failed',
			occurredAt: w.requestedAt,
			providerName: w.providerName,
			referenceId: w.id,
			amount: w.amount,
			status: w.status,
			details: w.failureReason || 'No failure reason provided'
		}));

		const eventCases = enrichedFailedEvents.map((e: any) => ({
			caseType: 'payment_event_failed',
			occurredAt: e.createdAt,
			providerName: e.providerName ?? '-',
			referenceId: e.stripeEventId || e.id,
			amount: e.amount ?? null,
			status: e.eventType,
			details: `${e.eventSource || 'unknown'} / ${e.stripeObjectId || 'no object id'}`
		}));

		return [...bookingCases, ...payoutCases, ...eventCases].sort((a, b) => {
			const da = a.occurredAt ? new Date(a.occurredAt).getTime() : 0;
			const db = b.occurredAt ? new Date(b.occurredAt).getTime() : 0;
			return db - da;
		});
	});

	const combinedFailedCaseColumns = [
		{ accessorKey: 'occurredAt', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Occurred', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => (row.original.occurredAt ? new Date(row.original.occurredAt).toLocaleString() : '-') },
		{ accessorKey: 'caseType', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Case Type', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'providerName', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Provider', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'referenceId', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Reference', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'amount', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Amount', onclick: column.getToggleSortingHandler() }), cell: ({ row }: any) => (row.original.amount === null || row.original.amount === undefined ? '-' : toCurrency(Number(row.original.amount))) },
		{ accessorKey: 'status', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Status', onclick: column.getToggleSortingHandler() }) },
		{ accessorKey: 'details', header: ({ column }: any) => renderComponent(DataTableSort, { name: 'Details', onclick: column.getToggleSortingHandler() }) }
	];

	let filteredProviderBalances = $state<any[]>([]);
	let filteredCreditByProvider = $state<any[]>([]);
	let filteredDebitByProvider = $state<any[]>([]);
	let filteredEscrowBookings = $state<any[]>([]);
	let filteredHoldTransactions = $state<any[]>([]);
	let filteredReleaseHoldTransactions = $state<any[]>([]);
	let filteredProviderTransactions = $state<any[]>([]);
	let filteredLedgerByType = $state<any[]>([]);
	let filteredEventsByType = $state<any[]>([]);
	let filteredFailedBookings = $state<any[]>([]);
	let filteredFailedWithdrawals = $state<any[]>([]);
	let filteredFailedEvents = $state<any[]>([]);

	$effect(() => {
		filteredProviderBalances = providerBalances;
		filteredCreditByProvider = creditByProvider;
		filteredDebitByProvider = debitByProvider;
		filteredEscrowBookings = escrowBookings;
		filteredHoldTransactions = holdOnlyTransactions;
		filteredReleaseHoldTransactions = releaseHoldTransactions;
		filteredProviderTransactions = providerTransactions;
		filteredLedgerByType = ledgerByType;
		filteredEventsByType = eventsByType;
		filteredFailedBookings = failedBookingPayments;
		filteredFailedWithdrawals = failedWithdrawals;
		filteredFailedEvents = enrichedFailedEvents;
	});

	const withFallback = <T,>(source: T[], filtered: T[]) =>
		filtered.length === 0 && source.length > 0 ? source : filtered;

	const shownProviderBalances = $derived(withFallback(providerBalances, filteredProviderBalances));
	const shownCreditByProvider = $derived(withFallback(creditByProvider, filteredCreditByProvider));
	const shownDebitByProvider = $derived(withFallback(debitByProvider, filteredDebitByProvider));
	const shownEscrowBookings = $derived(withFallback(escrowBookings, filteredEscrowBookings));
	const shownHoldTransactions = $derived(withFallback(holdOnlyTransactions, filteredHoldTransactions));
	const shownReleaseHoldTransactions = $derived(withFallback(releaseHoldTransactions, filteredReleaseHoldTransactions));
	const shownProviderTransactions = $derived(withFallback(providerTransactions, filteredProviderTransactions));
	const shownLedgerByType = $derived(withFallback(ledgerByType, filteredLedgerByType));
	const shownEventsByType = $derived(withFallback(eventsByType, filteredEventsByType));
	const shownFailedBookings = $derived(withFallback(failedBookingPayments, filteredFailedBookings));
	const shownFailedWithdrawals = $derived(withFallback(failedWithdrawals, filteredFailedWithdrawals));
	const shownFailedEvents = $derived(withFallback(enrichedFailedEvents, filteredFailedEvents));

	const tableClass = 'w-full min-w-full lg:w-full lg:min-w-full';
</script>

<div class="mx-auto flex w-full flex-col gap-6 p-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Payment Metrics Detail</h1>
		<a href="/dashboard/payments" class="text-primary underline">Back to overview</a>
	</div>

	{#if view === 'providers'}
		<Card><CardHeader><CardTitle>Provider wallet balances</CardTitle></CardHeader><CardContent><FilterMenu data={providerBalances} bind:filteredList={filteredProviderBalances} filterKeys={['providerName']} /><DataTable data={shownProviderBalances} columns={providerBalanceColumns} fileName="Provider Wallet Balances" class={tableClass} /></CardContent></Card>
	{:else if view === 'credit_breakdown'}
		<Card><CardHeader><CardTitle>Credit available by provider</CardTitle></CardHeader><CardContent><FilterMenu data={creditByProvider} bind:filteredList={filteredCreditByProvider} filterKeys={['providerName']} /><DataTable data={shownCreditByProvider} columns={providerOnlyColumns} fileName="Credit Available by Provider" class={tableClass} /></CardContent></Card>
	{:else if view === 'debit_breakdown'}
		<Card><CardHeader><CardTitle>Withdrawal debits by provider</CardTitle></CardHeader><CardContent><FilterMenu data={debitByProvider} bind:filteredList={filteredDebitByProvider} filterKeys={['providerName']} /><DataTable data={shownDebitByProvider} columns={providerOnlyColumns} fileName="Withdrawal Debits by Provider" class={tableClass} /></CardContent></Card>
	{:else if view === 'withdrawals'}
		<Card><CardHeader><CardTitle>Withdrawal metrics</CardTitle></CardHeader><CardContent><DataTable data={[{ metric: 'Total withdrawal amount', value: toCurrency(metrics.withdrawalTotalAmount) }, { metric: 'Requested', value: String(metrics.withdrawalRequestedCount) }, { metric: 'Processing', value: String(metrics.withdrawalProcessingCount) }, { metric: 'Paid', value: String(metrics.withdrawalPaidCount) }, { metric: 'Failed', value: String(metrics.withdrawalFailedCount) }]} columns={simpleMetricColumns} fileName="Withdrawal Metrics" class={tableClass} /></CardContent></Card>
	{:else if view === 'escrow_accounts'}
		<Card><CardHeader><CardTitle>Escrow accounts (payment_status = in_escrow)</CardTitle></CardHeader><CardContent><FilterMenu data={escrowBookings} bind:filteredList={filteredEscrowBookings} filterKeys={['providerName', 'paymentStatus', 'bookingStatus']} /><DataTable data={shownEscrowBookings} columns={escrowColumns} fileName="Escrow Accounts" class={tableClass} /></CardContent></Card>
	{:else if view === 'hold_balance'}
		<Card><CardHeader><CardTitle>Hold account movements only</CardTitle></CardHeader><CardContent><FilterMenu data={holdOnlyTransactions} bind:filteredList={filteredHoldTransactions} filterKeys={['providerName', 'entryType']} /><DataTable data={shownHoldTransactions} columns={holdMovementColumns} fileName="Hold Movements" class={tableClass} /></CardContent></Card>
	{:else if view === 'release_hold'}
		<Card><CardHeader><CardTitle>Release-hold account movements only</CardTitle></CardHeader><CardContent><FilterMenu data={releaseHoldTransactions} bind:filteredList={filteredReleaseHoldTransactions} filterKeys={['providerName', 'entryType']} /><DataTable data={shownReleaseHoldTransactions} columns={holdMovementColumns} fileName="Release Hold Movements" class={tableClass} /></CardContent></Card>
	{:else if view === 'hold_outstanding'}
		<Card><CardHeader><CardTitle>Hold outstanding (summary)</CardTitle></CardHeader><CardContent><DataTable data={[{ metric: 'Cumulative hold posted', value: toCurrency(metrics.ledgerHoldBalance) }, { metric: 'Cumulative released from hold', value: toCurrency(metrics.ledgerReleaseHoldTotal) }, { metric: 'Net hold outstanding', value: toCurrency(metrics.ledgerHoldOutstanding ?? 0) }, { metric: 'Current on-hold snapshot (wallets)', value: toCurrency(metrics.providerOnHoldBalance ?? 0) }]} columns={simpleMetricColumns} fileName="Hold Outstanding" class={tableClass} /></CardContent></Card>
	{:else if view === 'failed_bookings'}
		<Card><CardHeader><CardTitle>Failed booking payment cases</CardTitle></CardHeader><CardContent><FilterMenu data={failedBookingPayments} bind:filteredList={filteredFailedBookings} filterKeys={['providerName', 'bookingStatus']} /><DataTable data={shownFailedBookings} columns={failedBookingColumns} fileName="Failed Booking Payments" class={tableClass} /></CardContent></Card>
	{:else if view === 'critical_failures'}
		<Card><CardHeader><CardTitle>Critical capture/auth failures</CardTitle></CardHeader><CardContent><FilterMenu data={criticalFailedBookings} bind:filteredList={filteredFailedBookings} filterKeys={['providerName', 'paymentFailureCode', 'bookingStatus']} /><DataTable data={withFallback(criticalFailedBookings, filteredFailedBookings)} columns={failedBookingColumns} fileName="Critical Capture Auth Failures" class={tableClass} /></CardContent></Card>
	{:else if view === 'failed_payouts'}
		<Card><CardHeader><CardTitle>Failed payout cases</CardTitle></CardHeader><CardContent><FilterMenu data={failedWithdrawals} bind:filteredList={filteredFailedWithdrawals} filterKeys={['providerName', 'failureReason', 'status']} /><DataTable data={shownFailedWithdrawals} columns={failedWithdrawalColumns} fileName="Failed Payout Cases" class={tableClass} /></CardContent></Card>
	{:else if view === 'failed_events'}
		<Card><CardHeader><CardTitle>Failed payment events</CardTitle></CardHeader><CardContent><FilterMenu data={enrichedFailedEvents} bind:filteredList={filteredFailedEvents} filterKeys={['eventSource', 'eventType', 'providerName']} /><DataTable data={shownFailedEvents} columns={failedEventColumns} fileName="Failed Payment Events" class={tableClass} /></CardContent></Card>
	{:else if view === 'failed_metrics'}
		<Card><CardHeader><CardTitle>Failed metrics</CardTitle></CardHeader><CardContent><div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{#each failedSummaryCards as stat}<a class="text-left" href="/dashboard/payments/metrics?view={stat.view}"><Card class="hover:border-primary/60 cursor-pointer transition-colors"><CardHeader class="pb-2"><CardTitle class="text-sm text-muted-foreground">{stat.label}</CardTitle></CardHeader><CardContent><p class="text-2xl font-semibold">{stat.value}</p></CardContent></Card></a>{/each}</div><div class="mt-4"><DataTable data={combinedFailedCases} columns={combinedFailedCaseColumns} fileName="All Failed Cases" class={tableClass} /></div></CardContent></Card>
	{:else}
		<Card><CardHeader><CardTitle>Net movements (money ledger)</CardTitle></CardHeader><CardContent><FilterMenu data={providerTransactions} bind:filteredList={filteredProviderTransactions} filterKeys={['providerName', 'status', 'entryType']} /><DataTable data={shownProviderTransactions} columns={netMovementColumns} fileName="Net Money Movements" class={tableClass} /></CardContent></Card>

		<Card><CardHeader><CardTitle>Ledger and event support data</CardTitle></CardHeader><CardContent><div class="grid gap-4 lg:grid-cols-2"><div class="rounded-md border p-3"><h3 class="mb-2 text-sm font-semibold">Ledger by type</h3><FilterMenu data={ledgerByType} bind:filteredList={filteredLedgerByType} filterKeys={['entryType']} /><DataTable data={shownLedgerByType} columns={ledgerByTypeColumns} fileName="Ledger by Type" class={tableClass} /></div><div class="rounded-md border p-3"><h3 class="mb-2 text-sm font-semibold">Payment events by type</h3><FilterMenu data={eventsByType} bind:filteredList={filteredEventsByType} filterKeys={['eventType']} /><DataTable data={shownEventsByType} columns={eventsByTypeColumns} fileName="Payment Events by Type" class={tableClass} /></div></div></CardContent></Card>
	{/if}
</div>

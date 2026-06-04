<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { edit as editSchema } from './schema';

	import { columns } from './columns.js';

	let { data } = $props();

	import SingleTable from '$lib/components/SingleTable.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { superForm } from 'sveltekit-superforms/client';

	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import { ArrowLeft, CalendarClock, Pencil, Save } from '@lucide/svelte';
	import type { Snapshot } from '@sveltejs/kit';

	import Delete from '$lib/forms/Delete.svelte';
	import SingleView from '$lib/components/SingleView.svelte';
	import Errors from '$lib/formComponents/Errors.svelte';
	import InputComp from '$lib/formComponents/InputComp.svelte';

	import DataTable from '$lib/components/Table/data-table.svelte';

	const formatTimestamp = (date: Date | string | number, locale: string = 'en-US'): string => {
		const d = new Date(date);

		// Check for invalid dates
		if (isNaN(d.getTime())) {
			return 'Invalid Date';
		}

		return new Intl.DateTimeFormat(locale, {
			year: 'numeric',
			month: 'short',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		}).format(d);
	};
	// import { columns } from './columns.js';
	let affiliate = $derived(data?.affiliate);

	// Formatted array for summary lists, sidebars, or metadata tables
	const singleTable = $derived([
		{
			name: 'Affiliate Code',
			value: affiliate?.activeCode || '—'
		},
		{
			name: 'Code Status',
			value: affiliate?.isCodeActive ? 'Active' : 'Inactive'
		},
		{
			name: 'Lifetime Gross Earnings',
			value: affiliate?.lifetimeGrossEarned ? `$${affiliate.lifetimeGrossEarned}` : '$0.00'
		},
		{
			name: 'Total Paid Out',
			value: affiliate?.lifetimePaidOut ? `$${affiliate.lifetimePaidOut}` : '$0.00'
		},
		{
			name: 'Available (Payable)',
			value: affiliate?.payableAmount ? `$${affiliate.payableAmount}` : '$0.00'
		},
		{
			name: 'Escrow Hold Balance',
			value: affiliate?.pendingHoldAmount ? `$${affiliate.pendingHoldAmount}` : '$0.00'
		},
		{
			name: 'Total Conversions Count',
			value: affiliate?.totalReferralEventsCount ?? 0
		},
		{
			name: 'Unique Referred Customers',
			value: affiliate?.uniqueReferredUsersCount ?? 0
		},
		{
			name: 'Last Batch Payout Net',
			value: affiliate?.lastBatchNet ? `$${affiliate.lastBatchNet}` : 'No recent automated batches'
		},
		{
			name: 'Last Batch Status',
			value: affiliate?.lastBatchStatus
				? affiliate.lastBatchStatus.charAt(0).toUpperCase() + affiliate.lastBatchStatus.slice(1)
				: '—'
		},
		{
			name: 'Recent Withdrawal Status',
			value: affiliate?.latestWithdrawalStatus
				? affiliate.latestWithdrawalStatus.charAt(0).toUpperCase() +
					affiliate.latestWithdrawalStatus.slice(1)
				: 'No recent manual requests'
		},
		{
			name: 'Recent Withdrawal Amount',
			value: affiliate?.latestWithdrawalAmount ? `$${affiliate.latestWithdrawalAmount}` : '—'
		},
		{
			name: 'Recent Withdrawal Action Date',
			value: affiliate?.latestWithdrawalDate ? formatDate(affiliate.latestWithdrawalDate) : '—'
		},
		{
			name: 'Withdrawal Notes / Failures',
			value: affiliate?.latestWithdrawalFailure || 'None'
		}
	]);

	const { form, errors, enhance, delayed, capture, restore, allErrors, message } = superForm(
		data.form,
		{
			resetForm: false
		}
	);

	import { toast } from 'svelte-sonner';
	import { formatDate } from '$lib/global.svelte.js';
	import { page } from '$app/state';
	$effect(() => {
		if ($message) {
			if ($message.type === 'error') {
				toast.error($message.text);
			} else {
				toast.success($message.text);
			}
		}
	});

	export const snapshot: Snapshot = { capture, restore };

	//   let date = $derived(dateProxy(editForm, 'appointmentDate', { format: 'date'}));

	let edit = $state(false);

	$form.code = affiliate?.activeCode;
	$form.isCodeActive = affiliate?.isCodeActive;
	$form.customCommissionBps = affiliate?.customCommissionBps;
	$form.manualAdjustmentAmount = affiliate?.manualAdjustmentAmount;
	$form.adminNotes = affiliate?.adminNotes;
</script>

<svelte:head>
	<title>Affiliate Configuration</title>
</svelte:head>

<SingleView title="Affiliate Management" class="w-full!">
	<div class="mt-4 flex w-full flex-row items-start justify-start gap-2 pl-4">
		<Button onclick={() => (edit = !edit)}>
			{#if !edit}
				<Pencil class="h-4 w-4" />
				Edit Affiliate Profile
			{:else}
				<ArrowLeft class="h-4 w-4" />
				Back to Overview
			{/if}
		</Button>
	</div>

	{#if edit === false}
		<div class="w-full p-4">
			<SingleTable {singleTable} />
		</div>
	{/if}

	{#if edit}
		<div class="w-full p-4">
			<form
				action="?/edit"
				use:enhance
				class="flex flex-col gap-4"
				id="edit-affiliate"
				method="post"
			>
				<Errors allErrors={$allErrors} />

				<div class="border-b border-gray-200 pb-6">
					<h2 class="mb-4 text-xl font-semibold text-gray-800">Status & Code Options</h2>
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<InputComp
							label="Affiliate Tracking Code"
							{form}
							{errors}
							name="code"
							type="text"
							required
							placeholder="e.g. PARTNER2026"
						/>

						<InputComp
							label="Account Access Status"
							{form}
							type="select"
							{errors}
							name="isActive"
							items={[
								{ value: true, name: 'Active (Allow tracking and credits)' },
								{ value: false, name: 'Suspended (Block code applications)' }
							]}
						/>
					</div>
				</div>

				<div class="border-b border-gray-200 py-6">
					<h2 class="mb-4 text-xl font-semibold text-gray-800">
						Ledger Controls (Manual Correction)
					</h2>
					<p class="mb-4 max-w-xl text-xs text-slate-500">
						Modify raw payout calculation settings or apply manual accounting corrections to this
						specific partner node.
					</p>
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<InputComp
							label="Default Custom Commission Basis Points (BPS)"
							{form}
							{errors}
							name="customCommissionBps"
							type="number"
							placeholder="e.g. 1000 for 10%"
						/>
						<InputComp
							label="Manual Balance Adjustment Credit ($)"
							{form}
							{errors}
							name="manualAdjustmentAmount"
							type="number"
							placeholder="0.00"
						/>
					</div>
				</div>

				<div class="py-6">
					<h2 class="mb-4 text-xl font-semibold text-gray-800">Administrative Auditing Metadata</h2>
					<div class="grid grid-cols-1 gap-6">
						<div class="md:col-span-2">
							<InputComp
								label="Internal Administrative Moderation Notes"
								{form}
								{errors}
								name="adminNotes"
								type="textarea"
								placeholder="Document special commission terms, custom deal agreements, or reason for forced suspension..."
							/>
						</div>
					</div>
				</div>

				<Button form="edit-affiliate" type="submit" class="mt-4">
					{#if $delayed}
						<LoadingBtn name="Updating Profile" />
					{:else}
						<Save class="h-4 w-4" />
						Save Affiliate Overrides
					{/if}
				</Button>
			</form>
		</div>
	{/if}
</SingleView>

<br />

<div
	class="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"
>
	<div class="flex flex-col gap-1">
		<h2 class="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
			Historical Commission Logs
		</h2>
		<p class="text-sm text-slate-500 dark:text-slate-400">
			Chronological look back at transaction logs, batch statements, and pending actions recorded
			under this profile.
		</p>
	</div>

	<div class="rounded-md border border-slate-100 dark:border-slate-800">
		{#if data?.affiliates?.length}
			<DataTable data={data.affiliates} {columns} fileName="Affiliate Registry" />
		{:else}
			<div class="flex h-32 items-center justify-center text-sm text-slate-500">
				No conversion ledger events found on record for this user profile.
			</div>
		{/if}
	</div>
</div>

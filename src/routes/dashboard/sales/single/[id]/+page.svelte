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
	import { ArrowLeft, BanknoteArrowUp, Link, Pencil, Save } from '@lucide/svelte';
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
	let salesPerson = $derived(data?.salesPerson);

	// Formatted array for summary lists, sidebars, or metadata tables
	const singleTable = $derived([
		{
			name: 'Name',
			value: salesPerson?.name || '—'
		},
		{
			name: 'Email',
			value: salesPerson?.email || '—'
		},

		{
			name: 'Status',
			value: salesPerson?.status || '—'
		},
		{
			name: 'Sales Code',
			value: salesPerson?.salesCode || '—'
		},
		{
			name: 'Code Status',
			value: salesPerson?.codeIsActive ? 'Active' : 'Inactive'
		},
		{
			name: 'Can View Affiliate',
			value: salesPerson?.canAlsoViewAffiliate ? 'Yes' : 'No'
		},
		{
			name: 'Current Tier',
			value: salesPerson?.tierName || '—'
		},
		{
			name: 'Rate Per Signup',
			value: salesPerson?.tierRatePerUser ? `$${salesPerson.tierRatePerUser}` : '—'
		},
		{
			name: 'Bonus Threshold',
			value: salesPerson?.tierBonusThreshold ? `${salesPerson.tierBonusThreshold} signups` : '—'
		},
		{
			name: 'Bonus Amount',
			value: salesPerson?.tierBonusAmount ? `$${salesPerson.tierBonusAmount}` : '—'
		},
		{
			name: 'Total Signups',
			value: salesPerson?.totalSignups ?? '—'
		},
		{
			name: 'Total Earnings',
			value: salesPerson?.totalEarnings ? `$${salesPerson.totalEarnings}` : '—'
		},
		{
			name: 'Pending Earnings',
			value: salesPerson?.pendingEarnings ? `$${salesPerson.pendingEarnings}` : '—'
		},
		{
			name: 'Available Balance',
			value: salesPerson?.availableBalance ? `$${salesPerson.availableBalance}` : '—'
		},
		{
			name: 'Member Since',
			value: salesPerson?.createdAt ? new Date(salesPerson.createdAt).toLocaleDateString() : '—'
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
</script>

<svelte:head>
	<title>Sales Person Configuration</title>
</svelte:head>

<SingleView title="Sales Person" class="w-full!">
	<div class="mt-4 flex w-full flex-row items-start justify-start gap-2 pl-4">
		<Button onclick={() => (edit = !edit)}>
			{#if !edit}
				<Pencil class="h-4 w-4" />
				Edit
			{:else}
				<ArrowLeft class="h-4 w-4" />
				Back
			{/if}
		</Button>
		<Button href="/dashboard/sales/single/{page.params.id}/earnings">
			<BanknoteArrowUp /> Earnings</Button
		>
		<Button href="/dashboard/sales/single/{page.params.id}/referrals">
			<Link /> Referrals</Button
		>
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

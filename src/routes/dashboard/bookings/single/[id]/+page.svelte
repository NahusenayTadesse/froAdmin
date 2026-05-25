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
	const singleTable = $derived([
		{
			name: 'Provider ',
			value: data?.booking?.providerName
		},
		{ name: 'Customer Name ', value: data?.booking?.customerName },
		{ name: 'Service Name', value: data?.booking?.serviceName },

		{ name: 'Address', value: '$ ' + data?.booking?.address },
		{ name: 'Notes from Customer', value: data?.booking?.notesFromCustomer },

		{ name: 'Booking Status', value: data?.booking?.bookingStatus },
		{ name: 'Payment Status', value: data?.booking?.paymentStatus },
		{ name: 'Total Price', value: data?.booking?.totalPrice },
		{
			name: 'Scheduled Date',
			value: data?.booking?.scheduledDate
				? formatTimestamp(data?.booking?.scheduledDate)
				: 'Not Scheduled'
		},
		{
			name: 'Started At',
			value: data?.booking?.startedAt ? formatTimestamp(data?.booking?.startedAt) : 'Not Started'
		},
		{
			name: 'Arrived At',
			value: data?.booking?.arrivedAt ? formatTimestamp(data?.booking?.arrivedAt) : 'Not Arrived'
		},
		{
			name: 'Service Started At',
			value: data?.booking?.serviceStartedAt
				? formatTimestamp(data?.booking?.serviceStartedAt)
				: 'Not Started'
		},
		{
			name: 'Auto Completed At',
			value: data?.booking?.autoCompletedAt
				? formatTimestamp(data?.booking?.autoCompletedAt)
				: 'Not Marked Done'
		},
		{
			name: 'Provider Marked Done ',
			value: data?.booking?.providerMarkedDoneAt
				? formatTimestamp(data?.booking?.providerMarkedDoneAt)
				: 'Not Marked Done'
		},
		{
			name: 'Completed At',
			value: data?.booking?.completedAt
				? formatDate(new Date(data?.booking?.completedAt))
				: 'Not Completed'
		},
		{
			name: 'Cancelled At',
			value: data?.booking?.cancelledAt
				? formatDate(new Date(data?.booking?.canceledAt))
				: 'Not Cancelled'
		},
		{ name: 'Created At', value: formatDate(new Date(data?.booking?.createdAt)) },
		{ name: 'Updated At', value: formatDate(new Date(data?.booking?.updatedAt)) },
		{ name: 'Latitude', value: data?.booking?.latitude },
		{ name: 'Longitude', value: data?.booking?.longitude }
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
	<title>Service Details</title>
</svelte:head>
<SingleView title="Booking Details" class="w-full!">
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
	</div>
	{#if edit === false}
		<div class="w-full p-4">
			<SingleTable {singleTable} />
		</div>
	{/if}
	{#if edit}
		<div class="w-full p-4">
			<form action="?/edit" use:enhance class="flex flex-col gap-4" id="edit" method="post">
				<Errors allErrors={$allErrors} />
				<div class="border-b border-gray-200 pb-6">
					<h2 class="mb-4 text-xl font-semibold text-gray-800">Booking Details</h2>
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<InputComp
							label="Scheduled Date"
							{form}
							{errors}
							name="scheduledDate"
							type="date"
							required
						/>
						<InputComp
							label="Scheduled Start Time"
							{form}
							{errors}
							name="scheduledStartTime"
							type="time"
							required
						/>
						<InputComp
							label="Scheduled End Time"
							{form}
							{errors}
							name="scheduledEndTime"
							type="time"
							required
						/>

						<div class="md:col-span-2">
							<InputComp
								label="Address"
								{form}
								{errors}
								name="address"
								type="text"
								placeholder="e.g. 123 Main St, Anytown, USA"
							/>
						</div>

						<div class="md:col-span-2">
							<InputComp
								label="Notes from Customer"
								{form}
								{errors}
								name="notesFromCustomer"
								type="textarea"
								placeholder="Detailed service breakdown..."
							/>
						</div>
					</div>
				</div>

				<div class="border-b border-gray-200 py-6">
					<h2 class="mb-4 text-xl font-semibold text-gray-800">Status & Pricing</h2>
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<InputComp
							label="Booking Status"
							{form}
							type="select"
							{errors}
							name="bookingStatus"
							items={[
								{ value: 'pending', label: 'Pending' },
								{ value: 'confirmed', label: 'Confirmed' },
								{ value: 'ongoing', label: 'Ongoing' },
								{ value: 'completed', label: 'Completed' },
								{ value: 'canceled', label: 'Canceled' }
							]}
						/>
						<InputComp
							label="Payment Status"
							{form}
							type="select"
							{errors}
							name="paymentStatus"
							items={[
								{ value: 'pending', label: 'Pending' },
								{ value: 'paid', label: 'Paid' },
								{ value: 'refunded', label: 'Refunded' },
								{ value: 'failed', label: 'Failed' }
							]}
						/>
						<InputComp
							label="Total Price ($)"
							{form}
							{errors}
							name="totalPrice"
							type="number"
							required
						/>
					</div>
				</div>

				<div class="py-6">
					<h2 class="mb-4 text-xl font-semibold text-gray-800">Overrides & Cancellation</h2>
					<div class="grid grid-cols-1 gap-6">
						<InputComp
							label="Cancellation Reason"
							{form}
							{errors}
							name="cancellationReason"
							type="textarea"
							placeholder="Reason for manual cancellation..."
						/>

						<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
							<InputComp label="Manual Arrival Time" {form} {errors} name="arrivedAt" type="date" />
							<InputComp
								label="Manual Start Time"
								{form}
								{errors}
								name="serviceStartedAt"
								type="date"
							/>
							<InputComp
								label="Manual Completion Time"
								{form}
								{errors}
								name="completedAt"
								type="date"
							/>
						</div>
					</div>
				</div>

				<!-- <input type="hidden" name="version" bind:value={$form.version} /> -->

				<Button form="edit" type="submit" class="mt-4">
					{#if $delayed}
						<LoadingBtn name="Saving Changes" />
					{:else}
						<Save class="h-4 w-4" />
						Save Changes
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
			Transaction History
		</h2>
		<p class="text-sm text-slate-500 dark:text-slate-400">
			View and manage the wallet transactions for this booking.
		</p>
	</div>

	<div class="rounded-md border border-slate-100 dark:border-slate-800">
		{#if data?.bookingWallets.length}
			<DataTable data={data.bookingWallets} {columns} fileName="Booking Wallets" />
		{:else}
			<div class="flex h-32 items-center justify-center text-sm text-slate-500">
				No transactions found for this booking.
			</div>
		{/if}
	</div>
</div>

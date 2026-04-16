<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { edit as editSchema } from './schema';

	let { data } = $props();

	import SingleTable from '$lib/components/SingleTable.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { superForm } from 'sveltekit-superforms/client';

	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import { ArrowLeft, Pencil, Save } from '@lucide/svelte';
	import SelectComp from '$lib/formComponents/SelectComp.svelte';
	import type { Snapshot } from '@sveltejs/kit';

	import Delete from '$lib/forms/Delete.svelte';
	import SingleView from '$lib/components/SingleView.svelte';
	import Errors from '$lib/formComponents/Errors.svelte';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import Ban from '$lib/forms/Ban.svelte';
	import UnBan from '$lib/forms/UnBan.svelte';
	import DataTable from '$lib/components/Table/data-table.svelte';
	// import { columns } from './columns.js';
	const singleTable = $derived([
		{
			name: 'Provider ',
			value: data?.singleService?.providerName + ' ' + data?.singleService?.providerLastName
		},
		{ name: 'Category ', value: data?.singleService?.categoryName },
		{ name: 'Title', value: data?.singleService?.title },
		{ name: 'Short Description', value: data?.singleService?.shortDescription },
		{ name: 'Full Description', value: data?.singleService?.fullDescription },
		// { name: 'Cover Image URL', value: data?.singleService?.coverImageUrl },
		// { name: 'Gallery Images', value: data?.singleService?.galleryImageUrls?.join(', ') },
		{ name: 'Base Price', value: '$ ' + data?.singleService?.basePrice },
		{ name: 'Pricing Type', value: data?.singleService?.pricingType },
		{ name: 'Location Type', value: data?.singleService?.locationType },
		{ name: 'Service Radius (km)', value: data?.singleService?.serviceRadiusKm },
		{ name: 'Estimated Duration (min)', value: data?.singleService?.estimatedDurationMinutes },
		{ name: 'Min Booking Notice (hours)', value: data?.singleService?.minBookingNoticeHours },
		{ name: 'Max Daily Bookings', value: data?.singleService?.maxDailyBookings },
		{ name: 'Is Active', value: data?.singleService?.isActive ? 'Yes' : 'No' },
		{ name: 'Average Rating', value: data?.singleService?.averageRating },
		{ name: 'Rating Count', value: data?.singleService?.ratingCount },
		{ name: 'Created At', value: formatDate(new Date(data?.singleService?.createdAt)) },
		{ name: 'Updated At', value: formatDate(new Date(data?.singleService?.updatedAt)) },
		{ name: 'Price Min', value: data?.singleService?.priceMin },
		{ name: 'Price Max', value: data?.singleService?.priceMax },
		{ name: 'Booking Enabled', value: data?.singleService?.bookingEnabled ? 'Yes' : 'No' },
		{ name: 'Latitude', value: data?.singleService?.latitude },
		{ name: 'Longitude', value: data?.singleService?.longitude },
		{ name: 'Allow Images', value: data?.singleService?.allowImages ? 'Yes' : 'No' },
		{
			name: 'Requires Before Image',
			value: data?.singleService?.requiresBeforeImage ? 'Yes' : 'No'
		},
		{ name: 'Requires After Image', value: data?.singleService?.requiresAfterImage ? 'Yes' : 'No' }
	]);

	const { form, errors, enhance, delayed, capture, restore, allErrors, message } = superForm(
		data.editForm,
		{
			resetForm: false
		}
	);

	import { toast } from 'svelte-sonner';
	import { formatDate } from '$lib/global.svelte.js';
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
<SingleView title="Customer Details" class="w-full!">
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
		<!-- {#if data?.singleUser?.banned}
			<UnBan
				action="?/unban"
				data={data.unBanForm}
				name="{data.singleUser?.firstName} {data.singleUser?.lastName}"
			/>
		{/if}
		{#if !data?.singleUser?.banned}
			<Ban
				action="?/ban"
				data={data.banForm}
				name="{data.singleUser?.firstName} {data.singleUser?.lastName}"
			/>
		{/if} -->
		<!-- <Delete redirect="/dashboard/users" /> -->
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
					<h2 class="mb-4 text-xl font-semibold text-gray-800">Basic Information</h2>
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<InputComp
							label="Service Title"
							{form}
							{errors}
							name="title"
							type="text"
							placeholder="e.g. Premium House Cleaning"
							required
						/>
						<InputComp
							label="Category"
							{form}
							{errors}
							name="categoryId"
							type="combo"
							placeholder="Select Category"
							required
							items={data?.categoryList}
						/>

						<div class="md:col-span-2">
							<InputComp
								label="Short Description"
								{form}
								{errors}
								name="shortDescription"
								type="textarea"
								placeholder="Brief summary of service"
							/>
						</div>

						<div class="md:col-span-2">
							<InputComp
								label="Full Description"
								{form}
								{errors}
								name="fullDescription"
								type="textarea"
								placeholder="Detailed service breakdown..."
							/>
						</div>
					</div>
				</div>

				<div class="border-b border-gray-200 pb-6">
					<h2 class="mb-4 text-xl font-semibold text-gray-800">Pricing & Logistics</h2>
					<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
						<InputComp
							label="Base Price ($)"
							{form}
							{errors}
							name="basePrice"
							type="number"
							placeholder="0.00"
						/>
						<InputComp
							label="Min Price"
							{form}
							{errors}
							name="priceMin"
							type="number"
							placeholder="0.00"
						/>
						<InputComp
							label="Max Price"
							{form}
							{errors}
							name="priceMax"
							type="number"
							placeholder="0.00"
						/>

						<InputComp
							label="Pricing Type"
							{form}
							{errors}
							name="pricingType"
							type="text"
							placeholder="Fixed/Hourly"
						/>
						<InputComp
							label="Service Radius (km)"
							{form}
							{errors}
							name="serviceRadiusKm"
							type="number"
						/>
						<InputComp
							label="Estimated Duration (min)"
							{form}
							{errors}
							name="estimatedDurationMinutes"
							type="number"
						/>
					</div>
				</div>

				<div class="border-b border-gray-200 pb-6">
					<h2 class="mb-4 text-xl font-semibold text-gray-800">Booking Settings</h2>
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
						<InputComp
							label="Min Booking Notice (hours)"
							{form}
							{errors}
							name="minBookingNoticeHours"
							type="number"
						/>
						<InputComp
							label="Max Daily Bookings"
							{form}
							{errors}
							name="maxDailyBookings"
							type="number"
						/>
						<InputComp label="Latitude" {form} {errors} name="latitude" type="number" />
						<InputComp label="Longitude" {form} {errors} name="longitude" type="number" />
					</div>
				</div>

				<div>
					<h2 class="mb-4 text-xl font-semibold text-gray-800">Status & Requirements</h2>
					<div
						class="grid grid-cols-1 gap-4 rounded-md bg-gray-50 p-4 sm:grid-cols-2 md:grid-cols-3"
					>
						<InputComp
							label="Is Active"
							{form}
							{errors}
							name="isActive"
							type="select"
							items={[
								{ value: true, name: 'Active' },
								{ value: false, name: 'Inactive' }
							]}
						/>
						<InputComp
							label="Booking Enabled"
							{form}
							{errors}
							name="bookingEnabled"
							type="select"
							items={[
								{ value: true, name: 'Enabled' },
								{ value: false, name: 'Disabled' }
							]}
						/>
						<InputComp
							label="Allow Images"
							name="allowImages"
							type="select"
							{form}
							{errors}
							items={[
								{ value: true, name: 'Allow Images' },
								{ value: false, name: "Don't Allow Images" }
							]}
						/>

						<InputComp
							label="Require Before Images"
							name="requiresBeforeImage"
							type="select"
							{form}
							{errors}
							items={[
								{ value: true, name: 'Allow Before Images' },
								{ value: false, name: "Don't Allow Before Images" }
							]}
						/>

						<InputComp
							label="Require After Images"
							name="requiresAfterImage"
							type="select"
							{form}
							{errors}
							items={[
								{ value: true, name: 'Allow After Images' },
								{ value: false, name: "Don't Allow After Images" }
							]}
						/>
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

<!-- <DataTable
	data={data?.permissionList}
	{columns}
	fileName="{data?.singleUser?.name}Permission List"
/> -->

{#snippet fe(
	label = '',
	name = '',
	type = '',
	placeholder = '',
	required = false,
	min = '',
	max = ''
)}
	<div class="flex w-full flex-col justify-start gap-2">
		<Label for={name}>{label}</Label>
		<Input
			{type}
			{name}
			{placeholder}
			{required}
			{min}
			{max}
			bind:value={$form[name]}
			aria-invalid={$errors[name] ? 'true' : undefined}
		/>
		{#if $errors[name]}
			<span class="text-red-500">{$errors[name]}</span>
		{/if}
	</div>
{/snippet}
{#snippet selects(name, items)}
	<div class="flex w-full flex-col justify-start gap-2">
		<Label for={name} class="capitalize">{name.replace(/([a-z])([A-Z])/g, '$1 $2')}:</Label>

		<SelectComp {name} bind:value={$form[name]} {items} />
		{#if $errors[name]}<span class="text-red-500">{$errors[name]}</span>{/if}
	</div>
{/snippet}

<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { editUserSchema } from './schema';

	let { data } = $props();

	import SingleTable from '$lib/components/SingleTable.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { superForm } from 'sveltekit-superforms/client';

	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import { ArrowLeft, CalendarClock, Pencil, Save } from '@lucide/svelte';
	import SelectComp from '$lib/formComponents/SelectComp.svelte';
	import type { Snapshot } from '@sveltejs/kit';

	import Delete from '$lib/forms/Delete.svelte';
	import SingleView from '$lib/components/SingleView.svelte';
	import Errors from '$lib/formComponents/Errors.svelte';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import Ban from '$lib/forms/Ban.svelte';
	import UnBan from '$lib/forms/UnBan.svelte';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import { columns } from './columns.js';
	let singleTable = $derived([
		{
			name: 'Name',
			value:
				`${data.singleUser?.firstName ?? ''} ${data.singleUser?.lastName ?? ''}`.trim() || 'N/A'
		},
		{ name: 'Email', value: data.singleUser?.email ?? 'N/A' },
		{ name: 'Phone', value: data.singleUser?.phoneNumber ?? 'N/A' },
		{ name: 'Role', value: data.singleUser?.role },
		{ name: 'Status', value: data.singleUser?.banned ? 'Banned' : 'Active' },

		// Identity & Verification
		{ name: 'Verified Provider', value: data.singleUser?.isVerifiedProvider ? 'Yes' : 'No' },
		{ name: 'Verification Status', value: data.singleUser?.verificationStatus?.replace('_', ' ') },

		// Location Details
		{ name: 'City', value: data.singleUser?.locationCity ?? 'N/A' },
		{
			name: 'State/Country',
			value: `${data.singleUser?.locationState ?? ''}, ${data.singleUser?.locationCountry ?? ''}`
		},
		{ name: 'Address', value: data.singleUser?.primaryAddress ?? 'N/A' },
		{
			name: 'Coordinates',
			value: data.singleUser?.latitude
				? `${data.singleUser.latitude}, ${data.singleUser.longitude}`
				: 'N/A'
		},

		// Reputation
		{
			name: 'Rating',
			value: `${data.singleUser?.ratingAverage} (${data.singleUser?.ratingCount} reviews)`
		},

		// Business/Internal
		{ name: 'Stripe ID', value: data.singleUser?.stripeCustomerId ?? 'None' },
		{ name: 'Bio', value: data.singleUser?.bio ?? 'No bio provided' },
		{ name: 'Version', value: data.singleUser?.version ?? 0 },

		// Ban Info (Conditional logic)
		...(data.singleUser?.banned
			? [
					{ name: 'Ban Reason', value: data.singleUser?.banReason ?? 'No reason provided' },
					{
						name: 'Banned At',
						value: data.singleUser?.bannedAt
							? formatDate(new Date(data.singleUser.bannedAt))
							: 'N/A'
					}
				]
			: []),

		// Timestamps
		{
			name: 'Created At',
			value: data.singleUser?.createdAt ? formatDate(new Date(data.singleUser.createdAt)) : 'N/A'
		},
		{
			name: 'Updated At',
			value: data.singleUser?.updatedAt ? formatDate(new Date(data.singleUser.updatedAt)) : 'N/A'
		}
	]);

	const bannedInfo = $derived([
		{ name: 'Ban Reason', value: data.singleUser?.banReason },
		{ name: 'Banned At', value: formatDate(data.singleUser?.bannedAt) }
	]);

	const { form, errors, enhance, delayed, capture, restore, allErrors, message } = superForm(
		data.form,
		{
			validators: zod4Client(editUserSchema),
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
	<title>User Details</title>
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
		<Button href="/dashboard/users/{page.params.id}/bookings">
			<CalendarClock /> Bookings
		</Button>
		{#if data?.singleUser?.banned}
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
		{/if}
		<Delete redirect="/dashboard/users" />
	</div>
	{#if edit === false}
		<div class="w-full p-4">
			<SingleTable
				singleTable={data?.singleUser?.banned ? [...singleTable, ...bannedInfo] : singleTable}
			/>
		</div>
	{/if}
	{#if edit}
		<div class="w-full p-4">
			<form action="?/editUser" use:enhance class="flex flex-col gap-4" id="edit" method="post">
				<Errors allErrors={$allErrors} />
				<InputComp
					label="First Name"
					{form}
					{errors}
					type="text"
					name="firstName"
					placeholder="Enter the first name of new user"
					required
				/>

				<InputComp
					label="Last Name"
					{form}
					{errors}
					type="text"
					name="lastName"
					placeholder="Enter the last name of new user"
					required
				/>
				<InputComp
					label="Email"
					{form}
					type="email"
					{errors}
					name="email"
					placeholder="Enter the email of new admin user"
					required
				/>

				<InputComp {form} {errors} name="role" type="text" label="Role" required />

				<InputComp
					label="Phone Number"
					{form}
					{errors}
					type="text"
					name="phoneNumber"
					placeholder="+1 (555) 000-0000"
				/>

				<InputComp
					label="Profile Photo URL"
					{form}
					{errors}
					type="url"
					name="profilePhotoUrl"
					placeholder="https://example.com/photo.jpg"
				/>

				<InputComp
					label="Bio"
					{form}
					{errors}
					type="text"
					name="bio"
					placeholder="Tell us a little about the user..."
				/>

				<hr class="my-4" />

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<InputComp
						label="City"
						{form}
						{errors}
						type="text"
						name="locationCity"
						placeholder="Austin"
					/>
					<InputComp
						label="State / Province"
						{form}
						{errors}
						type="text"
						name="locationState"
						placeholder="Texas"
					/>
				</div>

				<InputComp
					label="Country"
					{form}
					{errors}
					type="text"
					name="locationCountry"
					placeholder="USA"
				/>

				<InputComp
					label="Primary Address"
					{form}
					{errors}
					type="text"
					name="primaryAddress"
					placeholder="123 Street Name"
				/>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<InputComp label="Latitude" {form} {errors} type="number" name="latitude" />
					<InputComp label="Longitude" {form} {errors} type="number" name="longitude" />
				</div>

				<input type="hidden" name="version" bind:value={$form.version} />

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

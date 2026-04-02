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
	import { ArrowLeft, Pencil, Save } from '@lucide/svelte';
	import Ban from '$lib/forms/Ban.svelte';
	import type { Snapshot } from '@sveltejs/kit';

	import Delete from '$lib/forms/Delete.svelte';
	import SingleView from '$lib/components/SingleView.svelte';
	import Errors from '$lib/formComponents/Errors.svelte';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import InputComp from '$lib/formComponents/InputComp.svelte';

	import { columns } from './columns.js';
	import { formatDate } from '$lib/global.svelte';

	let banned = $derived([
		{ name: 'Name', value: data.singleUser?.name },
		{ name: 'Email', value: data.singleUser?.email },
		{ name: 'Role', value: data.singleUser?.role },
		{ name: 'Created At', value: formatDate(data.singleUser?.createdAt) },
		{ name: 'Updated At', value: formatDate(data.singleUser?.updatedAt) },
		{ name: 'Status', value: data?.singleUser?.status ? 'Banned' : 'Active' },
		{ name: 'Ban Reason', value: data.singleUser?.banReason },
		{ name: 'Banned At', value: formatDate(data.singleUser?.bannedAt) }
	]);

	let unbanned = $derived([
		{ name: 'Name', value: data.singleUser?.name },
		{ name: 'Email', value: data.singleUser?.email },
		{ name: 'Role', value: data.singleUser?.role },
		{ name: 'Status', value: data?.singleUser?.status ? 'Banned' : 'Active' },
		{ name: 'Created At', value: formatDate(data.singleUser?.createdAt) },
		{ name: 'Updated At', value: formatDate(data.singleUser?.updatedAt) }
	]);

	let singleTable = $derived(data?.singleUser?.status ? banned : unbanned);

	const { form, errors, enhance, delayed, capture, restore, allErrors, message } = superForm(
		data.form,
		{
			validators: zod4Client(editUserSchema),
			resetForm: false,
			dataType: 'json'
		}
	);

	import { toast } from 'svelte-sonner';
	import UnBan from '$lib/forms/UnBan.svelte';
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

	$form.firstName = data.singleUser?.firstName;
	$form.lastName = data.singleUser?.lastName;
	$form.email = data.singleUser?.email;
	$form.role = data.singleUser?.roleId;
	$form.permissionsList = data?.permissionList.map((item) => item.id) || [];
</script>

<svelte:head>
	<title>User Details</title>
</svelte:head>
<SingleView title="User Details" class="w-full!">
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
		{#if data?.singleUser?.status}
			<UnBan action="?/unban" data={data.unBanForm} name={data.singleUser?.name} />
		{:else}
			<Ban action="?/ban" data={data.banForm} name={data.singleUser?.name} />
		{/if}
		<Delete redirect="/dashboard/admin-panel/users" />
	</div>
	{#if edit === false}
		<div class="w-full p-4">
			<SingleTable {singleTable} />
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

				<InputComp
					{form}
					{errors}
					name="role"
					type="select"
					label="Role"
					items={data.roleList}
					required
				/>

				<InputComp
					{form}
					{errors}
					name="editPermission"
					type="checkboxSingle"
					label="Edit Permission"
					placeholder="Edit and Modify User Permissions"
				/>

				{#if $form.editPermission}
					<InputComp
						label="Permissions"
						name="permissionsList"
						type="checkbox"
						{form}
						{errors}
						placeholder="Enter Role Name"
						items={data?.allPermissions}
					/>
				{/if}

				<!-- {@render fe('First Name', 'firstName', 'text', 'Change Name', true)}
				{@render fe('Last Name', 'lastName', 'text', 'Change Name', true)}
				{@render fe('Email', 'email', 'email', 'Change email', true)}

				{@render selects('role', data?.roleList)} -->

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
{#key data?.permissionList}
	<DataTable
		data={data?.permissionList}
		{columns}
		fileName="{data?.singleUser?.name} Permission List"
	/>
{/key}

<!-- {#snippet fe(
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
{/snippet} -->

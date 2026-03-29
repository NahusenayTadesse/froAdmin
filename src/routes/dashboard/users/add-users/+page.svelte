<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { Snapshot } from '@sveltejs/kit';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Plus } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { addUserSchema } from './schema';
	import { superForm } from 'sveltekit-superforms/client';
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import SelectComp from '$lib/formComponents/SelectComp.svelte';
	import InputComp from '$lib/formComponents/InputComp.svelte';

	let { data } = $props();

	const { form, errors, enhance, delayed, capture, restore, message } = superForm(data.form, {
		taintedMessage: () => {
			return new Promise((resolve) => {
				resolve(window.confirm('Do you want to leave?\nChanges you made may not be saved.'));
			});
		},

		validators: zod4Client(addUserSchema)
	});

	import { toast } from 'svelte-sonner';
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
	// 	 function getItemNameById(items: any, value: any) {
	//   const item = items.find(i=> i.value === value);
	//   return item ? item.name : null; // returns null if not found
	// }
</script>

<svelte:head>
	<title>Add New Service</title>
</svelte:head>

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

<Card.Root class="flex w-full flex-col gap-4 lg:w-lg">
	<Card.Header>
		<Card.Title class="text-2xl">Add New User</Card.Title>
	</Card.Header>
	<Card.Content>
		<form use:enhance action="?/addUser" id="main" class="flex flex-col gap-4" method="POST">
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
				label="Password"
				{form}
				{errors}
				name="password"
				placeholder="Enter password"
				required
				type="text"
			/>
			<InputComp
				{form}
				{errors}
				name="role"
				type="select"
				label="Role"
				items={data.allRoles}
				required
			/>

			<Button type="submit" class="mt-4" form="main">
				{#if $delayed}
					<LoadingBtn name="Adding New User" />
				{:else}
					<Plus class="h-4 w-4" />

					Add User
				{/if}
			</Button>
		</form>
	</Card.Content>
</Card.Root>

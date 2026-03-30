<script lang="ts">
	import type { Snapshot } from '@sveltejs/kit';
	import { Plus, Eye, EyeClosed } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { addUserSchema } from './schema';
	import { superForm } from 'sveltekit-superforms/client';
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import { Input } from '$lib/components/ui/input/index';
	import { Label } from '$lib/components/ui/label/index';

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
	import FormCard from '$lib/formComponents/FormCard.svelte';

	$effect(() => {
		if ($message) {
			if ($message.type === 'error') {
				toast.error($message.text);
			} else {
				toast.success($message.text);
			}
		}
	});

	let eye = $state(false);
	let EyeIcon = $derived(eye ? Eye : EyeClosed);

	export const snapshot: Snapshot = { capture, restore };
	// 	 function getItemNameById(items: any, value: any) {
	//   const item = items.find(i=> i.value === value);
	//   return item ? item.name : null; // returns null if not found
	// }
</script>

<svelte:head>
	<title>Add New Admin User</title>
</svelte:head>
{#snippet fe(label = '', name = '', placeholder = '', required = false, min = '', max = '')}
	<div class="relative flex w-full flex-col justify-start gap-2">
		<Label for={name}>{label}</Label>

		<div class="relative">
			<Input
				type={eye ? 'text' : 'password'}
				{name}
				{placeholder}
				{required}
				{min}
				{max}
				class="pr-10"
				bind:value={$form[name]}
				aria-invalid={$errors[name] ? 'true' : undefined}
			/>

			<button
				type="button"
				onclick={() => (eye = !eye)}
				title="Toggle Password Visibility"
				class="absolute inset-y-0 right-2 flex items-center pr-3 text-gray-500 hover:text-gray-700"
			>
				<EyeIcon
					class="h-5 w-5 transition-transform duration-300 ease-in-out {eye ? 'scale-110' : ''}"
				/>
			</button>
		</div>

		{#if $errors[name]}
			{#each $errors[name] as error}
				<span class="text-sm text-red-500">{error}</span>
			{/each}
		{/if}
	</div>
{/snippet}

<FormCard title="Add New Admin User" className="w-full!">
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

		{@render fe('Password', 'password', 'Enter your new password', true)}

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
</FormCard>

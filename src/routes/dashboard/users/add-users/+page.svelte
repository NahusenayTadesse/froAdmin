<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { Snapshot } from '@sveltejs/kit';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Plus } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { addUserSchema } from '$lib/ZodSchema';
	import { superForm } from 'sveltekit-superforms/client';
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import InputComp from '$lib/formComponents/InputComp.svelte';

	let { data } = $props();

	const { form, errors, enhance, delayed, capture, restore, message, allErrors } = superForm(
		data.form,
		{
			taintedMessage: () => {
				return new Promise((resolve) => {
					resolve(window.confirm('Do you want to leave?\nChanges you made may not be saved.'));
				});
			},

			validators: zod4Client(addUserSchema)
		}
	);

	import { toast } from 'svelte-sonner';
	import Errors from '$lib/formComponents/Errors.svelte';
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
	<title>Add New User</title>
</svelte:head>

<Card.Root class="flex w-full flex-col gap-4 lg:w-lg">
	<Card.Header>
		<Card.Title class="text-2xl">Add New User</Card.Title>
	</Card.Header>
	<Card.Content>
		<form method="POST" id="main" action="?/signUp" class="flex flex-col gap-4" use:enhance>
			<Errors allErrors={$allErrors} />

			<div class="grid gap-4">
				<InputComp
					label="Full Name"
					name="name"
					type="text"
					{form}
					{errors}
					placeholder="John Doe"
				/>
			</div>
			<InputComp
				label="Email Address"
				name="email"
				type="email"
				{form}
				{errors}
				placeholder="john@example.com"
			/>
			<InputComp
				label="Phone Number"
				name="phone"
				type="tel"
				{form}
				{errors}
				placeholder="+251 9-11-00-00-00"
			/>
			<div class="grid gap-2">
				<div class="flex items-center">
					<Label for="password">Password</Label>
				</div>
				<div class="relative">
					<Input
						id="password"
						name="password"
						type={eye ? 'text' : 'password'}
						bind:value={$form.password}
						required
					/>
					<button type="button" onclick={() => (eye = !eye)} title="Make Password Visible">
						<EyeIcon
							class="absolute top-0.5 right-2 h-6 w-6 transition-transform duration-300 ease-in-out"
						/>
					</button>
					{#if $errors.password}<span class="text-red-500">{$errors.password}</span>{/if}
				</div>
			</div>

			<Button type="submit" class="mt-4" form="main">
				{#if $delayed}
					<LoadingBtn name="Adding Service" />
				{:else}
					<Plus class="h-4 w-4" />

					Add User
				{/if}
			</Button>
		</form>
	</Card.Content>
</Card.Root>

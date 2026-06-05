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
	<title>Add New Sales Person</title>
</svelte:head>

<Card.Root class="flex w-full flex-col gap-4 lg:w-lg">
	<Card.Header>
		<Card.Title class="text-2xl">Add New Sales Person</Card.Title>
	</Card.Header>
	<Card.Content>
		<form use:enhance action="?/addUser" id="main" class="flex flex-col gap-4" method="POST">
			<Errors allErrors={$allErrors} />
			<InputComp
				label="User"
				{form}
				{errors}
				type="combo"
				name="provider"
				items={data?.allProviders}
				placeholder=""
				required
			/>
			<InputComp
				label="Current Tier"
				{form}
				{errors}
				type="combo"
				name="currentTier"
				items={data?.allSalesTiers}
				placeholder=""
				required
			/>
			<InputComp
				label="Status"
				{form}
				type="select"
				{errors}
				name="status"
				items={[
					{ value: 'active', name: 'Active' },
					{ value: 'inactive', name: 'Inactive' },
					{ value: 'pending', name: 'Pending' }
				]}
				placeholder="Enter the status of new admin user"
				required
			/>
			<InputComp
				label="Can View Afflaites"
				{form}
				{errors}
				name="canAlsoViewAffiliate"
				placeholder=""
				items={[
					{ value: true, name: 'Yes, they can view affiliates' },
					{ value: false, name: 'No, they cannot view affiliates' }
				]}
				required
				type="select"
			/>

			<Button type="submit" class="mt-4" form="main">
				{#if $delayed}
					<LoadingBtn name="Adding New Sales Person" />
				{:else}
					<Plus class="h-4 w-4" />

					Add New Sales Person
				{/if}
			</Button>
		</form>
	</Card.Content>
</Card.Root>

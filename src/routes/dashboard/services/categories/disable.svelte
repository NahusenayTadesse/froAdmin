<script lang="ts">
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import { Ban } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';
	import Errors from '$lib/formComponents/Errors.svelte';
	import type { Disable } from './schema';

	let {
		data,
		action = '?/disable',
		id,
		name
	}: {
		data: SuperValidated<Infer<Disable>>;
		id: string;
		action: string;
		name: string;
	} = $props();

	const { form, enhance, delayed, message, allErrors } = superForm(data, {
		resetForm: false
	});

	let open = $state(false);

	import { toast } from 'svelte-sonner';
	$effect(() => {
		if ($message) {
			if ($message.type === 'error') {
				toast.error($message.text);
			} else {
				toast.success($message.text);
				open = false;
			}
		}
	});

	$form.id = id;
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger
		class="{buttonVariants({
			variant: 'destructive',
			size: 'lg'
		})} flex w-auto max-w-lg flex-row items-center justify-center gap-2 border-0 p-0! px-4!"
	>
		<Ban /> Disable {name}
	</Dialog.Trigger>
	<Dialog.Content class="w-full bg-background">
		<Dialog.Header>
			<Dialog.Title class=" text-center text-4xl text-destructive">Disable {name}</Dialog.Title>
		</Dialog.Header>
		<form {action} use:enhance method="post" id="edit" class="flex w-full flex-col gap-4 p-4">
			<Errors allErrors={$allErrors} />

			<input type="hidden" name="id" bind:value={$form.id} />

			<!-- <InputComp
				{form}
				{errors}
				label="Ban Reason"
				type="textarea"
				name="banReason"
				placeholder="Enter Why User {name} should be banned"
				required={true}
				rows={10}
			/> -->

			<Button type="submit" variant="destructive" class="mt-4" form="edit">
				{#if $delayed}
					<LoadingBtn name="Disabling Changes" />
				{:else}
					<Ban class="h-4 w-4" />

					Disable {name}
				{/if}
			</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>

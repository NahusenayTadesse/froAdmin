<script lang="ts">
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import { Ban, LockOpen as Unban } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Enable } from './schema';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';
	import Errors from '$lib/formComponents/Errors.svelte';

	let {
		data,
		action = '?/enable',
		id,
		name
	}: {
		data: SuperValidated<Infer<Enable>>;
		action: string;
		id: string;
		name: string;
	} = $props();

	const { form, enhance, delayed, message, allErrors } = superForm(data, {
		resetForm: false
	});

	let open = $state(false);

	$form.id = id;

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
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger
		class="{buttonVariants({
			variant: 'default',
			size: 'lg'
		})} flex w-auto max-w-lg flex-row items-center justify-center gap-2 border-0 p-0! px-4!"
	>
		<Unban />Enable {name}
	</Dialog.Trigger>
	<Dialog.Content class="w-full ">
		<Dialog.Header>
			<Dialog.Title class=" text-center text-lg"
				>Are you sure you want to enable {name}?</Dialog.Title
			>
		</Dialog.Header>
		<form {action} use:enhance method="post" id="edit" class="flex w-full flex-col gap-4">
			<Errors allErrors={$allErrors} />
			<input type="hidden" name="id" bind:value={$form.id} />

			<Button type="submit" class="" form="edit">
				{#if $delayed}
					<LoadingBtn name="Enabling {name}" />
				{:else}
					<Unban class="h-4 w-4" />

					Enable {name}
				{/if}
			</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>

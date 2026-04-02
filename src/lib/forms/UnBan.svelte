<script lang="ts">
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import { Ban, LockOpen as Unban } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { UnBanUserSchema } from '$lib/ZodSchema';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';
	import Errors from '$lib/formComponents/Errors.svelte';

	let {
		data,
		action = '?/unban',
		name
	}: {
		data: SuperValidated<Infer<UnBanUserSchema>>;
		action: string;
		name: string;
	} = $props();

	const { enhance, delayed, message, allErrors } = superForm(data, {
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
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger
		class="{buttonVariants({
			variant: 'default',
			size: 'lg'
		})} flex w-auto max-w-lg flex-row items-center justify-center gap-2 border-0 p-0! px-4!"
	>
		<Unban />UnBan {name}
	</Dialog.Trigger>
	<Dialog.Content class="w-full bg-white">
		<Dialog.Header>
			<Dialog.Title class=" text-center text-lg"
				>Are you sure you want to unban {name}?</Dialog.Title
			>
		</Dialog.Header>
		<form {action} use:enhance method="post" id="edit" class="flex w-full flex-col gap-4">
			<Errors allErrors={$allErrors} />

			<Button type="submit" class="" form="edit">
				{#if $delayed}
					<LoadingBtn name="Saving Changes" />
				{:else}
					<Unban class="h-4 w-4" />

					Unban for {name}
				{/if}
			</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>

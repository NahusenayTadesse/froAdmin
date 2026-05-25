<script lang="ts">
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import { BadgeCheck, BadgeMinus } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { VerifyUserSchema } from '$lib/ZodSchema';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';
	import Errors from '$lib/formComponents/Errors.svelte';

	let {
		data,
		action = '?/unban',
		verify,
		verificationStatus,
		name
	}: {
		data: SuperValidated<Infer<VerifyUserSchema>>;
		action: string;
		verify: boolean;
		verificationStatus?: string;
		name: string;
	} = $props();

	const { form, errors, enhance, delayed, message, allErrors } = superForm(data, {
		resetForm: false,
		onChange: () => {
			$form.verificationStatus = $form.verify ? 'approved' : 'pending';
		}
	});

	$form.verificationStatus = verificationStatus;
	$form.verify = verify;

	let open = $state(false);

	import { toast } from 'svelte-sonner';
	import InputComp from '$lib/formComponents/InputComp.svelte';
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

	let Badge = $derived(verify ? BadgeMinus : BadgeCheck);
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger
		class="flex w-auto max-w-lg flex-row items-center justify-center gap-2 border-0 p-0! px-4!"
	>
		{#snippet child({ props })}
			<Button {...props} variant={verify ? 'destructive' : 'default'} size="lg">
				<Badge />{verify ? 'Unverify' : 'Verify'}
				{name}
			</Button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="w-full ">
		<Dialog.Header>
			<Dialog.Title class=" text-center text-lg"
				>{verify ? 'Unverify' : 'Verify'} {name}?</Dialog.Title
			>
		</Dialog.Header>
		<form {action} use:enhance method="post" id="edit" class="flex w-full flex-col gap-4">
			<Errors allErrors={$allErrors} />
			<InputComp
				{form}
				{errors}
				label="Verify"
				name="verify"
				type="select"
				items={[
					{ value: true, name: 'Verify' },
					{ value: false, name: 'Reject' }
				]}
			/>
			<InputComp
				{form}
				{errors}
				label="Verification Status"
				name="verificationStatus"
				type="select"
				items={[
					{ value: 'approved', name: 'Approved' },
					{ value: 'pending', name: 'Pending' },
					{ value: 'rejected', name: 'Rejected' }
				]}
			/>

			<Button type="submit" class="" form="edit">
				{#if $delayed}
					<LoadingBtn name="Verifying" />
				{:else}
					<BadgeCheck class="h-4 w-4" />

					Verify {name}
				{/if}
			</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>

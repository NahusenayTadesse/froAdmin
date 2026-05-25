<script lang="ts">
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import { Save } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { changeStatus } from './schema';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/popover/index.js';

	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';
	import Errors from '$lib/formComponents/Errors.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	let {
		data,
		action,
		ids = $bindable(''),
		verificationsStates,
		name,
		discoverable = false,
		disabled = $bindable(false)
	}: {
		data: SuperValidated<Infer<typeof changeStatus>>;
		action: string;
		ids: string;
		verificationsStates?: string[{ state }];
		name: string;
		discoverable?: boolean;
		disabled: boolean;
	} = $props();

	const { form, errors, enhance, delayed, allErrors } = superForm(data, {
		resetForm: false,
		onUpdated({ form }) {
			if (form.message) {
				if (form.message.type === 'error') {
					toast.error(form.message.text);
				} else {
					toast.success(form.message.text);
				}
			}
		}
	});

	let open = $state(false);

	$form.ids = ids;

	import { toast } from 'svelte-sonner';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import type { Item } from '$lib/global.svelte';

	const states: Item[] = $derived(
		verificationsStates.map((s) => ({ value: s.state, name: s.state }))
	);
</script>

<Tooltip.Provider>
	<Tooltip.Root>
		<Tooltip.Trigger {disabled} class={buttonVariants({ variant: 'default' })}>
			<Dialog.Root bind:open>
				<Dialog.Trigger
					{disabled}
					class="flex w-auto flex-row items-center justify-center gap-2 border-0"
				>
					{name}
				</Dialog.Trigger>
				<Dialog.Content class="w-sm">
					<Dialog.Header>
						<Dialog.Title class="text-center text-4xl"
							>Change {name} for selected videos
						</Dialog.Title>
					</Dialog.Header>
					<form {action} use:enhance method="post" id="edit" class="flex w-full flex-col gap-4 p-4">
						<Errors allErrors={$allErrors} />
						<input type="hidden" name="ids" value={$form.ids} />
						{#if verificationsStates}
							<InputComp
								label="Verification State"
								name="verificationState"
								type="combo"
								{form}
								{errors}
								items={states}
							/>
						{:else}
							<InputComp
								label="Change Status"
								name="status"
								type="select"
								{form}
								{errors}
								items={[
									{ value: true, name: discoverable ? 'Discoverable' : 'Reviewed' },
									{ value: false, name: discoverable ? 'Not Discoverable' : 'Not Reviewed' }
								]}
							/>
						{/if}
						<Button {disabled} type="submit" class="mt-4" form="edit">
							{#if $delayed}
								<LoadingBtn name="Saving Changes" />
							{:else}
								<Save class="h-4 w-4" />
								Save Changes
							{/if}
						</Button>
					</form>
				</Dialog.Content>
			</Dialog.Root>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>Change {name}</p>
		</Tooltip.Content>
	</Tooltip.Root>
</Tooltip.Provider>

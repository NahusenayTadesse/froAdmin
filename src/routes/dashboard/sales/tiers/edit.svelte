<script lang="ts">
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import { SquarePen, Save } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Edit } from './schema';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';
	import Errors from '$lib/formComponents/Errors.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	type Item = {
		value: number;
		name: string;
	};

	let {
		id,
		name,
		minSignups,
		action = '?/edit',
		data,
		ratePerUser,
		bonusThreshold,
		bonusAmount,
		currency,
		icon = true,
		isActive
	}: {
		data: SuperValidated<Infer<Edit>>;
		action: string;
		id: number;
		name: string;
		icon: boolean;
		minSignups: number;
		ratePerUser: number;
		bonusThreshold: number;
		bonusAmount: number;
		currency: string;
		isActive: boolean;
	} = $props();

	const { form, errors, enhance, delayed, message, allErrors } = superForm(data, {
		resetForm: false
	});

	let open = $state(false);

	$form.id = id;
	$form.name = name;
	$form.minSignups = minSignups;
	$form.ratePerUser = ratePerUser;
	$form.bonusThreshold = bonusThreshold;
	$form.bonusAmount = bonusAmount;
	$form.currency = currency;
	$form.icon = icon;
	$form.isActive = isActive;

	import { toast } from 'svelte-sonner';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import DialogComp from '$lib/formComponents/DialogComp.svelte';
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

<DialogComp variant="ghost" title={icon ? 'Edit ' : name} IconComp={icon ? SquarePen : undefined}>
	<form {action} use:enhance method="post" id="edit" class="flex w-full flex-col gap-4 p-4">
		<Errors allErrors={$allErrors} />
		<input type="hidden" name="id" value={$form.id} />
		<InputComp {form} {errors} label="name" type="text" name="name" required={true} />

		<InputComp
			{form}
			{errors}
			label="Min Signups"
			type="number"
			name="minSignups"
			placeholder="Enter Min Signups"
			required={true}
		/>

		<InputComp
			{form}
			{errors}
			label="Rate Per User"
			type="number"
			name="ratePerUser"
			placeholder="Enter Rate Per User"
			required={true}
		/>

		<InputComp
			{form}
			{errors}
			label="Bonus Amount"
			type="number"
			name="bonusAmount"
			placeholder="Enter Bonus Amount"
			required={true}
		/>

		<InputComp
			{form}
			{errors}
			label="Bonus Threshold"
			type="number"
			name="bonusThreshold"
			placeholder="Enter Bonus Threshold"
		/>

		<InputComp
			label="Active"
			name="isActive"
			type="select"
			{form}
			{errors}
			items={[
				{ value: true, name: 'Active' },
				{ value: false, name: 'Inactive' }
			]}
		/>

		<Button type="submit" class="mt-4" form="edit">
			{#if $delayed}
				<LoadingBtn name="Saving Changes" />
			{:else}
				<Save class="h-4 w-4" />

				Save Changes
			{/if}
		</Button>
	</form>
</DialogComp>

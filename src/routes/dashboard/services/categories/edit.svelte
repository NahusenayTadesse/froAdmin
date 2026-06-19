<script lang="ts">
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import { SquarePen, Save } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Edit } from './schema';

	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';
	import Errors from '$lib/formComponents/Errors.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	type Item = {
		value: number;
		name: string;
	};

	let {
		data,
		action = '?/edit',
		id,
		name,
		description,
		allowImages,
		requiresBeforeImage,
		requiresAfterImage,
		icon = false,
		sortOrder
	}: {
		data: SuperValidated<Infer<Edit>>;
		action: string;
		id: number;
		name: string;
		icon: boolean;
		description: string;
		allowImages: boolean;
		requiresBeforeImage: boolean;
		requiresAfterImage: boolean;
		sortOrder: number;
	} = $props();

	const { form, errors, enhance, delayed, message, allErrors } = superForm(data, {
		resetForm: false
	});

	let open = $state(false);

	$form.id = id;
	$form.name = name;
	$form.description = description;
	$form.sortOrder = sortOrder;
	$form.allowImages = allowImages;
	$form.requiresBeforeImage = requiresBeforeImage;
	$form.requiresAfterImage = requiresAfterImage;

	import { toast } from 'svelte-sonner';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import Messages from '$lib/formComponents/Messages.svelte';
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

<DialogComp title={icon ? 'Edit ' : name} IconComp={icon ? SquarePen : undefined} variant="ghost">
	<form {action} use:enhance method="post" id="edit" class="flex w-full flex-col gap-4 p-4">
		<Errors allErrors={$allErrors} />
		<input type="hidden" name="id" value={$form.id} />
		<Messages {message} />
		<InputComp {form} {errors} label="name" type="text" name="name" required={true} />

		<InputComp
			{form}
			{errors}
			label="Description"
			type="textarea"
			name="description"
			placeholder="Enter Department Description"
			required={true}
			rows={10}
		/>

		<InputComp
			{form}
			{errors}
			label="Sort Order"
			type="number"
			name="sortOrder"
			placeholder="Enter Service Category Sort Order"
			required={true}
		/>

		<InputComp
			label="Allow Images"
			name="allowImages"
			type="select"
			{form}
			{errors}
			items={[
				{ value: true, name: 'Allow Images' },
				{ value: false, name: "Don't Allow Images" }
			]}
		/>

		<InputComp
			label="Require Before Images"
			name="requiresBeforeImage"
			type="select"
			{form}
			{errors}
			items={[
				{ value: true, name: 'Allow Before Images' },
				{ value: false, name: "Don't Allow Before Images" }
			]}
		/>

		<InputComp
			label="Require After Images"
			name="requiresAfterImage"
			type="select"
			{form}
			{errors}
			items={[
				{ value: true, name: 'Allow After Images' },
				{ value: false, name: "Don't Allow After Images" }
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

<script>
	import { renderComponent } from '$lib/components/ui/data-table/index.js';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
	import Statuses from '$lib/components/Table/statuses.svelte';
	import DialogComp from '$lib/formComponents/DialogComp.svelte';
	import { Button } from '$lib/components/ui/button/index';

	let { data } = $props();
	import { superForm } from 'sveltekit-superforms/client';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import { Plus } from '@lucide/svelte';

	const { form, errors, enhance, delayed, message } = superForm(data.form, {});

	import { columns } from './columns';

	import { toast } from 'svelte-sonner';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';

	let filteredList = $derived(data.allData);
	$effect(() => {
		if ($message) {
			if ($message.type === 'error') {
				toast.error($message.text);
			} else {
				toast.success($message.text);
			}
		}
	});
</script>

<svelte:head>
	<title>Services</title>
</svelte:head>
<!--
<DialogComp title="+ Add New Services" variant="default">
	<form action="?/add" use:enhance id="main" class="flex flex-col gap-4" method="post">
		<InputComp {form} {errors} label="name" type="text" name="name" required={true} />
		<InputComp
			{form}
			{errors}
			label="category"
			type="select"
			name="category"
			items={data?.categoryList}
			required={true}
		/>

		<InputComp
			{form}
			{errors}
			label="Description"
			type="textarea"
			name="description"
			placeholder="Enter Service Description"
			required={true}
			rows={10}
		/>

		<InputComp
			label="Status"
			name="status"
			type="select"
			{form}
			{errors}
			items={[
				{ value: true, name: 'Active' },
				{ value: false, name: 'Inactive' }
			]}
		/>

		<Button type="submit" form="main">
			{#if $delayed}
				<LoadingBtn name="Adding Service" />
			{:else}
				<Plus /> Add Service
			{/if}
		</Button>
	</form>
</DialogComp> -->

{#key data.allData}
	<FilterMenu
		data={data.allData}
		bind:filteredList
		filterKeys={[
			'categoryName',
			'basePrice',
			'pricingType',
			'locationType',
			'isActive',
			'averageRating',
			'ratingCount',
			'priceMin',
			'priceMax',
			'bookingEnabled',
			'allowImages',
			'requiresBeforeImage',
			'requiresAfterImage'
		]}
	/>
	<DataTable
		{columns}
		class="lg:max-w-6xl"
		data={filteredList}
		search={true}
		fileName="Service List"
	/>
{/key}

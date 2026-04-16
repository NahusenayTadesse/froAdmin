<script>
	import { renderComponent } from '$lib/components/ui/data-table/index.js';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
	import Statuses from '$lib/components/Table/statuses.svelte';
	import DialogComp from '$lib/formComponents/DialogComp.svelte';
	import { Button } from '$lib/components/ui/button/index';
	import Edit from './edit.svelte';
	import Disable from './disable.svelte';
	const columns = [
		{
			accessorKey: 'index',
			header: '#',
			cell: (info) => info.row.index + 1,
			sortable: false
		},
		{
			accessorKey: 'name',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Name',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => {
				// You can pass whatever you need from `row.original` to the component
				return renderComponent(Edit, {
					id: row.original.id,
					name: row.original.name,
					description: row.original.description,
					action: '?/edit',
					data: data?.editForm,
					sortOrder: row.original.sortOrder,
					icon: false,
					allowImages: row.original.allowImages,
					requiresBeforeImage: row.original.requiresBeforeImage,
					requiresAfterImage: row.original.requiresAfterImage
				});
			}
		},
		{
			accessorKey: 'description',
			header: 'Description',
			sortable: true
		},

		{
			accessorKey: 'sortOrder',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Sort Order',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true
		},
		{
			accessorKey: 'isPopular',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Popular',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => {
				return renderComponent(Statuses, {
					status: row.original.isPopular ? 'Popular' : 'Unpopular'
				});
			}
		},
		{
			accessorKey: 'allowImages',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Allow Images',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => {
				return renderComponent(Statuses, {
					status: row.original.allowImages ? 'Yes' : 'No'
				});
			}
		},
		{
			accessorKey: 'requiresBeforeImage',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Require Before Images',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => {
				return renderComponent(Statuses, {
					status: row.original.requiresBeforeImage ? 'Yes' : 'No'
				});
			}
		},
		{
			accessorKey: 'requiresAfterImage',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Require After Images',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => {
				return renderComponent(Statuses, {
					status: row.original.requiresAfterImage ? 'Yes' : 'No'
				});
			}
		},

		{
			accessorKey: '',
			header: 'Edit',
			sortable: true,
			cell: ({ row }) => {
				// You can pass whatever you need from `row.original` to the component
				return renderComponent(Edit, {
					id: row.original.id,
					name: row.original.name,
					description: row.original.description,
					action: '?/edit',
					data: data?.editForm,
					sortOrder: row.original.sortOrder,
					icon: true,
					allowImages: row.original.allowImages,
					requiresBeforeImage: row.original.requiresBeforeImage,
					requiresAfterImage: row.original.requiresAfterImage
				});
			}
		},

		{
			accessorKey: 'status',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Require After Images',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => {
				// You can pass whatever you need from `row.original` to the component
				return row.original.status
					? renderComponent(Disable, {
							id: row.original.id,
							name: row.original.name,
							action: '?/disable',
							data: data?.disableForm
						})
					: renderComponent(Enable, {
							id: row.original.id,
							name: row.original.name,
							action: '?/enable',
							data: data?.enableForm
						});
			}
		},
		{
			accessorKey: 'createdAt',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Created At',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => {
				return formatDate(row.original.createdAt);
			}
		},
		{
			accessorKey: 'updatedAt',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Updated At',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => {
				return formatDate(row.original.updatedAt);
			}
		}
	];
	let { data } = $props();
	import { superForm } from 'sveltekit-superforms/client';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import { Plus } from '@lucide/svelte';

	const { form, errors, enhance, delayed, message } = superForm(data.form, {});

	import Enable from './enable.svelte';
	import { toast } from 'svelte-sonner';
	import { formatDate } from '$lib/global.svelte.js';
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
	<title>Service Category</title>
</svelte:head>

<DialogComp title="+ Add New Service Category" variant="default">
	<form action="?/add" use:enhance id="main" class="flex flex-col gap-4" method="post">
		<InputComp {form} {errors} label="name" type="text" name="name" required={true} />

		<InputComp
			{form}
			{errors}
			label="Description"
			type="textarea"
			name="description"
			placeholder="Enter Service Category Description"
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
			rows={10}
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

		<Button type="submit" form="main">
			{#if $delayed}
				<LoadingBtn name="Adding Service Category" />
			{:else}
				<Plus /> Add Service Category
			{/if}
		</Button>
	</form>
</DialogComp>
{#key data.allData}
	<DataTable
		{columns}
		class="lg:max-w-6xl!"
		data={data?.allData}
		search={true}
		fileName="Service Categories"
	/>
{/key}

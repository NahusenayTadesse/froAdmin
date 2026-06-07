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
			accessorKey: 'minSignups',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Min Signups',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => {
				return row.original.minSignups ? row.original.minSignups : 'No Min Signups';
			}
		},

		{
			accessorKey: 'ratePerUser',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Rate Per User',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => {
				return row.original.ratePerUser ? row.original.ratePerUser : 'No Rate Per User';
			}
		},

		{
			accessorKey: 'bonusAmount',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Bonus Amount',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => {
				return row.original.bonusAmount ? row.original.bonusAmount : 'No Bonus Amount';
			}
		},
		{
			accessorKey: 'bonusThreshold',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Bonus Threshold',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => {
				return row.original.bonusThreshold ? row.original.bonusThreshold : 'No Bonus Threshold';
			}
		},

		{
			accessorKey: 'currency',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Currency',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => {
				return row.original.currency ? row.original.currency : 'No Currency';
			}
		},
		{
			accessorKey: 'isActive',
			header: ({ column }) =>
				renderComponent(DataTableSort, {
					name: 'Active Status',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }) => {
				return renderComponent(Statuses, {
					status: row.original.isActive ? 'Active' : 'Inactive'
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
					minSignups: row.original.minSignups,
					action: '?/edit',
					data: data?.editForm,
					ratePerUser: row.original.ratePerUser,
					bonusThreshold: row.original.bonusThreshold,
					bonusAmount: row.original.bonusAmount,
					currency: row.original.currency,
					icon: true,
					isActive: row.original.isActive
				});
			}
		},

		// {
		// 	accessorKey: 'status',
		// 	header: ({ column }) =>
		// 		renderComponent(DataTableSort, {
		// 			name: 'Change Active Status',
		// 			onclick: column.getToggleSortingHandler()
		// 		}),
		// 	sortable: true,
		// 	cell: ({ row }) => {
		// 		// You can pass whatever you need from `row.original` to the component
		// 		return row.original.status
		// 			? renderComponent(Disable, {
		// 					id: row.original.id,
		// 					name: row.original.name,
		// 					action: '?/disable',
		// 					data: data?.disableForm
		// 				})
		// 			: renderComponent(Enable, {
		// 					id: row.original.id,
		// 					name: row.original.name,
		// 					action: '?/enable',
		// 					data: data?.enableForm
		// 				});
		// 	}
		// },
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
	<title>Sales Tiers</title>
</svelte:head>

<DialogComp title="+ Add New Service Category" variant="default">
	<form action="?/add" use:enhance id="main" class="flex flex-col gap-4" method="post">
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

		<Button type="submit" form="main">
			{#if $delayed}
				<LoadingBtn name="Adding Sales Tier" />
			{:else}
				<Plus /> Add Sales Tier
			{/if}
		</Button>
	</form>
</DialogComp>
{#key data.allData}
	<DataTable {columns} data={data?.allData} search={true} fileName="Sales Tiers" />
{/key}

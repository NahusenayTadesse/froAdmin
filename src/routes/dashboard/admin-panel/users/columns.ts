import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DataTableLinks from '$lib/components/Table/data-table-links.svelte';
import Copy from '$lib/Copy.svelte';
import DataTableActions from './data-table-actions.svelte';
import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
import Stasuses from '$lib/components/Table/statuses.svelte';
import { formatDate, formatEthiopianDate } from '$lib/global.svelte';

export const columns = [
	{
		id: 'index',
		header: '#',
		cell: (info) => {
			const rowIndex = info.table.getRowModel().rows.findIndex((row) => row.id === info.row.id);
			return rowIndex + 1;
		},
		enableSorting: false
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
			return renderComponent(DataTableLinks, {
				id: row.original.id,
				name: row.original.name,
				link: '/dashboard/admin-panel/users'
			});
		}
	},

	{
		accessorKey: 'email',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Email',

				onclick: column.getToggleSortingHandler()
			}),
		sortable: true
	},
	{
		accessorKey: 'role',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Role',
				onclick: column.getToggleSortingHandler()
			}),

		sortable: true,
		cell: ({ row }) => {
			// You can pass whatever you need from `row.original` to the component
			return renderComponent(DataTableLinks, {
				id: row.original.roleId,
				name: row.original.role,
				link: '/dashboard/admin-panel/roles'
			});
		}
	},
	{
		accessorKey: 'isOnline',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Status',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return renderComponent(Stasuses, {
				status: row.original.isOnline ? 'Online' : 'Offline'
			});
		}
	},
	{
		accessorKey: 'status',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Status',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return renderComponent(Stasuses, {
				status: row.original.status ? 'Banned' : 'Active'
			});
		}
	},

	// {
	// 	accessorKey: 'permissionsCount',
	// 	header: ({ column }) =>
	// 		renderComponent(DataTableSort, {
	// 			name: 'Permissions Count',
	// 			onclick: column.getToggleSortingHandler()
	// 		}),
	// 	sortable: true,
	// 	cell: (info) => `${info.getValue()} Permissions` // always “day”
	// },

	{
		accessorKey: 'createdAt',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Added At',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: (info) => formatDate(new Date(info.getValue())) // always “day”
	},

	{
		accessorKey: 'actions',
		header: 'Actions',
		cell: ({ row }) => {
			// You can pass whatever you need from `row.original` to the component
			return renderComponent(DataTableActions, { id: row.original.id, name: row.original.name });
		}
	}
];

import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DataTableLinks from '$lib/components/Table/data-table-links.svelte';
import Copy from '$lib/Copy.svelte';
import DataTableActions from './data-table-actions.svelte';
import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
import Stasuses from '$lib/components/Table/statuses.svelte';
import { formatDate, formatEthiopianDate } from '$lib/global.svelte';
import { banUserSchema as ban, unBanUserSchema as unBan } from '$lib/ZodSchema';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import Ban from '$lib/forms/Ban.svelte';
import UnBan from '$lib/forms/UnBan.svelte';
const banForm = await superValidate(zod4(ban));
const unBanForm = await superValidate(zod4(unBan));

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
		accessorKey: 'lastSeen',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Last Seen',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			const rawValue = row.original.lastSeen;

			// Check if the value actually exists
			if (!rawValue) return 'Never';

			const dateObj = new Date(rawValue);

			// Check if the string was actually a valid date format
			if (isNaN(dateObj.getTime())) return 'Invalid Date';

			return new Intl.DateTimeFormat('en-US', {
				dateStyle: 'medium',
				timeStyle: 'short'
			}).format(dateObj);
		}
	},
	{
		accessorKey: 'device',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Device',
				onclick: column.getToggleSortingHandler()
			}),
		cell: ({ row }) => {
			return row.original.device ?? 'No Device';
		}
	},
	{
		accessorKey: 'location',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Location',
				onclick: column.getToggleSortingHandler()
			}),
		cell: ({ row }) => {
			return row.original.location ?? 'No Location';
		}
	},
	{
		accessorKey: 'isOnline',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Online Status',
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

	{
		accessorKey: 'ban',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Ban or Unban',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			if (!row.original.status) {
				return renderComponent(Ban, {
					data: banForm,
					action: `/dashboard/admin-panel/users/${row.original.id}/?/ban`,
					name: row.original.name
				});
			} else {
				return renderComponent(UnBan, {
					data: unBanForm,
					action: `/dashboard/admin-panel/users/${row.original.id}/?/unban`,
					name: row.original.name
				});
			}
		}
	},

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

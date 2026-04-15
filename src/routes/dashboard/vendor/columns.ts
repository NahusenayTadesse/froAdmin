import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DataTableLinks from '$lib/components/Table/data-table-links.svelte';
import Copy from '$lib/Copy.svelte';
import DataTableActions from './data-table-actions.svelte';
import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
import { formatDate } from '$lib/global.svelte';
import Statuses from '$lib/components/Table/statuses.svelte';
import Address from '$lib/components/Table/address.svelte';
import BigText from '$lib/components/Table/bigText.svelte';
import Ban from '$lib/forms/Ban.svelte';
import UnBan from '$lib/forms/UnBan.svelte';
import { banUserSchema as ban, unBanUserSchema as unBan } from '$lib/ZodSchema';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
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
				name: row.original.firstName + ' ' + row.original.lastName,
				link: '/dashboard/vendor'
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
		sortable: true,
		cell: ({ row }) => {
			return renderComponent(Copy, {
				data: row.original.email
			});
		}
	},
	{
		accessorKey: 'phone',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Phone',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return renderComponent(Copy, {
				data: row.original.phoneNumber
			});
		}
	},
	{
		accessorKey: 'address',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Address',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return renderComponent(Address, {
				locationCity: row.original.locationCity,
				locationState: row.original.locationState,
				locationCountry: row.original.locationCountry,
				primaryAddress: row.original.primaryAddress,
				latitude: row.original.latitude,
				longitude: row.original.longitude
			});
		}
	},
	{
		accessorKey: 'bio',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Bio',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return renderComponent(BigText, {
				text: row.original.bio
			});
		}
	},
	{
		accessorKey: 'role',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Role',
				onclick: column.getToggleSortingHandler()
			}),

		sortable: true
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
			// You can pass whatever you need from `row.original` to the component
			return renderComponent(Statuses, {
				status: row.original.banned ? 'Banned' : 'Active'
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
			if (!row.original.banned) {
				return renderComponent(Ban, {
					data: banForm,
					action: `/dashboard/users/${row.original.id}/?/ban`,
					name: row.original.firstName + ' ' + row.original.lastName
				});
			} else {
				return renderComponent(UnBan, {
					data: unBanForm,
					action: `/dashboard/users/${row.original.id}/?/unban`,
					name: row.original.firstName + ' ' + row.original.lastName
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

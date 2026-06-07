import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
import BigText from '$lib/components/Table/bigText.svelte';
import Statuses from '$lib/components/Table/statuses.svelte';
import DataTableLinks from '$lib/components/Table/data-table-links.svelte';
import { formatDate } from '$lib/global.svelte.js';
import Copy from '$lib/Copy.svelte';

export const columns = [
	{
		accessorKey: 'index',
		header: '#',
		cell: (info) => info.row.index + 1,
		sortable: false
	},

	// --- Code & Identity Info ---
	{
		accessorKey: 'amount',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Amount',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return row.original.currency + ' ' + row.original.amount;
		}
	},
	{
		accessorKey: 'amount',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Amount',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return row.original.currency + ' ' + row.original.amount;
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
			return row.original.currency + ' ' + row.original.bonusAmount;
		}
	},

	{
		accessorKey: 'tierName',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Tier Name',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true
	},
	{
		accessorKey: 'refferedUserName',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Refferred User Name',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return renderComponent(DataTableLinks, {
				id: row.original.referredUserId,
				name: row.original.referredUserName,
				link: '/dashboard/users'
			});
		}
	},

	{
		accessorKey: 'refferedUserEmail',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Refferred User Name',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return renderComponent(Copy, {
				data: row.original.referredUserEmail
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
		sortable: false,
		cell: ({ row }) => {
			return row.original.createdAt ? formatDate(row.original.createdAt) : '—';
		}
	}
];

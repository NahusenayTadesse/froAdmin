import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
import BigText from '$lib/components/Table/bigText.svelte';
import Statuses from '$lib/components/Table/statuses.svelte';
import DataTableLinks from '$lib/components/Table/data-table-links.svelte';
import { formatDate } from '$lib/global.svelte';

export const columns = [
	{
		accessorKey: 'index',
		header: '#',
		cell: (info) => info.row.index + 1,
		sortable: false
	},
	{
		accessorKey: 'type',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Type',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true
	},
	{
		accessorKey: 'amount',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Amount',
				onclick: column.getToggleSortingHandler()
			}),
		cell: (info) => `$${info.getValue() ?? '0'}`
	},

	{
		accessorKey: 'createdAt',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Created At',
				onclick: column.getToggleSortingHandler()
			}),
		cell: (info) => formatDate(new Date(info.getValue()))
	},

	{
		accessorKey: 'bookingStatus',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Booking Status',
				onclick: column.getToggleSortingHandler()
			}),
		cell: (info) => renderComponent(Statuses, { status: info.getValue() })
	}
];

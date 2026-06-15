import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
import BigText from '$lib/components/Table/bigText.svelte';
import Statuses from '$lib/components/Table/statuses.svelte';
import DataTableLinks from '$lib/components/Table/data-table-links.svelte';
import { formatDate } from '$lib/global.svelte';
import { Eye, Link } from '@lucide/svelte';

export const columns = [
	{
		accessorKey: 'index',
		header: '#',
		cell: (info) => info.row.index + 1,
		sortable: false
	},
	{
		accessorKey: 'id',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Booking Details',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return renderComponent(DataTableLinks, {
				id: row.original.id,
				name: 'View Details',
				link: '/dashboard/bookings/single',
				IconComp: Link
			});
		}
	},
	{
		accessorKey: 'providerName',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Provider',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return renderComponent(DataTableLinks, {
				id: row.original.providerId,
				name: row.original.providerName,
				link: '/dashboard/vendor'
			});
		}
	},
	{
		accessorKey: 'customerName',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Customer',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return renderComponent(DataTableLinks, {
				id: row.original.customerId,
				name: row.original.customerName,
				link: '/dashboard/users'
			});
		}
	},
	{
		accessorKey: 'serviceName',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Service Name',
				onclick: column.getToggleSortingHandler()
			}),

		cell: ({ row }) => {
			return renderComponent(DataTableLinks, {
				id: row.original.serviceId,
				name: row.original.serviceName,
				link: '/dashboard/services'
			});
		}
	},
	{
		accessorKey: 'scheduledDate',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Scheduled Date',
				onclick: column.getToggleSortingHandler()
			}),
		cell: (info) => formatDate(new Date(info.getValue()))
	},
	{
		accessorKey: 'totalPrice',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Total Price',
				onclick: column.getToggleSortingHandler()
			}),
		cell: (info) => `$${info.getValue() ?? '0'}`
	},
	{
		accessorKey: 'bookingStatus',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Booking Status',
				onclick: column.getToggleSortingHandler()
			}),
		cell: (info) => renderComponent(Statuses, { status: info.getValue() })
	},
	{
		accessorKey: 'paymentStatus',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Payment Status',
				onclick: column.getToggleSortingHandler()
			}),
		cell: (info) => renderComponent(Statuses, { status: info.getValue() })
	},
	{
		accessorKey: 'address',
		header: 'Address',
		cell: (info) => renderComponent(BigText, { text: info.getValue() || 'N/A' })
	},
	{
		accessorKey: 'notesFromCustomer',
		header: 'Notes',
		cell: (info) => renderComponent(BigText, { text: info.getValue() || '' })
	},
	{
		accessorKey: 'createdAt',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Created At',
				onclick: column.getToggleSortingHandler()
			}),
		cell: (info) => formatDate(new Date(info.getValue())),
		sortable: true
	}
];

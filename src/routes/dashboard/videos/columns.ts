import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DataTableLinks from '$lib/components/Table/data-table-links.svelte';
import Copy from '$lib/Copy.svelte';
import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
import { formatDate } from '$lib/global.svelte';
import Statuses from '$lib/components/Table/statuses.svelte';
import Address from '$lib/components/Table/address.svelte';
import BigText from '$lib/components/Table/bigText.svelte';
import VideoViewer from '$lib/components/Table/videoViewer.svelte';

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
		id: 'videoTitle',
		accessorKey: 'title',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Video',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			// You can pass whatever you need from `row.original` to the component
			return renderComponent(VideoViewer, {
				src: row.original.url,
				label: row.original.title,
				poster: row.original.thumbnail
			});
		}
	},

	{
		accessorKey: 'title',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Title',
				onclick: column.getToggleSortingHandler()
			}),
		cell: (info) => renderComponent(BigText, { text: info.getValue() })
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
		accessorKey: 'description',
		header: 'Description',
		cell: (info) => renderComponent(BigText, { text: info.getValue() })
	},
	{
		accessorKey: 'verificationState',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Verification',
				onclick: column.getToggleSortingHandler()
			}),
		// Using Statuses component for the string-based enum
		cell: (info) =>
			renderComponent(Statuses, { status: info.getValue() ? 'Verified' : 'Unverified' })
	},
	{
		accessorKey: 'isDiscoverable',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Discoverable',
				onclick: column.getToggleSortingHandler()
			}),
		// Passing the boolean directly to the status prop
		cell: (info) =>
			renderComponent(Statuses, { status: info.getValue() ? 'Discoverable' : 'Not Discoverable' })
	},
	{
		accessorKey: 'complianceReviewed',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Compliance',
				onclick: column.getToggleSortingHandler()
			}),
		cell: (info) =>
			renderComponent(Statuses, { status: info.getValue() ? 'Reviewed' : 'Unreviewed' })
	},
	{
		accessorKey: 'createdAt',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Created At',
				onclick: column.getToggleSortingHandler()
			}),
		cell: (info) => formatDate(info.getValue())
	}
];

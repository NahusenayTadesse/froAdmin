import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
import BigText from '$lib/components/Table/bigText.svelte';
import Statuses from '$lib/components/Table/statuses.svelte';
import Rating from '$lib/components/Table/rating.svelte';
import { formatDate } from '$lib/global.svelte.js';

export const columns = [
	{
		accessorKey: 'index',
		header: '#',
		cell: (info) => info.row.index + 1,
		sortable: false
	},

	{
		accessorKey: 'title',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Title',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true
	},

	{
		accessorKey: 'categoryName',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Category',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true
	},
	{
		accessorKey: 'shortDescription',
		header: 'Short Description',
		cell: ({ row }) => {
			return renderComponent(BigText, {
				text: row.original.shortDescription
			});
		}
	},
	{
		accessorKey: 'fullDescription',
		header: 'Full Description',
		cell: ({ row }) => {
			return renderComponent(BigText, {
				text: row.original.shortDescription
			});
		}
	},
	{
		accessorKey: 'basePrice',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Base Price',
				onclick: column.getToggleSortingHandler()
			}),
		cell: ({ row }) => {
			return '$' + row.original.basePrice;
		}
	},
	{
		accessorKey: 'pricingType',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Pricing Type',
				onclick: column.getToggleSortingHandler()
			})
	},

	{
		accessorKey: 'locationType',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Location Type',
				onclick: column.getToggleSortingHandler()
			})
	},

	{
		accessorKey: 'serviceRadiusKm',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Service Radius (km)',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return row.original.serviceRadiusKm ? row.original.serviceRadiusKm + ' KMs' : 'N/A';
		}
	},
	{
		accessorKey: 'estimatedDurationMinutes',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Estimated Duration (minutes)',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return row.original.estimatedDurationMinutes + ' minutes';
		}
	},

	{
		accessorKey: 'minBookingNoticeHours',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Min Booking Notice(hours)',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return row.original.minBookingNoticeHours === 1
				? '1 hour'
				: row.original.minBookingNoticeHours + ' hours';
		}
	},
	{
		accessorKey: 'maxDailyBookings',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Max Daily Bookings',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return row.original.maxDailyBookings + ' bookings';
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
		accessorKey: 'averageRating',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Average Rating',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return renderComponent(Rating, {
				value: row.original.averageRating
			});
		}
	},

	{
		accessorKey: 'ratingCount',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Rating Count',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return row.original.ratingCount + ' ratings';
		}
	},
	{
		accessorKey: 'priceMin',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Min Price',
				onclick: column.getToggleSortingHandler()
			}),
		cell: ({ row }) => {
			return '$' + row.original.priceMin;
		}
	},
	{
		accessorKey: 'priceMax',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Max Price',
				onclick: column.getToggleSortingHandler()
			}),
		cell: ({ row }) => {
			return '$' + row.original.priceMax;
		}
	},
	{
		accessorKey: 'bookingEnabled',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Booking Enabled',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return renderComponent(Statuses, {
				status: row.original.bookingEnabled ? 'Yes' : 'No'
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

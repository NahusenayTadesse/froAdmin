import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
import BigText from '$lib/components/Table/bigText.svelte';
import Statuses from '$lib/components/Table/statuses.svelte';
import DataTableLinks from '$lib/components/Table/data-table-links.svelte';
import { formatDate } from '$lib/global.svelte.js';

export const columns = [
	{
		accessorKey: 'index',
		header: '#',
		cell: (info) => info.row.index + 1,
		sortable: false
	},

	// --- Code & Identity Info ---
	{
		accessorKey: 'activeCode',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Affiliate Code',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return renderComponent(DataTableLinks, {
				id: row.original.affiliateUserId,
				name: row.original.activeCode,
				link: '/dashboard/affiliate/single'
			});
		}
	},
	{
		accessorKey: 'isCodeActive',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Code Status',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return renderComponent(Statuses, {
				status: row.original.isCodeActive ? 'Active' : 'Inactive'
			});
		}
	},

	// --- Lifetime Performance Metrics ---
	{
		accessorKey: 'lifetimeGrossEarned',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Gross Earned',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => `$${row.original.lifetimeGrossEarned}`
	},
	{
		accessorKey: 'lifetimePaidOut',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Lifetime Paid',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => `$${row.original.lifetimePaidOut}`
	},

	// --- Current Balance Metrics ---
	{
		accessorKey: 'payableAmount',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Available (Payable)',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => `$${row.original.payableAmount}`
	},
	{
		accessorKey: 'pendingHoldAmount',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Escrow Hold',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => `$${row.original.pendingHoldAmount}`
	},

	// --- Volume / Conversion Stats ---
	{
		accessorKey: 'totalReferralEventsCount',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Total Conversions',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true
	},
	{
		accessorKey: 'uniqueReferredUsersCount',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Referred Customers',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true
	},

	// --- Recent Automated Batch Activity ---
	{
		accessorKey: 'lastBatchNet',
		header: 'Last Payout (Net)',
		sortable: false,
		cell: ({ row }) => {
			return row.original.lastBatchId ? `$${row.original.lastBatchNet}` : '—';
		}
	},
	{
		accessorKey: 'lastBatchStatus',
		header: 'Last Batch Status',
		sortable: false,
		cell: ({ row }) => {
			if (!row.original.lastBatchStatus) return 'No Activity';
			// Capitalizes your raw enum string status values ('locked', 'credited', 'skipped')
			const label =
				row.original.lastBatchStatus.charAt(0).toUpperCase() +
				row.original.lastBatchStatus.slice(1);
			return renderComponent(Statuses, { status: label });
		}
	},

	// --- Latest Withdrawal Request Status ---
	{
		accessorKey: 'latestWithdrawalAmount',
		header: 'Recent Req. Amt',
		sortable: false,
		cell: ({ row }) => {
			return row.original.latestWithdrawalAmount ? `$${row.original.latestWithdrawalAmount}` : '—';
		}
	},
	{
		accessorKey: 'latestWithdrawalStatus',
		header: 'Req. Status',
		sortable: false,
		cell: ({ row }) => {
			if (!row.original.latestWithdrawalStatus) return 'None';
			// Capitalizes requested, processing, paid, failed, or canceled
			const label =
				row.original.latestWithdrawalStatus.charAt(0).toUpperCase() +
				row.original.latestWithdrawalStatus.slice(1);
			return renderComponent(Statuses, { status: label });
		}
	},
	{
		accessorKey: 'latestWithdrawalFailure',
		header: 'Reason / Notes',
		sortable: false,
		cell: ({ row }) => {
			const textValue =
				row.original.latestWithdrawalFailure ||
				(row.original.latestWithdrawalDate
					? `Requested on ${formatDate(row.original.latestWithdrawalDate)}`
					: '—');

			return renderComponent(BigText, { text: textValue });
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

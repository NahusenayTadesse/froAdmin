import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
import BigText from '$lib/components/Table/bigText.svelte';
import Statuses from '$lib/components/Table/statuses.svelte';
import DataTableLinks from '$lib/components/Table/data-table-links.svelte';
import { formatDate } from '$lib/global.svelte.js';

export const columns = [
	// 1. Row Index Counter
	{
		accessorKey: 'index',
		header: '#',
		cell: (info) => info.row.index + 1,
		sortable: false
	},

	// 2. Main Salesperson Identifier Link
	{
		accessorKey: 'id',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Sales Rep Profile',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			// Pulls the first active marketing code if one exists, otherwise falls back to ID
			const primaryDisplay = row.original.activeCodes?.[0] || `Rep: ${row.original.id.slice(0, 8)}`;
			return renderComponent(DataTableLinks, {
				id: row.original.id,
				name: primaryDisplay,
				link: `/dashboard/sales/single`
			});
		}
	},

	// 3. System Level Account Status
	{
		accessorKey: 'status',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Account Status',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			const label = row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1);
			return renderComponent(Statuses, { status: label });
		}
	},

	// 4. Current Commission Tier
	{
		accessorKey: 'tierName',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Current Tier',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			if (!row.original.tierName) return 'No Tier Assigned';
			return `${row.original.tierName} ($${row.original.tierRate}/user)`;
		}
	},

	// 5. Volume Metrics (Macro vs Micro)
	{
		accessorKey: 'totalSignups',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Total / 30d Signups',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return `${row.original.totalSignups} (${row.original.recentSignups30Days}d)`;
		}
	},

	// 6. Financial Ledger: Available Balance
	{
		accessorKey: 'availableBalance',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Available Bal.',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return renderComponent(BigText, {
				text: `$${Number(row.original.availableBalance).toFixed(2)}`
			});
		}
	},

	// 7. Financial Ledger: Hold / Escrow
	{
		accessorKey: 'pendingEarnings',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Pending Hold',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return renderComponent(BigText, {
				text: `$${Number(row.original.pendingEarnings).toFixed(2)}`
			});
		}
	},

	// 8. Creation Timestamp
	{
		accessorKey: 'createdAt',
		header: ({ column }) =>
			renderComponent(DataTableSort, {
				name: 'Joined Date',
				onclick: column.getToggleSortingHandler()
			}),
		sortable: true,
		cell: ({ row }) => {
			return formatDate(new Date(row.original.createdAt));
		}
	}
];

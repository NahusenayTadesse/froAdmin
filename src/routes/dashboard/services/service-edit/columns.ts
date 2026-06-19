// src/routes/dashboard/admin-panel/service-edits/columns.ts
import { renderComponent } from '$lib/components/ui/data-table/index.js';
import DataTableSort from '$lib/components/Table/data-table-sort.svelte';
import Statuses from '$lib/components/Table/statuses.svelte';
import ReviewSheetAction from './review-sheet-action.svelte';
import { formatDate } from '$lib/global.svelte.js';

export function getColumns(reviewForm: any) {
	return [
		{
			accessorKey: 'index',
			header: '#',
			cell: (info: any) => info.row.index + 1,
			sortable: false
		},
		{
			accessorKey: 'service_title',
			header: ({ column }: any) =>
				renderComponent(DataTableSort, {
					name: 'Service / Provider',
					onclick: column.getToggleSortingHandler()
				}),
			sortable: true,
			cell: ({ row }: any) => {
				return renderComponent(ReviewSheetAction, {
					requestId: row.original.id,
					serviceTitle: row.original.service_title,
					providerName: row.original.provider_name,
					providerNote: row.original.provider_note,
					status: row.original.status,
					changeType: row.original.change_type,
					requestedFields: row.original.requested_fields,
					beforeSnapshot: row.original.before_snapshot,
					pendingSnapshot: row.original.pending_snapshot,
					reviewForm
				});
			}
		},
		{
			accessorKey: 'status',
			header: 'Review State',
			cell: ({ row }: any) => {
				const stateMap: Record<string, string> = {
					pending: 'Pending',
					approved: 'Approved',
					rejected: 'Rejected'
				};
				return renderComponent(Statuses, {
					status: stateMap[row.original.status] || row.original.status
				});
			}
		},
		{
			accessorKey: 'change_type',
			header: 'Change Type',
			cell: ({ row }: any) => {
				const labelMap: Record<string, string> = {
					initial_review: 'New Service Listing',
					edit_review: 'Profile Parameter Update',
					admin_suspension: 'System Forced Freeze',
					reactivation: 'Provider Reactivation Request'
				};
				return labelMap[row.original.change_type] || row.original.change_type;
			}
		},
		{
			accessorKey: 'requested_at',
			header: 'Submitted At',
			cell: ({ row }: any) => {
				return formatDate(row.original.requested_at);
			}
		}
	];
}

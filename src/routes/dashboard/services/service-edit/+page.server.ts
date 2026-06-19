// src/routes/dashboard/admin-panel/service-edits/+page.server.ts
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

import { reviewSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';

function getStringParam(url: URL, key: string, fallback = '') {
	return url.searchParams.get(key)?.trim() ?? fallback;
}

export const load: PageServerLoad = async ({ url, locals }) => {
	const reviewForm = await superValidate(zod4(reviewSchema));

	// 4. Extract incoming "Super Filter" matrix options from the URL
	const search = getStringParam(url, 'search').toLowerCase();
	const statusFilter = getStringParam(url, 'status', 'pending'); // Defaults directly to active pending tasks
	const changeType = getStringParam(url, 'changeType');

	// 5. Query the Staging Snapshot Queue RPC
	const selectedStatus = statusFilter === 'all' ? null : statusFilter;
	const { data: queueData, error: queueError } = await locals.supabase.rpc(
		'rpc_admin_service_edit_queue',
		{
			p_status: selectedStatus,
			p_limit: 150,
			p_offset: 0
		}
	);

	if (queueError) {
		return {
			reviewForm,
			allData: [],
			query: { search, statusFilter, changeType },
			error: queueError.message
		};
	}

	let allData = (queueData ?? []) as any[];

	// 6. Execute Text Filtering on the Staging Snapshots Array
	if (search) {
		allData = allData.filter((row) => {
			const titleMatch = row.service_title?.toLowerCase().includes(search);
			const providerMatch = row.provider_name?.toLowerCase().includes(search);
			const noteMatch = row.provider_note?.toLowerCase().includes(search);
			return titleMatch || providerMatch || noteMatch;
		});
	}

	// 7. Execute Structural Type Classification Filtering
	if (changeType) {
		allData = allData.filter((row) => row.change_type === changeType);
	}

	return {
		reviewForm,
		allData,
		query: {
			search,
			statusFilter,
			changeType
		}
	};
};

export const actions: Actions = {
	review: async ({ request, locals }) => {
		// Validate incoming form submission values against our Zod schema
		const form = await superValidate(request, zod4(reviewSchema));

		if (!form.valid) {
			return message(form, {
				type: 'error',
				text: 'Please check the form for errors and try again.'
			});
		}

		const { requestId, action, adminNote } = form.data;

		// Dispatch variables directly to our audited multi-state review function
		const { error } = await locals.supabase.rpc('rpc_review_service_edit_v2', {
			p_edit_request_id: requestId,
			p_action: action,
			p_admin_note: adminNote || null
		});

		if (error) {
			// Surface any internal safety exceptions (e.g., 'Edit request is not pending')
			return message(form, { type: 'error', text: error.message });
		}

		return message(form, {
			type: 'success',
			text: `Review submitted. Status successfully updated to: ${action.replace('_', ' ')}`
		});
	}
};

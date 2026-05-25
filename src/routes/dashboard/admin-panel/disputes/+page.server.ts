import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

// ─── Status sets ───────────────────────────────────────────────────────────────
const OPEN_STATUSES = new Set([
	'submitted',
	'triaged',
	'investigating',
	'awaiting_parties',
	'escalated'
]);

const DONE_STATUSES = new Set(['resolved', 'rejected', 'closed']);

// ─── View-based type buckets ───────────────────────────────────────────────────
const DISPUTE_TYPES = new Set(['booking_dispute', 'payment_dispute', 'dispute']);
const REPORT_TYPES = new Set(['user_abuse', 'safety_incident', 'support']);

// ─── Severity sort order (higher = more urgent) ────────────────────────────────
const SEVERITY_ORDER: Record<string, number> = {
	critical: 4,
	high: 3,
	medium: 2,
	low: 1
};

// 48 hours in ms — cases open longer than this are flagged as stale
const STALE_THRESHOLD_MS = 48 * 60 * 60 * 1000;

// ─── Types ─────────────────────────────────────────────────────────────────────
type ReportCase = {
	id: string;
	type: string;
	status: string;
	severity: string;
	priority: string;
	subject: string | null;
	description: string;
	booking_id: string | null;
	refund_status: string;
	admin_owner_id: string | null;
	reporter_id: string;
	reported_user_id: string | null;
	created_at: string;
	last_message_preview?: string | null;
	last_message_at?: string | null;
	resolved_at: string | null;
	resolution_summary: string | null;
};

type CaseEvent = {
	event_type?: string;
	type?: string;
	note?: string;
	created_at?: string;
	actor_id?: string;
};

type CaseDetails = {
	events?: CaseEvent[];
	actions?: CaseEvent[];
	[key: string]: unknown;
};

type CaseConversation = {
	messages?: {
		id?: string;
		body: string;
		sender_role: string;
		created_at?: string;
	}[];
	[key: string]: unknown;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const normalize = (value: unknown) => (value ?? '').toString().trim();

const buildQueryString = (params: URLSearchParams) => {
	const query = params.toString();
	return query ? `?${query}` : '';
};

function sortBySeverityThenAge(a: ReportCase, b: ReportCase): number {
	const sevDiff =
		(SEVERITY_ORDER[b.severity?.toLowerCase()] ?? 0) -
		(SEVERITY_ORDER[a.severity?.toLowerCase()] ?? 0);
	if (sevDiff !== 0) return sevDiff;
	// Older cases surface first (waiting longest)
	return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

// ─── Loader ────────────────────────────────────────────────────────────────────
export const load: PageServerLoad = async ({ locals, url }) => {
	const {
		data: { user },
		error: userError
	} = await locals.supabase.auth.getUser();

	if (userError || !user) {
		throw redirect(303, '/login');
	}

	// View controls which type bucket is shown in the queue
	const view = normalize(url.searchParams.get('view')) || 'triage';

	// Standard filters (applied on top of view)
	const status = normalize(url.searchParams.get('status')) || 'all';
	const severity = normalize(url.searchParams.get('severity')) || 'all';
	const q = normalize(url.searchParams.get('q')).toLowerCase();

	// Flash message from a previous redirect (e.g. after update/send)
	const flash = normalize(url.searchParams.get('flash')) || null;

	// Always load without type filter — view-based type filtering is done in-memory
	// so we can compute cross-view stats from the same payload
	const { data: listRaw, error: listError } = await locals.supabase.rpc(
		'admin_list_report_cases',
		{
			p_status: status === 'all' || status === 'open' || status === 'closed' ? null : status,
			p_type: null,
			p_severity: severity === 'all' ? null : severity,
			p_limit: 200,
			p_offset: 0
		}
	);

	const errorReturn = {
		view,
		flash,
		filters: { status, severity, q },
		cases: [] as ReportCase[],
		staleIds: [] as string[],
		selectedCaseId: null as string | null,
		selectedCase: null as ReportCase | null,
		selectedDetails: null as CaseDetails | null,
		selectedConversation: null as CaseConversation | null,
		error: listError?.message ?? null,
		stats: {
			openCount: 0,
			openDisputes: 0,
			openReports: 0,
			pendingRefunds: 0,
			unassignedCount: 0
		}
	};

	if (listError) return errorReturn;

	const listedCases = (listRaw as ReportCase[] | null) ?? [];
	const caseIds = listedCases.map((c) => c.id);
	let threadByCaseId = new Map<string, { last_message_preview: string | null; last_message_at: string | null }>();
	if (caseIds.length > 0) {
		const { data: threadRows } = await locals.supabase
			.from('report_case_threads')
			.select('case_id,last_message_preview,last_message_at')
			.in('case_id', caseIds);
		threadByCaseId = new Map(
			(
				(threadRows as
					| { case_id: string; last_message_preview: string | null; last_message_at: string | null }[]
					| null) ?? []
			).map((row) => [
				row.case_id,
				{
					last_message_preview: row.last_message_preview,
					last_message_at: row.last_message_at
				}
			])
		);
	}
	const allCases = listedCases.map((c) => ({ ...c, ...(threadByCaseId.get(c.id) ?? {}) }));

	// ── Step 1: search filter (applied across all views) ──────────────────────
	let cases = allCases.filter((c) => {
		if (!q) return true;
		const haystack =
			`${c.id} ${c.subject ?? ''} ${c.description ?? ''} ${c.reporter_id}`.toLowerCase();
		return haystack.includes(q);
	});

	// ── Step 2: status filter ─────────────────────────────────────────────────
	cases = cases.filter((c) => {
		const s = (c.status ?? '').toLowerCase();
		if (status === 'open') return OPEN_STATUSES.has(s);
		if (status === 'closed') return DONE_STATUSES.has(s);
		return true;
	});

	// ── Step 3: view filter ───────────────────────────────────────────────────
	switch (view) {
		case 'triage':
			// Unassigned + open — the inbox admins should clear first
			cases = cases.filter(
				(c) => OPEN_STATUSES.has((c.status ?? '').toLowerCase()) && !c.admin_owner_id
			);
			break;
		case 'disputes':
			cases = cases.filter((c) => DISPUTE_TYPES.has((c.type ?? '').toLowerCase()));
			break;
		case 'reports':
			cases = cases.filter((c) => REPORT_TYPES.has((c.type ?? '').toLowerCase()));
			break;
		case 'refunds':
			cases = cases.filter((c) =>
				['requested', 'under_review'].includes((c.refund_status ?? '').toLowerCase())
			);
			break;
		// 'all' — no additional filter
	}

	// ── Step 4: sort by severity desc, then age asc ───────────────────────────
	cases = [...cases].sort(sortBySeverityThenAge);

	// ── Step 5: mark stale open cases (open > 48 h) ───────────────────────────
	const now = Date.now();
	const staleIds = cases
		.filter(
			(c) =>
				OPEN_STATUSES.has((c.status ?? '').toLowerCase()) &&
				now - new Date(c.created_at).getTime() > STALE_THRESHOLD_MS
		)
		.map((c) => c.id);

	// ── Step 6: selection — fall back to first in view if requested ID absent ──
	const requestedCaseId = normalize(url.searchParams.get('caseId'));
	const caseInView = requestedCaseId ? cases.find((c) => c.id === requestedCaseId) : null;
	const selectedCaseId = caseInView?.id ?? (cases.length > 0 ? cases[0].id : null);
	const selectedCase = cases.find((c) => c.id === selectedCaseId) ?? null;

	// ── Step 7: load details + conversation for selected case ─────────────────
	let selectedDetails: CaseDetails | null = null;
	let selectedConversation: CaseConversation | null = null;

	if (selectedCaseId) {
		const [{ data: detailsData }, { data: conversationData }] = await Promise.all([
			locals.supabase.rpc('get_report_case_details', { p_case_id: selectedCaseId }),
			locals.supabase.rpc('get_report_case_conversation', { p_case_id: selectedCaseId })
		]);
		selectedDetails = (detailsData as CaseDetails | null) ?? null;
		selectedConversation = (conversationData as CaseConversation | null) ?? null;
	}

	// ── Step 8: stats computed from all cases (not view-filtered) for nav badges
	const openCases = allCases.filter((c) => OPEN_STATUSES.has((c.status ?? '').toLowerCase()));
	const stats = {
		openCount: openCases.length,
		openDisputes: openCases.filter((c) => DISPUTE_TYPES.has((c.type ?? '').toLowerCase())).length,
		openReports: openCases.filter((c) => REPORT_TYPES.has((c.type ?? '').toLowerCase())).length,
		pendingRefunds: allCases.filter((c) =>
			['requested', 'under_review'].includes((c.refund_status ?? '').toLowerCase())
		).length,
		unassignedCount: openCases.filter((c) => !c.admin_owner_id).length
	};

	return {
		view,
		flash,
		filters: { status, severity, q },
		cases,
		staleIds,
		selectedCaseId,
		selectedCase,
		selectedDetails,
		selectedConversation,
		error: null,
		stats
	};
};

// ─── Actions ───────────────────────────────────────────────────────────────────
export const actions: Actions = {
	updateCase: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const caseId = normalize(formData.get('caseId'));
		const status = normalize(formData.get('status')) || null;
		const refundStatus = normalize(formData.get('refundStatus')) || null;
		const resolutionSummary = normalize(formData.get('resolutionSummary')) || null;
		const actionNote = normalize(formData.get('actionNote')) || null;

		if (!caseId) {
			return fail(400, { updateError: 'Case ID is required.' });
		}

		const { error } = await locals.supabase.rpc('admin_update_report_case', {
			p_case_id: caseId,
			p_status: status,
			p_action_type: status,
			p_action_note: actionNote,
			p_refund_status: refundStatus,
			p_resolution_summary: resolutionSummary
		});

		if (error) {
			return fail(500, { updateError: error.message });
		}

		return { ok: true, updateSuccess: true, caseId };
	},

	sendMessage: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const caseId = normalize(formData.get('caseId'));
		const body = normalize(formData.get('body'));

		if (!caseId) {
			return fail(400, { messageError: 'Case ID is required.' });
		}
		if (!body) {
			return fail(400, { messageError: 'Message cannot be empty.' });
		}

		const { error } = await locals.supabase.rpc('send_report_case_message', {
			p_case_id: caseId,
			p_body: body
		});

		if (error) {
			return fail(500, { messageError: error.message });
		}

		return { ok: true, messageSent: true, caseId, body };
	}
};
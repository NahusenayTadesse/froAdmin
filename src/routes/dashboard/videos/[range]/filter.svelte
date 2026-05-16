<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	// Svelte 5 style data prop destructuring
	let { data, start, end }: { data: any[{ verificationState }]; start: string; end: string } =
		$props();

	// Read current search parameter values dynamically from the SvelteKit page state
	let currentDiscoverable = $derived(page.url.searchParams.get('isDiscoverable') ?? '');
	let currentCompliance = $derived(page.url.searchParams.get('complianceReview') ?? '');
	let currentVerification = $derived(page.url.searchParams.get('verificationStates') ?? '');

	/**
	 * Updates a single query parameter while preserving the rest of the URL state.
	 * If the value is empty, it removes the key entirely from the URL.
	 */
	function updateFilter(key: string, value: string) {
		const newUrl = new URL(page.url);

		if (value) {
			newUrl.searchParams.set(key, value);
		} else {
			newUrl.searchParams.delete(key);
		}

		// 'keepfocus' prevents input jumps; 'replaceState' avoids bloated browser history
		goto(newUrl, { keepFocus: true, replaceState: true });
	}

	// Quick reset helper
	function clearFilters() {
		goto(page.url.pathname);
	}

	import DateMonth from '$lib/formComponents/DateMonth.svelte';
</script>

<div class="filter-container">
	<h2>Video Dashboard</h2>

	<!-- Filter Controls -->
	<div class="controls-grid">
		<DateMonth {start} {end} link="/dashboard/videos" />
		<!-- 1. Is Discoverable (Boolean Dropdown) -->
		<div class="control-group">
			<label for="discoverable">Discoverable Status</label>
			<select
				id="discoverable"
				value={currentDiscoverable}
				onchange={(e) => updateFilter('isDiscoverable', e.currentTarget.value)}
			>
				<option value="">All statuses</option>
				<option value="true">Discoverable Only</option>
				<option value="false">Hidden Only</option>
			</select>
		</div>

		<!-- 2. Compliance Review (Boolean Dropdown) -->
		<div class="control-group">
			<label for="compliance">Compliance Review</label>
			<select
				id="compliance"
				value={currentCompliance}
				onchange={(e) => updateFilter('complianceReview', e.currentTarget.value)}
			>
				<option value="">All reviews</option>
				<option value="true">Passed Compliance</option>
				<option value="false">Failed/Pending Compliance</option>
			</select>
		</div>

		<!-- 3. Verification State (Text/Enum Dropdown populated from your selectDistinct DB query) -->
		<div class="control-group">
			<label for="verification">Verification State</label>
			<select
				id="verification"
				value={currentVerification}
				onchange={(e) => updateFilter('verificationStates', e.currentTarget.value)}
			>
				<option value="">All verification states</option>
				{#each data as state (state)}
					{#if state !== null}
						<option value={state.state}>{state.state}</option>
					{/if}
				{/each}
			</select>
		</div>
	</div>
</div>

<style>
	.filter-container {
		font-family: sans-serif;
		padding: 1.5rem;
		max-width: 1200px;
		margin: 0 auto;
	}
	.controls-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
		align-items: flex-end;
	}
	.control-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	label {
		font-size: 0.85rem;
		font-weight: 600;
		color: #4a5568;
	}
	select,
	button {
		padding: 0.5rem;
		border: 1px solid #cbd5e1;
		border-radius: 4px;
		font-size: 0.95rem;
		background: #fff;
	}
	hr {
		border: 0;
		height: 1px;
		background: #e2e8f0;
		margin: 2rem 0;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
	}
	th,
	td {
		padding: 0.75rem;
		border-bottom: 1px solid #e2e8f0;
	}
	th {
		background-color: #f8fafc;
		color: #64748b;
	}
	.no-results {
		color: #64748b;
		text-align: center;
		padding: 2rem;
	}
	.badge {
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.8rem;
		font-weight: bold;
	}
	.badge.yes {
		background: #dcfce7;
		color: #166534;
	}
	.badge.no {
		background: #fee2e2;
		color: #991b1b;
	}
	.badge.state {
		background: #f1f5f9;
		color: #334155;
		text-transform: uppercase;
	}
</style>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state'; // Use Svelte 5's $app/state or page store for SvelteKit 1/2
	import VideoFilter from './video-filters.svelte'; // Name of your component

	// Interface matching your component's FilterValues
	interface FilterValues {
		isDiscoverable: string;
		complianceReview: string;
		verificationStates: string;
		dateRange: { start: any; end: any };
	}

	let { data, start, end }: { data: any[{ verificationState }]; start: any; end: any } = $props();
	const handleFilterChange = (filters: FilterValues) => {
		// 1. Instantiate URLSearchParams using current page URL to preserve other potential parameters
		const searchParams = new URLSearchParams(page.url.searchParams);

		// 2. Map date values into pure ISO strings (YYYY-MM-DD) expected by standard Date constructors
		if (filters.dateRange?.start) {
			searchParams.set('start', filters.dateRange.start.toString());
		}
		if (filters.dateRange?.end) {
			searchParams.set('end', filters.dateRange.end.toString());
		}

		// 3. Conditionally append or scrub select values to prevent cluttering backend strings
		if (filters.isDiscoverable) {
			searchParams.set('isDiscoverable', filters.isDiscoverable);
		} else {
			searchParams.delete('isDiscoverable');
		}

		if (filters.complianceReview) {
			searchParams.set('complianceReview', filters.complianceReview);
		} else {
			searchParams.delete('complianceReview');
		}

		if (filters.verificationStates) {
			searchParams.set('verificationStates', filters.verificationStates);
		} else {
			searchParams.delete('verificationStates');
		}

		// 4. Update the URL reactively.
		// keepFocus prevents inputs from dropping focus state; invalidateAll forces the load function to execute.
		goto(`?${searchParams.toString()}`, {
			keepFocus: true,
			invalidateAll: true,
			noScroll: true
		});
	};
</script>

<VideoFilter {start} {end} verificationStates={data} onFilterChange={handleFilterChange} />

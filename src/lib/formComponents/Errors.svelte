<script>
	let { allErrors } = $props();
	import { CircleAlert } from '@lucide/svelte';
	import { pluralize } from '$lib/hooks/pluralize';
</script>

{#if allErrors.length}
	<div
		role="alert"
		aria-live="assertive"
		class="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-800"
	>
		<div class="flex items-center justify-between">
			<strong class="text-sm font-semibold">Please fix the following</strong>
		</div>

		<ul class="mt-2 ml-4 list-inside list-disc space-y-1 text-sm">
			{#each allErrors as error (error)}
				<li class="flex items-center gap-2 capitalize">
					<CircleAlert />
					{pluralize(error.path).replace(/([a-z])([A-Z])/g, '$1 $2')}: {error.messages}
				</li>
			{/each}
		</ul>
	</div>
{/if}

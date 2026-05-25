<script lang="ts">
	import { Star, StarHalf } from '@lucide/svelte';
	import { cn } from '$lib/utils'; // Standard shadcn utility

	let { value = 0, max = 5, size = 20, class: className = '' } = $props();

	// Create an array for the total number of stars
	const stars = $derived(Array.from({ length: max }, (_, i) => i + 1));
</script>

<div class={cn('flex items-center gap-1', className)}>
	{#each stars as star (star)}
		<div class="relative inline-block" style="width: {size}px; height: {size}px;">
			<Star {size} class="fill-transparent text-muted-foreground/30" />

			<div
				class="absolute inset-0 overflow-hidden fill-primary text-primary"
				style="width: {Math.max(0, Math.min(100, (value - star + 1) * 100))}%"
			>
				<Star {size} class="fill-current" />
			</div>
		</div>
	{/each}

	{#if value > 0}
		<span class="ml-2 text-sm font-medium text-muted-foreground">
			{value.toFixed(1)}
		</span>
	{/if}
</div>

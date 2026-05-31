<script lang="ts">
	import type { Snippet } from "svelte";

	type Props = {
		label: string;
		icon?: Snippet;
		children: Snippet;
	};

	const { label, icon, children }: Props = $props();
</script>

<div class="flex items-start gap-3 py-3">
	{#if icon}
		<div class="text-muted-foreground mt-0.5 shrink-0">
			{@render icon()}
		</div>
	{/if}
	<div class="flex-1 min-w-0">
		<p class="text-xs text-muted-foreground mb-0.5">{label}</p>
		<div class="text-sm font-medium">
			{@render children()}
		</div>
	</div>
</div>

<script>
	import { navigating } from '$app/state';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

	const progress = new Tween(0, {
		duration: 400,
		easing: cubicOut
	});

	$effect(() => {
		if (navigating.to) {
			progress.set(0.8);
		} else {
			progress.set(1, { duration: 200 }).then(() => {
				if (!navigating.to) {
					progress.set(0, { duration: 0 });
				}
			});
		}
	});
</script>

{#if navigating.to}
	<div class="fixed top-0 left-0 z-50 h-1 bg-primary" style:width="{progress.current * 100}%"></div>
{/if}

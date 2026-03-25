<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import './layout.css';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data, children } = $props();
	let { supabase, claims } = $derived(data);
	import { ModeWatcher } from 'mode-watcher';

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((event, _session) => {
			if (_session?.expires_at !== claims?.exp) {
				invalidate('supabase:auth');
			}
		});

		return () => data.subscription.unsubscribe();
	});
	import { Toaster, toast } from 'svelte-sonner';
	import { ProgressBar } from '@prgm/sveltekit-progress-bar';
	import { getFlash } from 'sveltekit-flash-message';
	import { page, updated } from '$app/state';

	const flash = getFlash(page, { clearAfterMs: 5000 });

	$effect(() => {
		if (!$flash) return;
		if (page.data.flash?.type === 'success') toast.success($flash.message);
		if (page.data.flash?.type === 'error') toast.error($flash?.message);
		$flash = undefined;
		if (updated.current) toast.success('A new version is available, please reload the page');
	});
</script>

<svelte:head>
	<title>Fro Admin</title>
</svelte:head>
<ModeWatcher />
<ProgressBar color="#7F57F1" />
<Toaster position="bottom-right" richColors />

{@render children()}

<script>
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient'; // Adjust path to your client

	let { data } = $props();
	const user = data.session?.user;

	// Use a rune to keep the list reactive
	let onlineUsers = $state([]);

	onMount(() => {
		console.log('component loaded');
		console.log('user:', user);
		if (!user) return;

		// 1. Initialize the channel
		const channel = supabase.channel('froadmin', {
			config: {
				presence: {
					key: user.id // Use user ID as the unique key
				}
			}
		});

		// 2. Listen for sync events
		channel
			.on('presence', { event: 'sync' }, () => {
				onlineUsers = Object.values(channel.presenceState()).flat();
			})
			.on('presence', { event: 'join' }, () => {
				// Also update on join, in case sync doesn't re-fire
				onlineUsers = Object.values(channel.presenceState()).flat();
			})
			.subscribe(async (status) => {
				console.log('Channel status:', status);
				if (status === 'SUBSCRIBED') {
					await channel.track({
						id: user.id,
						email: user.email,
						online_at: new Date().toISOString()
					});
				}
			});

		// Cleanup on unmount
		return () => {
			channel.unsubscribe();
		};
	});
</script>

<div class="p-6">
	<h2 class="mb-4 text-xl font-bold">Active Users ({onlineUsers.length})</h2>

	<ul class="space-y-2">
		{#each onlineUsers as presence}
			<li class="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 p-2">
				<span class="h-3 w-3 animate-pulse rounded-full bg-green-500"></span>
				<span class="text-zinc-200">{presence.email}</span>
				<span class="text-xs text-zinc-500"
					>Joined: {new Date(presence.online_at).toLocaleTimeString()}</span
				>
			</li>
		{:else}
			<p class="text-zinc-500">No one else is online...</p>
		{/each}
	</ul>
</div>

<script lang="ts">
	import { columns } from './columns';

	let { data } = $props();

	import DataTable from '$lib/components/Table/data-table.svelte';

	import { Frown, Plus } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';

	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient'; // Adjust path to your client

	const user = $derived(data.session?.user);

	// Use a rune to keep the list reactive
	let onlineUsers = $state([]);
	const onlineIds = $derived(new Set(onlineUsers.map((u) => u.id)));

	let baseList = $derived(
		data?.userList.map((user) => ({
			...user,
			isOnline: onlineIds.has(user.id)
		}))
	);

	let filteredList = $derived(baseList);

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

<svelte:head>
	<title>Users List</title>
</svelte:head>

{#if data.userList.length === 0}
	<div class="flex h-96 w-full flex-col items-center justify-center lg:w-5xl">
		<p class="justify-self-cente mt-4 flex flex-row gap-4 text-center text-4xl">
			<Frown class="h-12 w-16  animate-bounce" />
			Users List is Empty
		</p>
		<Button href="/dashboard/users/add-users"><Plus />Add New Users</Button>
	</div>
{:else}
	<h2 class="my-4 text-2xl">No of Users: {data.userList?.length}</h2>

	<FilterMenu data={data?.userList} bind:filteredList filterKeys={['role', 'status', 'email']} />
	<DataTable data={filteredList} {columns} fileName="Users List" />
{/if}

<script lang="ts">
	import { columns } from './columns';

	let { data } = $props();

	import DataTable from '$lib/components/Table/data-table.svelte';

	import { Frown, Plus } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';
	import Mobile from './mobile.svelte';

	let filteredList = $derived(data?.userList);
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
	</div>
{:else}
	<h2 class="my-4 text-2xl">No of Users: {data.userList?.length}</h2>

	<FilterMenu data={data?.userList} bind:filteredList filterKeys={['role', 'status', 'email']} />
	<Mobile providers={filteredList} />
	<DataTable data={filteredList} {columns} fileName="Users List" />
{/if}

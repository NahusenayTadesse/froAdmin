<script lang="ts">
	import { columns } from './columns';

	let { data } = $props();

	import DataTable from '$lib/components/Table/data-table.svelte';

	import { Frown, Plus } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';

	let filteredList = $derived(data?.salesPersons);
</script>

<svelte:head>
	<title>Sales Persons</title>
</svelte:head>

{#if data.salesPersons.length === 0}
	<div class="flex h-96 w-full flex-col items-center justify-center lg:w-5xl">
		<p class="justify-self-cente mt-4 flex flex-row gap-4 text-center text-4xl">
			<Frown class="h-12 w-16  animate-bounce" />
			Sales Person List is Empty
		</p>
	</div>
{:else}
	<h2 class="my-4 text-2xl">No of Sales Persons: {data.salesPersons?.length}</h2>

	<FilterMenu
		data={data?.salesPersons}
		bind:filteredList
		filterKeys={['status', 'tierName', 'activeCodes', 'id', 'userId']}
	/>
	<!-- <Mobile services={filteredList} /> -->
	<DataTable data={filteredList} {columns} fileName="Users List" />
{/if}

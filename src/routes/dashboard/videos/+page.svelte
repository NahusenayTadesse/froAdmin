<script lang="ts">
	import { columns } from './columns';

	let { data } = $props();

	import DataTable from '$lib/components/Table/data-table.svelte';

	import { Frown, Plus } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';

	let filteredList = $derived(data?.videoList);
</script>

<svelte:head>
	<title>Service Providers</title>
</svelte:head>

{#if data.videoList.length === 0}
	<div class="flex h-96 w-full flex-col items-center justify-center lg:w-5xl">
		<p class="justify-self-cente mt-4 flex flex-row gap-4 text-center text-4xl">
			<Frown class="h-12 w-16  animate-bounce" />
			Service Providers List is Empty
		</p>
	</div>
{:else}
	<h2 class="my-4 text-2xl">No of Service Providers: {data.videoList?.length}</h2>

	<FilterMenu
		data={data?.videoList}
		bind:filteredList
		filterKeys={[
			'providerName',
			'serviceName',
			'complianceReviewed',
			'isDiscoverable',
			'verificationState'
		]}
	/>
	<DataTable data={filteredList} {columns} fileName="VideoList" />
{/if}

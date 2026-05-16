<script lang="ts">
	import { columns } from './columns';

	let { data } = $props();

	import DataTable from '$lib/components/Table/data-table.svelte';

	import { Frown, Plus } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';

	let filteredList = $derived(data?.videoList);
	import Filter from './filter.svelte';
	import Edit from './edit.svelte';

	let selected = $state([]);

	let disabled = $derived(selected.length === 0);

	let ids = $state('');

	$effect(() => {
		if (selected.length) ids = selected.map((item) => item.id).join(',');
	});
</script>

<svelte:head>
	<title>Videos</title>
</svelte:head>

<Filter data={data?.verificationStates} start={data?.start} end={data?.end} />

{#if data.videoList.length === 0}
	<div class="flex h-96 w-full flex-col items-center justify-center lg:w-5xl">
		<p class="justify-self-cente mt-4 flex flex-row gap-4 text-center text-4xl">
			<Frown class="h-12 w-16  animate-bounce" />
			Vidoes List is Empty
		</p>
	</div>
{:else}
	<h2 class="my-8 text-2xl">No of Vidoes for this: {data.videoList?.length}</h2>

	<div class="mx-auto w-full space-y-6 rounded-xl border border-border bg-background p-6 shadow-sm">
		<!-- Section Header -->
		<div>
			<h3 class="text-lg font-semibold tracking-tight text-foreground">Video Management</h3>
			<p class="text-sm text-muted-foreground">
				Update visibility, compliance, and verification statuses for the selected videos.
			</p>
		</div>

		<div class="space-y-4">
			{#key data?.videoList}
				<Edit
					data={data?.form}
					name="Discoverablity"
					action="?/discover"
					discoverable={true}
					bind:ids
					{disabled}
				/>

				<Edit
					data={data?.form}
					name="Compliance Reviewed"
					action="?/review"
					discoverable={false}
					bind:ids
					{disabled}
				/>

				<Edit
					data={data?.form}
					name="Verification State"
					action="?/verify"
					discoverable={false}
					bind:ids
					{disabled}
					verificationsStates={data?.verificationStates}
				/>
			{/key}
		</div>

		<!-- Optional Selection Status Footer -->
		{#if disabled}
			<p class="animate-pulse rounded-md bg-muted py-2 text-center text-xs">
				Select one or more videos above to enable status changes.
			</p>
		{/if}
	</div>
	<br />
	<br />
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
	<DataTable bind:selected data={filteredList} {columns} fileName="VideoList" />
{/if}

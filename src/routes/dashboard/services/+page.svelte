<script>
	import DataTable from '$lib/components/Table/data-table.svelte';

	let { data } = $props();

	import { columns } from './columns';

	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';
	import Datachart from '$lib/components/datachart.svelte';

	let filteredList = $derived(data.allData);
</script>

<svelte:head>
	<title>Services</title>
</svelte:head>

{#key data.allData}
	<!-- <FilterMenu
		data={data.allData}
		bind:filteredList
		filterKeys={[
			'categoryName',
			'basePrice',
			'pricingType',
			'locationType',
			'isActive',
			'averageRating',
			'ratingCount',
			'priceMin',
			'priceMax',
			'bookingEnabled',
			'allowImages',
			'requiresBeforeImage',
			'requiresAfterImage'
		]}
	/> -->

	<div class="max-w-6xl">
		<Datachart
			data={data.allData}
			bind:filteredList
			filterKeys={[
				'categoryName',
				'basePrice',
				'pricingType',
				'locationType',
				'isActive',
				'averageRating',
				'ratingCount',
				'priceMin',
				'priceMax',
				'bookingEnabled',
				'allowImages',
				'requiresBeforeImage',
				'requiresAfterImage'
			]}
		/>
	</div>
	<DataTable
		{columns}
		class="lg:max-w-6xl"
		data={filteredList}
		search={true}
		fileName="Service List"
	/>
{/key}

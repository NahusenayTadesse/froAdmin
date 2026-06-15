<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import DataTable from '$lib/components/Table/data-table.svelte';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';
	import QueryBuilder, { type QueryFilterPayload } from '$lib/components/query-builder.svelte';

	import Mobile from './mobile.svelte';
	import { columns } from './columns';

	import Label from '$lib/components/ui/label/label.svelte';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';

	let { data } = $props();

	let filteredList = $derived(data.allData);

	type ServiceQueryFilters = {
		categoryId: string;
		pricingType: string;
		locationType: string;
		isActive: string;
		bookingEnabled: string;
	};

	const initialCustomFilters: ServiceQueryFilters = {
		categoryId: data.query.categoryId ?? '',
		pricingType: data.query.pricingType ?? '',
		locationType: data.query.locationType ?? '',
		isActive:
			data.query.isActive === null || data.query.isActive === undefined
				? ''
				: String(data.query.isActive),
		bookingEnabled:
			data.query.bookingEnabled === null || data.query.bookingEnabled === undefined
				? ''
				: String(data.query.bookingEnabled)
	};

	function updateUrl(payload: QueryFilterPayload<ServiceQueryFilters>) {
		const params = new URLSearchParams(page.url.searchParams);

		setOrDelete(params, 'search', payload.search);
		setOrDelete(params, 'categoryId', payload.customFilters.categoryId);
		setOrDelete(params, 'pricingType', payload.customFilters.pricingType);
		setOrDelete(params, 'locationType', payload.customFilters.locationType);
		setOrDelete(params, 'isActive', payload.customFilters.isActive);
		setOrDelete(params, 'bookingEnabled', payload.customFilters.bookingEnabled);

		goto(`?${params.toString()}`, {
			keepFocus: true,
			noScroll: true
		});
	}

	function setOrDelete(
		params: URLSearchParams,
		key: string,
		value: string | number | null | undefined
	) {
		const normalizedValue = String(value ?? '').trim();

		if (normalizedValue) {
			params.set(key, normalizedValue);
		} else {
			params.delete(key);
		}
	}
</script>

<svelte:head>
	<title>Services</title>
</svelte:head>

{#key data.allData}
	<div class="space-y-6">
		<QueryBuilder
			title="Services Dataset"
			description="Narrow the loaded service dataset before local filtering, export, and charts"
			initialSearch={data.query.search}
			initialPageSize={20}
			showPageSize={false}
			{initialCustomFilters}
			submitMode="manual"
			searchPlaceholder="Search title, description, or category..."
			onQueryChange={updateUrl}
		>
			{#snippet children(filters, update)}
				<div class="flex flex-col gap-2">
					<Label class="text-sm font-medium">Category</Label>

					<Select
						type="single"
						value={filters.categoryId}
						onValueChange={(value) => update('categoryId', value)}
					>
						<SelectTrigger class="w-full">
							{data.categoryList.find((category) => category.value === filters.categoryId)?.name ??
								'All categories'}
						</SelectTrigger>

						<SelectContent>
							<SelectItem value="">All categories</SelectItem>

							{#each data.categoryList as category}
								<SelectItem value={category.value}>
									{category.name}
								</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>

				<div class="flex flex-col gap-2">
					<Label class="text-sm font-medium">Pricing Type</Label>

					<Select
						type="single"
						value={filters.pricingType}
						onValueChange={(value) => update('pricingType', value)}
					>
						<SelectTrigger class="w-full">
							{filters.pricingType || 'All pricing types'}
						</SelectTrigger>

						<SelectContent>
							<SelectItem value="">All pricing types</SelectItem>
							<SelectItem value="fixed">Fixed</SelectItem>
							<SelectItem value="hourly">Hourly</SelectItem>
							<SelectItem value="per_visit">Per Visit</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div class="flex flex-col gap-2">
					<Label class="text-sm font-medium">Location Type</Label>

					<Select
						type="single"
						value={filters.locationType}
						onValueChange={(value) => update('locationType', value)}
					>
						<SelectTrigger class="w-full">
							{filters.locationType || 'All location types'}
						</SelectTrigger>

						<SelectContent>
							<SelectItem value="">All location types</SelectItem>
							<SelectItem value="provider_location">Provider Location</SelectItem>
							<SelectItem value="customer_location">Customer Location</SelectItem>
							<SelectItem value="online">Online</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div class="flex flex-col gap-2">
					<Label class="text-sm font-medium">Active Status</Label>

					<Select
						type="single"
						value={filters.isActive}
						onValueChange={(value) => update('isActive', value)}
					>
						<SelectTrigger class="w-full">
							{filters.isActive === 'true'
								? 'Active'
								: filters.isActive === 'false'
									? 'Inactive'
									: 'All services'}
						</SelectTrigger>

						<SelectContent>
							<SelectItem value="">All services</SelectItem>
							<SelectItem value="true">Active</SelectItem>
							<SelectItem value="false">Inactive</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div class="flex flex-col gap-2">
					<Label class="text-sm font-medium">Booking Status</Label>

					<Select
						type="single"
						value={filters.bookingEnabled}
						onValueChange={(value) => update('bookingEnabled', value)}
					>
						<SelectTrigger class="w-full">
							{filters.bookingEnabled === 'true'
								? 'Booking Enabled'
								: filters.bookingEnabled === 'false'
									? 'Booking Disabled'
									: 'All booking statuses'}
						</SelectTrigger>

						<SelectContent>
							<SelectItem value="">All booking statuses</SelectItem>
							<SelectItem value="true">Booking Enabled</SelectItem>
							<SelectItem value="false">Booking Disabled</SelectItem>
						</SelectContent>
					</Select>
				</div>
			{/snippet}
		</QueryBuilder>

		<FilterMenu
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

		<div>
			<Mobile services={filteredList} />
		</div>

		<DataTable {columns} data={filteredList} search={true} fileName="Service List" />
	</div>
{/key}

<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import { columns } from './columns';

	import DataTable from '$lib/components/Table/data-table.svelte';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';
	import QueryBuilder, { type QueryFilterPayload } from '$lib/components/query-builder.svelte';

	import { Frown } from '@lucide/svelte';

	import Label from '$lib/components/ui/label/label.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import Mobile from './mobile.svelte';

	let { data } = $props();

	let filteredList = $derived(data?.salesPersons);

	type SalesPersonQueryFilters = {
		status: string;
		tierId: string;
		activeCode: string;
	};

	const initialCustomFilters: SalesPersonQueryFilters = {
		status: data.query.status ?? '',
		tierId: data.query.tierId ?? '',
		activeCode: data.query.activeCode ?? ''
	};

	function updateUrl(payload: QueryFilterPayload<SalesPersonQueryFilters>) {
		const params = new URLSearchParams(page.url.searchParams);

		setOrDelete(params, 'search', payload.search);
		setOrDelete(params, 'status', payload.customFilters.status);
		setOrDelete(params, 'tierId', payload.customFilters.tierId);
		setOrDelete(params, 'activeCode', payload.customFilters.activeCode);

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
	<title>Sales Persons</title>
</svelte:head>

<div class="space-y-6">
	<QueryBuilder
		title="Sales Persons Dataset"
		description="Load sales persons by status, tier, active code, user ID, or sales person ID"
		showDate={false}
		showPageSize={false}
		initialSearch={data.query.search}
		{initialCustomFilters}
		submitMode="manual"
		searchPlaceholder="Search sales person ID, user ID, or code..."
		onQueryChange={updateUrl}
	>
		{#snippet children(filters, update)}
			<div class="flex flex-col gap-2">
				<Label class="text-sm font-medium">Status</Label>

				<Select
					type="single"
					value={filters.status}
					onValueChange={(value) => update('status', value)}
				>
					<SelectTrigger class="w-full">
						{filters.status || 'All statuses'}
					</SelectTrigger>

					<SelectContent>
						<SelectItem value="">All statuses</SelectItem>

						<!-- Adjust these values if your DB uses different status names -->
						<SelectItem value="pending">Pending</SelectItem>
						<SelectItem value="active">Active</SelectItem>
						<SelectItem value="suspended">Suspended</SelectItem>
						<SelectItem value="rejected">Rejected</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div class="flex flex-col gap-2">
				<Label class="text-sm font-medium">Tier</Label>

				<Select
					type="single"
					value={filters.tierId}
					onValueChange={(value) => update('tierId', value)}
				>
					<SelectTrigger class="w-full">
						{data.tierList.find((tier) => tier.value === filters.tierId)?.name ?? 'All tiers'}
					</SelectTrigger>

					<SelectContent>
						<SelectItem value="">All tiers</SelectItem>

						{#each data.tierList as tier}
							<SelectItem value={tier.value}>
								{tier.name}
							</SelectItem>
						{/each}
					</SelectContent>
				</Select>
			</div>

			<div class="flex flex-col gap-2">
				<Label class="text-sm font-medium">Active Code</Label>

				<Input
					type="search"
					placeholder="e.g. SALE2025"
					value={filters.activeCode}
					oninput={(event) => update('activeCode', event.currentTarget.value)}
				/>
			</div>
		{/snippet}
	</QueryBuilder>

	{#if data.salesPersons.length === 0}
		<div class="flex h-96 w-full flex-col items-center justify-center lg:w-5xl">
			<p class="mt-4 flex flex-row gap-4 text-center text-4xl">
				<Frown class="h-12 w-16 animate-bounce" />
				Sales Person List is Empty
			</p>
		</div>
	{:else}
		<h2 class="my-4 text-2xl">
			No of Sales Persons: {data.totalCount}
		</h2>

		<FilterMenu
			data={data?.salesPersons}
			bind:filteredList
			filterKeys={['status', 'tierName', 'activeCodes', 'id', 'userId']}
		/>
		<Mobile salesPersons={filteredList} />
		<DataTable data={filteredList} {columns} fileName="Sales Persons List" />
	{/if}
</div>

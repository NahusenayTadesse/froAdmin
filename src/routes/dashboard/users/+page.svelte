<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import { columns } from './columns';

	import DataTable from '$lib/components/Table/data-table.svelte';
	import QueryBuilder, { type QueryFilterPayload } from '$lib/components/query-builder.svelte';

	import Mobile from './mobile.svelte';

	import { Button } from '$lib/components/ui/button';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Input } from '$lib/components/ui/input';
	import Label from '$lib/components/ui/label/label.svelte';

	import { Frown } from '@lucide/svelte';

	let { data } = $props();

	type ProviderFilters = {
		verificationStatus: string;
		isVerifiedProvider: string;
		banned: string;
		minRating: string;
		minServices: string;
	};

	const initialCustomFilters: ProviderFilters = {
		verificationStatus: data.query.verificationStatus ?? '',
		isVerifiedProvider:
			data.query.isVerifiedProvider === null || data.query.isVerifiedProvider === undefined
				? ''
				: String(data.query.isVerifiedProvider),
		banned:
			data.query.banned === null || data.query.banned === undefined
				? ''
				: String(data.query.banned),
		minRating: data.query.minRating ? String(data.query.minRating) : '',
		minServices: data.query.minServices ? String(data.query.minServices) : ''
	};

	function updateUrl(payload: QueryFilterPayload<ProviderFilters>) {
		const params = new URLSearchParams(page.url.searchParams);

		setOrDelete(params, 'search', payload.search);
		setOrDelete(params, 'pageSize', String(payload.pageSize));

		setOrDelete(params, 'verificationStatus', payload.customFilters.verificationStatus);
		setOrDelete(params, 'isVerifiedProvider', payload.customFilters.isVerifiedProvider);
		setOrDelete(params, 'banned', payload.customFilters.banned);
		setOrDelete(params, 'minRating', payload.customFilters.minRating);
		setOrDelete(params, 'minServices', payload.customFilters.minServices);

		// Reset to first page whenever filters change
		params.set('page', '1');

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

	function goToPage(nextPage: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(nextPage));

		goto(`?${params.toString()}`, {
			keepFocus: true,
			noScroll: true
		});
	}

	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';

	let filteredList = $derived(data?.userList);
</script>

<svelte:head>
	<title>Customers</title>
</svelte:head>

<div class="space-y-6">
	<QueryBuilder
		title="Service Providers"
		description="Search and filter service provider profiles"
		initialSearch={data.query.search}
		initialPageSize={data.query.pageSize}
		{initialCustomFilters}
		pageSizes={[10, 20, 50, 100]}
		submitMode="manual"
		onQueryChange={updateUrl}
	>
		{#snippet children(filters, update)}
			<div class="flex flex-col gap-2">
				<Label class="text-sm font-medium">Banned Status</Label>

				<Select
					type="single"
					value={filters.banned}
					onValueChange={(value) => update('banned', value)}
				>
					<SelectTrigger class="w-full">
						{filters.banned === 'true'
							? 'Banned'
							: filters.banned === 'false'
								? 'Not Banned'
								: 'All users'}
					</SelectTrigger>

					<SelectContent>
						<SelectItem value="">All users</SelectItem>
						<SelectItem value="true">Banned</SelectItem>
						<SelectItem value="false">Not Banned</SelectItem>
					</SelectContent>
				</Select>
			</div>
		{/snippet}
	</QueryBuilder>

	<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
		<h2 class="text-2xl">
			Customers: {data.pagination.total}
		</h2>

		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				disabled={!data.pagination.hasPreviousPage}
				onclick={() => goToPage(data.pagination.page - 1)}
			>
				Previous
			</Button>

			<p class="text-sm text-muted-foreground">
				Page {data.pagination.page} of {data.pagination.totalPages}
			</p>

			<Button
				variant="outline"
				disabled={!data.pagination.hasNextPage}
				onclick={() => goToPage(data.pagination.page + 1)}
			>
				Next
			</Button>
		</div>
	</div>

	{#if data.userList.length === 0}
		<div class="flex h-96 w-full flex-col items-center justify-center lg:w-5xl">
			<p class="mt-4 flex flex-row gap-4 text-center text-4xl">
				<Frown class="h-12 w-16 animate-bounce" />
				No customers found
			</p>
		</div>
	{:else}
		<FilterMenu
			data={data?.userList}
			bind:filteredList
			filterKeys={['locationCity', 'locationState', 'locationCountry', 'status', 'banned']}
		/>
		<Mobile providers={filteredList} />
		<DataTable data={filteredList} {columns} fileName="Customers List" />
	{/if}
</div>

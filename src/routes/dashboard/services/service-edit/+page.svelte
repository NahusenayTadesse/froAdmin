<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import DataTable from '$lib/components/Table/data-table.svelte';
	import FilterMenu from '$lib/components/Table/FilterMenu.svelte';
	import QueryBuilder, { type QueryFilterPayload } from '$lib/components/query-builder.svelte';

	import Label from '$lib/components/ui/label/label.svelte';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { toast } from 'svelte-sonner';
	import { getColumns } from './columns';

	let { data } = $props();

	// Bind reactive filtered state outputs using your data table properties map
	let filteredList = $derived(data.allData);
	let columns = $derived(getColumns(data.reviewForm));

	type EditRequestQueryFilters = {
		status: string;
		changeType: string;
	};

	const initialCustomFilters: EditRequestQueryFilters = {
		status: data.query.statusFilter ?? 'pending',
		changeType: data.query.changeType ?? ''
	};

	function updateUrl(payload: QueryFilterPayload<EditRequestQueryFilters>) {
		const params = new URLSearchParams(page.url.searchParams);

		setOrDelete(params, 'search', payload.search);
		setOrDelete(params, 'status', payload.customFilters.status);
		setOrDelete(params, 'changeType', payload.customFilters.changeType);

		goto(`?${params.toString()}`, {
			keepFocus: true,
			noScroll: true
		});
	}

	function setOrDelete(params: URLSearchParams, key: string, value: any) {
		const normalizedValue = String(value ?? '').trim();
		if (normalizedValue) {
			params.set(key, normalizedValue);
		} else {
			params.delete(key);
		}
	}

	// Dynamic global message handling tied directly into your app message structure
	// let globalMessage = $derived(data.reviewForm?.message);
	// $effect(() => {
	// 	if (globalMessage) {
	// 		if (globalMessage.type === 'error') {
	// 			toast.error(globalMessage.text);
	// 		} else {
	// 			toast.success(globalMessage.text);
	// 		}
	// 	}
	// });
</script>

<svelte:head>
	<title>Moderation Inbox — Service Edits</title>
</svelte:head>

{#key data.allData}
	<div class="space-y-6">
		<QueryBuilder
			title="Staging Sandbox & Review Inbox"
			description="Audit, approve, or suspend incoming provider-initiated profile changes and listings"
			initialSearch={data.query.search}
			initialPageSize={20}
			showPageSize={false}
			{initialCustomFilters}
			submitMode="manual"
			searchPlaceholder="Search service requests, providers, or summary notes..."
			onQueryChange={updateUrl}
		>
			{#snippet children(filters, update)}
				<div class="flex flex-col gap-2">
					<Label class="text-sm font-medium">Inbox Lifecycle Filter</Label>
					<Select
						type="single"
						value={filters.status}
						onValueChange={(value) => update('status', value)}
					>
						<SelectTrigger class="w-full">
							{#if filters.status === 'pending'}Pending Review{/if}
							{#if filters.status === 'approved'}Approved Logs{/if}
							{#if filters.status === 'rejected'}Rejected Logs{/if}
							{#if filters.status === 'all'}Complete History Archive{/if}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="pending">Pending Review</SelectItem>
							<SelectItem value="approved">Approved Logs</SelectItem>
							<SelectItem value="rejected">Rejected Logs</SelectItem>
							<SelectItem value="all">Complete History Archive</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div class="flex flex-col gap-2">
					<Label class="text-sm font-medium">Submission Class</Label>
					<Select
						type="single"
						value={filters.changeType}
						onValueChange={(value) => update('changeType', value)}
					>
						<SelectTrigger class="w-full">
							{#if !filters.changeType}All Classes{/if}
							{#if filters.changeType === 'initial_review'}New Service Proposals{/if}
							{#if filters.changeType === 'edit_review'}Profile Variable Edits{/if}
							{#if filters.changeType === 'reactivation'}Reactivation Proposals{/if}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">All Classes</SelectItem>
							<SelectItem value="initial_review">New Service Proposals</SelectItem>
							<SelectItem value="edit_review">Profile Variable Edits</SelectItem>
							<SelectItem value="reactivation">Reactivation Proposals</SelectItem>
						</SelectContent>
					</Select>
				</div>
			{/snippet}
		</QueryBuilder>

		<FilterMenu
			data={data.allData}
			bind:filteredList
			filterKeys={['service_title', 'provider_name', 'status', 'change_type', 'requested_at']}
		/>

		<DataTable {columns} data={filteredList} search={true} fileName="Service Moderation Queue" />
	</div>
{/key}

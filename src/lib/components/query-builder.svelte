<script lang="ts" generics="T extends Record<string, any> = Record<string, any>">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Input } from '$lib/components/ui/input';
	import DateMonth from './date-month.svelte'; // Keeping your custom date picker component
	import { XIcon, Funnel, Calendar1, Search, List } from '@lucide/svelte';
	import {
		getLocalTimeZone,
		today,
		type CalendarDate,
		CalendarDate as CDate
	} from '@internationalized/date';
	import type { Snippet } from 'svelte';
	import Label from './ui/label/label.svelte';

	// Define standard, reusable payload structure for database/API queries
	export interface QueryFilterPayload {
		search: string;
		pageSize: number;
		dateRange: { start: CalendarDate; end: CalendarDate } | null;
		customFilters: T;
	}

	interface Props {
		title?: string;
		description?: string;
		showDate?: boolean;

		// Initial values or bindings
		initialSearch?: string;
		initialPageSize?: number;
		start?: string; // ISO string format preferred for inputs
		end?: string;

		// Custom filter initial state
		initialCustomFilters?: T;

		// Event handler
		onQueryChange?: (payload: QueryFilterPayload) => void;

		// Children snippet to inject domain-specific dropdowns or inputs
		children?: Snippet<[T, (key: keyof T, value: any) => void]>;
	}

	let {
		title = 'Query Builder',
		description = 'Filter, search, and manage dataset limits',
		showDate = false,
		initialSearch = '',
		initialPageSize = 20,
		start,
		end,
		initialCustomFilters = {} as T,
		onQueryChange,
		children
	}: Props = $props();

	// --- State ---
	let search = $derived(initialSearch);
	let pageSize = $derived(initialPageSize);
	let customFilters = $derived<T>({ ...initialCustomFilters });

	// Parse initial native date strings into component-compatible CalendarDates safely
	const defaultDate = today(getLocalTimeZone());
	let dateRange = $derived<{ start: CalendarDate; end: CalendarDate }>({
		start: start
			? new CDate(
					new Date(start).getFullYear(),
					new Date(start).getMonth() + 1,
					new Date(start).getDate()
				)
			: defaultDate,
		end: end
			? new CDate(
					new Date(end).getFullYear(),
					new Date(end).getMonth() + 1,
					new Date(end).getDate()
				)
			: defaultDate
	});

	// --- Derived / Computed Values ---
	const activeFilterCount = $derived(
		[
			search.trim() !== '',
			pageSize !== 20,
			...Object.values(customFilters).map((val) => val !== '' && val !== null && val !== undefined)
		].filter(Boolean).length
	);

	// Debounce or dispatch changes seamlessly
	function emitChange() {
		onQueryChange?.({
			search: search.trim(),
			pageSize,
			dateRange: showDate ? dateRange : null,
			customFilters: $state.snapshot(customFilters) // Safely unwrap reactive proxy state
		});
	}

	// --- Actions & Triggers ---
	function handleSearchInput(e?: Event) {
		e?.preventDefault();
		emitChange();
	}

	function handlePageSizeChange(value: string) {
		pageSize = Number(value);
		emitChange();
	}

	function handleDateChange(dates: { start: CalendarDate; end: CalendarDate }) {
		dateRange = dates;
		emitChange();
	}

	function updateCustomFilter(key: keyof T, value: any) {
		customFilters[key] = value;
		emitChange();
	}

	function clearAllFilters() {
		search = '';
		pageSize = 20;
		// Reset keys of custom filters to empty strings
		for (const key in customFilters) {
			customFilters[key] = '' as any;
		}
		emitChange();
	}

	const pageCounts = [10, 20, 50, 100];

	let value: number = $state(20);

	const triggerContent = $derived(
		pageCounts?.find((f) => String(f) === String(value)) ?? 'Select Page Count'
	);
</script>

<Card class="w-full border-border/50 shadow-lg">
	<CardHeader class="pb-4">
		<div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
			<div class="flex items-center gap-3">
				<div class="flex size-9 items-center justify-center rounded-lg bg-primary/10">
					<Funnel class="size-4 text-primary" />
				</div>
				<div>
					<CardTitle class="text-lg">{title}</CardTitle>
					<p class="text-sm text-muted-foreground">{description}</p>
				</div>
			</div>

			{#if activeFilterCount > 0}
				<div class="flex items-center gap-2 self-end sm:self-auto">
					<Badge variant="secondary" class="font-medium">
						{activeFilterCount} active modifier{activeFilterCount > 1 ? 's' : ''}
					</Badge>
					<Button
						variant="ghost"
						size="sm"
						class="h-8 px-2 text-muted-foreground hover:text-foreground"
						onclick={clearAllFilters}
					>
						<XIcon class="mr-1 size-3" />
						Clear all
					</Button>
				</div>
			{/if}
		</div>
	</CardHeader>

	<Separator />

	<CardContent class="pt-6">
		<div class="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div class="flex flex-col gap-2">
				<Label for="search" class="flex items-center gap-2 text-sm font-medium text-foreground">
					<Search class="size-3.5 text-muted-foreground" />
					Search
				</Label>
				<div class="relative w-full">
					<form onsubmit={handleSearchInput}>
						<Input
							id="search"
							type="search"
							placeholder="Search rows..."
							bind:value={search}
							class="w-full"
						/>
					</form>
				</div>
			</div>

			<div class="flex flex-col gap-2">
				<label for="pageSize" class="flex items-center gap-2 text-sm font-medium text-foreground">
					<List class="size-3.5 text-muted-foreground" />
					Page Size
				</label>
				<Select type="single" bind:value onValueChange={handlePageSizeChange}>
					<SelectTrigger id="pageSize" class="w-full">
						{triggerContent} per page
					</SelectTrigger>
					<SelectContent>
						{#each pageCounts as count (count)}
							<SelectItem value={String(count)}>{count} per page</SelectItem>
						{/each}
					</SelectContent>
				</Select>
			</div>

			{#if showDate}
				<div class="flex flex-col gap-2 sm:col-span-2 lg:col-span-2">
					<label class="flex items-center gap-2 text-sm font-medium text-foreground">
						<Calendar1 class="size-3.5 text-muted-foreground" />
						Date Range
					</label>
					<DateMonth
						start={dateRange.start}
						end={dateRange.end}
						link=""
						onDateChange={handleDateChange}
					/>
				</div>
			{/if}

			{#if children}
				{@render children(customFilters, updateCustomFilter)}
			{/if}
		</div>
	</CardContent>
</Card>

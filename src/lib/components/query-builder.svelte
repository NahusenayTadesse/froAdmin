<script lang="ts" generics="T extends Record<string, unknown> = Record<string, unknown>">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Input } from '$lib/components/ui/input';
	import Label from './ui/label/label.svelte';
	import DateMonth from './date-month.svelte';

	import { XIcon, Funnel, Calendar1, Search, List, SlidersHorizontal } from '@lucide/svelte';

	import {
		getLocalTimeZone,
		today,
		type CalendarDate,
		CalendarDate as CDate
	} from '@internationalized/date';

	import type { Snippet } from 'svelte';

	export interface QueryFilterPayload<T extends Record<string, unknown>> {
		search: string;
		pageSize: number;
		dateRange: {
			start: CalendarDate;
			end: CalendarDate;
		} | null;
		customFilters: T;
	}

	interface Props {
		title?: string;
		description?: string;

		showDate?: boolean;
		showSearch?: boolean;
		showPageSize?: boolean;

		initialSearch?: string;
		initialPageSize?: number;
		initialStart?: string;
		initialEnd?: string;
		initialCustomFilters?: T;

		pageSizes?: number[];

		/**
		 * manual = emit only when search form is submitted, page size/date/custom filter changes, or clear all
		 * change = emit whenever search input changes too
		 */
		submitMode?: 'manual' | 'change';

		searchPlaceholder?: string;

		onQueryChange?: (payload: QueryFilterPayload<T>) => void;

		/**
		 * Inject your module-specific filters here.
		 *
		 * Example:
		 * {#snippet children(filters, update)}
		 *   <Select value={filters.status as string} onValueChange={(v) => update('status', v)}>
		 *     ...
		 *   </Select>
		 * {/snippet}
		 */
		children?: Snippet<[T, <K extends keyof T>(key: K, value: T[K]) => void]>;
	}

	let {
		title = 'Query Builder',
		description = 'Filter, search, and manage dataset limits',

		showDate = false,
		showSearch = true,
		showPageSize = true,

		initialSearch = '',
		initialPageSize = 20,
		initialStart,
		initialEnd,
		initialCustomFilters = {} as T,

		pageSizes = [10, 20, 50, 100],

		submitMode = 'manual',
		searchPlaceholder = 'Search rows...',

		onQueryChange,
		children
	}: Props = $props();

	const defaultDate = today(getLocalTimeZone());

	let search = $state(initialSearch);
	let pageSize = $state(initialPageSize);
	let customFilters = $state<T>({ ...initialCustomFilters });

	let dateRange = $state<{ start: CalendarDate; end: CalendarDate }>({
		start: parseCalendarDate(initialStart) ?? defaultDate,
		end: parseCalendarDate(initialEnd) ?? defaultDate
	});

	const hasCustomFilters = $derived(Object.keys(customFilters).length > 0);

	const activeFilterCount = $derived(
		[
			showSearch && search.trim() !== '',
			showPageSize && pageSize !== initialPageSize,
			showDate && hasDateChanged(),
			...Object.entries(customFilters).map(([key, value]) => {
				const initialValue = initialCustomFilters[key as keyof T];
				return !isEmptyFilterValue(value) && value !== initialValue;
			})
		].filter(Boolean).length
	);

	function parseCalendarDate(value?: string): CalendarDate | null {
		if (!value) return null;

		const date = new Date(value);

		if (Number.isNaN(date.getTime())) {
			return null;
		}

		return new CDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
	}

	function isEmptyFilterValue(value: unknown): boolean {
		if (value === null || value === undefined || value === '') return true;
		if (Array.isArray(value) && value.length === 0) return true;
		return false;
	}

	function hasDateChanged(): boolean {
		const initialDateStart = parseCalendarDate(initialStart) ?? defaultDate;
		const initialDateEnd = parseCalendarDate(initialEnd) ?? defaultDate;

		return (
			dateRange.start.compare(initialDateStart) !== 0 || dateRange.end.compare(initialDateEnd) !== 0
		);
	}

	function getPayload(): QueryFilterPayload<T> {
		return {
			search: search.trim(),
			pageSize,
			dateRange: showDate ? dateRange : null,
			customFilters: $state.snapshot(customFilters) as T
		};
	}

	function emitChange() {
		onQueryChange?.(getPayload());
	}

	function handleSearchSubmit(event?: Event) {
		event?.preventDefault();
		emitChange();
	}

	function handleSearchInput() {
		if (submitMode === 'change') {
			emitChange();
		}
	}

	function handlePageSizeChange(value: string) {
		const nextPageSize = Number(value);

		if (Number.isNaN(nextPageSize)) return;

		pageSize = nextPageSize;
		emitChange();
	}

	function handleDateChange(dates: { start: CalendarDate; end: CalendarDate }) {
		dateRange = dates;
		emitChange();
	}

	function updateCustomFilter<K extends keyof T>(key: K, value: T[K]) {
		customFilters[key] = value;
		emitChange();
	}

	function clearAllFilters() {
		search = '';
		pageSize = initialPageSize;
		customFilters = { ...initialCustomFilters };

		dateRange = {
			start: parseCalendarDate(initialStart) ?? defaultDate,
			end: parseCalendarDate(initialEnd) ?? defaultDate
		};

		emitChange();
	}
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
						{activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}
					</Badge>

					<Button
						type="button"
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
			{#if showSearch}
				<div class="flex flex-col gap-2">
					<Label
						for="query-search"
						class="flex items-center gap-2 text-sm font-medium text-foreground"
					>
						<Search class="size-3.5 text-muted-foreground" />
						Search
					</Label>

					<form onsubmit={handleSearchSubmit}>
						<Input
							id="query-search"
							type="search"
							placeholder={searchPlaceholder}
							bind:value={search}
							oninput={handleSearchInput}
							class="w-full"
						/>
					</form>
				</div>
			{/if}

			{#if showPageSize}
				<div class="flex flex-col gap-2">
					<Label
						for="query-page-size"
						class="flex items-center gap-2 text-sm font-medium text-foreground"
					>
						<List class="size-3.5 text-muted-foreground" />
						Page Size
					</Label>

					<Select type="single" value={String(pageSize)} onValueChange={handlePageSizeChange}>
						<SelectTrigger id="query-page-size" class="w-full">
							{pageSize} per page
						</SelectTrigger>

						<SelectContent>
							{#each pageSizes as count (count)}
								<SelectItem value={String(count)}>
									{count} per page
								</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
			{/if}

			{#if showDate}
				<div class="flex flex-col gap-2 sm:col-span-2 lg:col-span-2">
					<Label class="flex items-center gap-2 text-sm font-medium text-foreground">
						<Calendar1 class="size-3.5 text-muted-foreground" />
						Date Range
					</Label>

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
			{:else if hasCustomFilters}
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<SlidersHorizontal class="size-3.5" />
					Custom filters configured, but no filter UI provided.
				</div>
			{/if}
		</div>
	</CardContent>
</Card>

<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import {
		Search,
		ChevronDown,
		ChevronUp,
		ArrowRight,
		Tag,
		Star,
		Clock,
		MapPin,
		Globe,
		Navigation,
		DollarSign,
		Image,
		Calendar,
		Layers,
		ToggleLeft,
		ToggleRight,
		Radius,
		House
	} from '@lucide/svelte';
	import { goto } from '$app/navigation';

	type Service = {
		id: string;
		providerId: string;
		categoryId: string | null;
		title: string;
		shortDescription: string | null;
		fullDescription: string | null;
		coverImageUrl: string | null;
		galleryImageUrls: string[] | null;
		basePrice: string;
		pricingType: string;
		locationType: string;
		serviceRadiusKm: number | null;
		estimatedDurationMinutes: number | null;
		minBookingNoticeHours: number | null;
		maxDailyBookings: number | null;
		isActive: boolean;
		averageRating: number | null;
		ratingCount: number | null;
		createdAt: string | null;
		updatedAt: string | null;
		priceMin: string;
		priceMax: string;
		bookingEnabled: boolean;
		latitude: number | null;
		longitude: number | null;
		allowImages: boolean | null;
		requiresBeforeImage: boolean | null;
		requiresAfterImage: boolean | null;
		categoryName: string | null;
	};

	type SortKey =
		| 'title'
		| 'basePrice'
		| 'averageRating'
		| 'ratingCount'
		| 'estimatedDurationMinutes';

	let { services = [] }: { services: Service[] } = $props();

	let search = $state('');
	let activeCategory = $state('all');
	let activePricingType = $state('all');
	let activeLocationType = $state('all');
	let activeStatus = $state<'all' | 'active' | 'inactive'>('all');
	let sortKey = $state<SortKey>('title');
	let sortAsc = $state(true);

	const PRICING_TYPE: Record<string, { label: string; class: string }> = {
		fixed: {
			label: 'Fixed',
			class:
				'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
		},
		hourly: {
			label: 'Hourly',
			class:
				'bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800'
		},
		per_visit: {
			label: 'Per visit',
			class:
				'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
		}
	};

	const LOCATION_TYPE: Record<string, { label: string; icon: typeof MapPin; class: string }> = {
		provider_location: {
			label: 'At provider',
			icon: House,
			class: 'text-gray-600 dark:text-gray-300'
		},
		customer_location: {
			label: 'At customer',
			icon: Navigation,
			class: 'text-blue-600 dark:text-blue-400'
		},
		online: { label: 'Online', icon: Globe, class: 'text-emerald-600 dark:text-emerald-400' }
	};

	function pricingCfg(type: string) {
		return (
			PRICING_TYPE[type] ?? {
				label: type,
				class:
					'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
			}
		);
	}

	function locationCfg(type: string) {
		return (
			LOCATION_TYPE[type] ?? {
				label: type,
				icon: MapPin,
				class: 'text-gray-500 dark:text-gray-400'
			}
		);
	}

	function formatCurrency(v: string | number | null) {
		if (v == null) return '—';
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v));
	}

	function formatPriceRange(min: string, max: string) {
		if (min === max) return formatCurrency(min);
		return `${formatCurrency(min)} – ${formatCurrency(max)}`;
	}

	function formatDuration(mins: number | null) {
		if (!mins) return '—';
		if (mins < 60) return `${mins}m`;
		const h = Math.floor(mins / 60);
		const m = mins % 60;
		return m ? `${h}h ${m}m` : `${h}h`;
	}

	function toggleSort(key: SortKey) {
		if (sortKey === key) sortAsc = !sortAsc;
		else {
			sortKey = key;
			sortAsc = true;
		}
	}

	const categories = $derived(() => {
		const set = new Set(services.map((s) => s.categoryName ?? 'Uncategorised'));
		return ['all', ...Array.from(set).sort()];
	});

	const categoryCounts = $derived(() => {
		const map: Record<string, number> = { all: services.length };
		for (const s of services) {
			const c = s.categoryName ?? 'Uncategorised';
			map[c] = (map[c] ?? 0) + 1;
		}
		return map;
	});

	const pricingTypes = $derived(() => {
		const set = new Set(services.map((s) => s.pricingType));
		return ['all', ...Array.from(set).sort()];
	});

	const locationTypes = $derived(() => {
		const set = new Set(services.map((s) => s.locationType));
		return ['all', ...Array.from(set).sort()];
	});

	const filtered = $derived(() => {
		const q = search.toLowerCase().trim();
		return services
			.filter((s) => {
				const matchSearch =
					!q ||
					s.title.toLowerCase().includes(q) ||
					(s.shortDescription ?? '').toLowerCase().includes(q) ||
					(s.categoryName ?? '').toLowerCase().includes(q);
				const matchCategory =
					activeCategory === 'all' || (s.categoryName ?? 'Uncategorised') === activeCategory;
				const matchPricing = activePricingType === 'all' || s.pricingType === activePricingType;
				const matchLocation = activeLocationType === 'all' || s.locationType === activeLocationType;
				const matchStatus =
					activeStatus === 'all' || (activeStatus === 'active' ? s.isActive : !s.isActive);
				return matchSearch && matchCategory && matchPricing && matchLocation && matchStatus;
			})
			.sort((a, b) => {
				let av: string | number = sortKey === 'basePrice' ? Number(a.basePrice) : (a[sortKey] ?? 0);
				let bv: string | number = sortKey === 'basePrice' ? Number(b.basePrice) : (b[sortKey] ?? 0);
				if (typeof av === 'string') av = av.toLowerCase();
				if (typeof bv === 'string') bv = bv.toLowerCase();
				if (av < bv) return sortAsc ? -1 : 1;
				if (av > bv) return sortAsc ? 1 : -1;
				return 0;
			});
	});

	const STATUS_FILTERS = [
		{ value: 'all' as const, label: 'All' },
		{ value: 'active' as const, label: 'Active' },
		{ value: 'inactive' as const, label: 'Inactive' }
	];
</script>

<div class="block w-full space-y-4 font-sans lg:hidden">
	<!-- Header -->
	<div class="flex items-start justify-between gap-3">
		<div class="flex flex-col gap-1">
			<h2 class="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">Services</h2>
			<p class="text-sm text-gray-500 dark:text-gray-400">
				{filtered().length} of {services.length} services
			</p>
		</div>
		<div
			class="flex gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800"
		>
			{#each STATUS_FILTERS as f (f)}
				<button
					onclick={() => (activeStatus = f.value)}
					class="rounded-md px-3 py-1.5 text-xs font-medium transition-all
						{activeStatus === f.value
						? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-50'
						: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}"
				>
					{f.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Search -->
	<div class="relative">
		<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
		<Input
			bind:value={search}
			placeholder="Search by title, description, category…"
			class="h-10 bg-white pl-9 placeholder:text-gray-400 focus-visible:ring-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:focus-visible:ring-gray-600"
		/>
	</div>

	<!-- Category pills -->
	<div class="flex scrollbar-none gap-1.5 overflow-x-auto pb-1">
		{#each categories() as cat (cat)}
			<button
				onclick={() => (activeCategory = cat)}
				class="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all
					{activeCategory === cat
					? 'border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900'
					: 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'}"
			>
				{cat === 'all' ? 'All categories' : cat}
				<span
					class="rounded-full px-1.5 py-0.5 text-[10px] font-semibold
					{activeCategory === cat
						? 'bg-white/20 text-white dark:bg-black/20 dark:text-gray-900'
						: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}"
				>
					{categoryCounts()[cat] ?? 0}
				</span>
			</button>
		{/each}
	</div>

	<!-- Pricing + location type filters -->
	<div class="flex flex-wrap gap-x-5 gap-y-2">
		{#if pricingTypes().length > 2}
			<div class="flex scrollbar-none items-center gap-2 overflow-x-auto">
				<span
					class="flex shrink-0 items-center gap-1 text-[11px] font-medium tracking-wider text-gray-400 uppercase"
				>
					<DollarSign class="size-3" />Pricing
				</span>
				{#each pricingTypes() as type (type)}
					{@const newType = type === 'all' ? 'All' : pricingCfg(type).label}
					<button
						onclick={() => (activePricingType = type)}
						class="shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-all
							{activePricingType === type
							? 'border-gray-700 bg-gray-700 text-white dark:border-gray-300 dark:bg-gray-300 dark:text-gray-900'
							: 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'}"
					>
						{newType}
					</button>
				{/each}
			</div>
		{/if}

		{#if locationTypes().length > 2}
			<div class="flex scrollbar-none items-center gap-2 overflow-x-auto">
				<span
					class="flex shrink-0 items-center gap-1 text-[11px] font-medium tracking-wider text-gray-400 uppercase"
				>
					<MapPin class="size-3" />Location
				</span>
				{#each locationTypes() as type (type)}
					{@const newType = type === 'all' ? 'All' : locationCfg(type).label}
					<button
						onclick={() => (activeLocationType = type)}
						class="shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-all
							{activeLocationType === type
							? 'border-gray-700 bg-gray-700 text-white dark:border-gray-300 dark:bg-gray-300 dark:text-gray-900'
							: 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800'}"
					>
						{newType}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- ─── Mobile: Cards ─── -->
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
		{#if filtered().length === 0}
			<div
				class="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-center dark:border-gray-700"
			>
				<Layers class="mb-3 size-8 text-gray-300 dark:text-gray-600" />
				<p class="text-sm font-medium text-gray-500 dark:text-gray-400">No services found</p>
				<p class="mt-1 text-xs text-gray-400 dark:text-gray-500">Try adjusting your filters</p>
			</div>
		{/if}

		{#each filtered() as service (service.id)}
			{@const pricing = pricingCfg(service.pricingType)}
			{@const location = locationCfg(service.locationType)}
			<div
				class="flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-gray-900
				{service.isActive
					? 'border-gray-200 dark:border-gray-700'
					: 'border-gray-200 opacity-60 dark:border-gray-700'}"
			>
				<!-- Cover image -->
				{#if service.coverImageUrl}
					<div class="relative h-36 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
						<!-- <img
							src={service.coverImageUrl}
							alt={service.title}
							class="h-full w-full object-cover"
						/> -->
						{#if !service.isActive}
							<div class="absolute inset-0 flex items-center justify-center bg-black/40">
								<span class="rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white"
									>Inactive</span
								>
							</div>
						{/if}
						{#if (service.galleryImageUrls?.length ?? 0) > 0}
							<span
								class="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white"
							>
								<Image class="size-2.5" />+{service.galleryImageUrls!.length}
							</span>
						{/if}
					</div>
				{/if}

				<div class="flex flex-1 flex-col gap-2.5 p-4">
					<!-- Category + booking status -->
					<div class="flex items-center justify-between gap-2">
						{#if service.categoryName}
							<span
								class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-gray-500 uppercase dark:bg-gray-800 dark:text-gray-400"
							>
								<Tag class="size-2.5" />{service.categoryName}
							</span>
						{:else}
							<span></span>
						{/if}
						{#if !service.bookingEnabled}
							<span class="text-[10px] font-medium text-rose-500 dark:text-rose-400"
								>Bookings off</span
							>
						{/if}
					</div>

					<!-- Title + description -->
					<div>
						<h3 class="leading-snug font-semibold text-gray-900 dark:text-gray-50">
							{service.title}
						</h3>
						{#if service.shortDescription}
							<p class="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
								{service.shortDescription}
							</p>
						{/if}
					</div>

					<!-- Rating -->
					{#if (service.ratingCount ?? 0) > 0}
						<div class="flex items-center gap-1.5">
							<Star class="size-3.5 fill-amber-400 text-amber-400" />
							<span class="text-xs font-semibold text-gray-800 dark:text-gray-100">
								{(service.averageRating ?? 0).toFixed(1)}
							</span>
							<span class="text-xs text-gray-400">({service.ratingCount})</span>
						</div>
					{/if}

					<!-- Price / duration / range -->
					<div class="mt-auto grid grid-cols-3 gap-2 pt-1">
						<div class="flex flex-col gap-0.5">
							<span class="text-[10px] font-medium tracking-wider text-gray-400 uppercase"
								>Price</span
							>
							<span class="text-sm font-bold text-gray-900 dark:text-gray-50"
								>{formatCurrency(service.basePrice)}</span
							>
						</div>
						<div class="flex flex-col gap-0.5">
							<span class="text-[10px] font-medium tracking-wider text-gray-400 uppercase"
								>Duration</span
							>
							<span class="text-sm font-semibold text-gray-700 dark:text-gray-200"
								>{formatDuration(service.estimatedDurationMinutes)}</span
							>
						</div>
						<div class="flex flex-col gap-0.5">
							<span class="text-[10px] font-medium tracking-wider text-gray-400 uppercase"
								>Range</span
							>
							<span class="text-[11px] font-medium text-gray-500 dark:text-gray-400"
								>{formatCurrency(service.priceMin)}–{formatCurrency(service.priceMax)}</span
							>
						</div>
					</div>

					<!-- Type tags -->
					<div class="flex flex-wrap gap-1.5 pt-1">
						<span
							class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium {pricing.class}"
						>
							{pricing.label}
						</span>
						<span class="inline-flex items-center gap-1 text-[11px] font-medium {location.class}">
							<location.icon class="size-3" />{location.label}
						</span>
						{#if service.serviceRadiusKm}
							<span
								class="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500"
							>
								<Radius class="size-3" />{service.serviceRadiusKm}km
							</span>
						{/if}
					</div>
				</div>

				<!-- Card footer -->
				<div class="border-t border-gray-100 px-4 py-2.5 dark:border-gray-800">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-3 text-[10px] text-gray-400 dark:text-gray-500">
							{#if service.maxDailyBookings}
								<span class="flex items-center gap-1"
									><Calendar class="size-3" />{service.maxDailyBookings}/day</span
								>
							{/if}
							{#if service.minBookingNoticeHours}
								<span class="flex items-center gap-1"
									><Clock class="size-3" />{service.minBookingNoticeHours}h notice</span
								>
							{/if}
						</div>
						<Button
							size="sm"
							variant="ghost"
							onclick={() => goto(`/dashboard/services/${service.id}`)}
							class="h-7 gap-1 px-2 text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50"
						>
							View <ArrowRight class="size-3" />
						</Button>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- ─── Desktop: Table ─── -->
	<div
		class="hidden overflow-hidden rounded-xl border border-gray-200 md:block dark:border-gray-700"
	>
		<table class="w-full text-sm">
			<thead class="bg-gray-50 dark:bg-gray-800/60">
				<tr>
					{#each [{ key: null, label: '' }, { key: 'title', label: 'Service' }, { key: null, label: 'Category' }, { key: 'basePrice', label: 'Price' }, { key: null, label: 'Range' }, { key: null, label: 'Type' }, { key: null, label: 'Location' }, { key: 'averageRating', label: 'Rating' }, { key: 'estimatedDurationMinutes', label: 'Duration' }, { key: null, label: 'Status' }, { key: null, label: '' }] as const as col}
						<th
							class="px-4 py-3 text-left text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400
								{col.key ? 'cursor-pointer select-none hover:text-gray-800 dark:hover:text-gray-200' : ''}"
							onclick={() => col.key && toggleSort(col.key as SortKey)}
						>
							<span class="flex items-center gap-1">
								{col.label}
								{#if col.key && sortKey === col.key}
									{#if sortAsc}<ChevronUp class="size-3" />{:else}<ChevronDown
											class="size-3"
										/>{/if}
								{/if}
							</span>
						</th>
					{/each}
				</tr>
			</thead>

			<tbody class="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
				{#if filtered().length === 0}
					<tr>
						<td colspan="11" class="py-16 text-center">
							<div class="flex flex-col items-center gap-2">
								<Layers class="size-8 text-gray-300 dark:text-gray-600" />
								<p class="text-sm font-medium text-gray-500 dark:text-gray-400">
									No services found
								</p>
							</div>
						</td>
					</tr>
				{/if}

				{#each filtered() as service (service.id)}
					{@const pricing = pricingCfg(service.pricingType)}
					{@const location = locationCfg(service.locationType)}
					<tr
						class="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40 {!service.isActive
							? 'opacity-60'
							: ''}"
					>
						<!-- Thumbnail -->
						<td class="w-14 px-3 py-2">
							<div
								class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800"
							>
								<Layers class="size-4 text-gray-400" />
							</div>
						</td>

						<!-- Title -->
						<td class="max-w-50 px-4 py-3">
							<div class="font-medium text-gray-900 dark:text-gray-50">{service.title}</div>
							{#if service.shortDescription}
								<p
									class="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500"
									title={service.shortDescription}
								>
									{service.shortDescription}
								</p>
							{/if}
						</td>

						<!-- Category -->
						<td class="px-4 py-3">
							{#if service.categoryName}
								<span
									class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
								>
									<Tag class="size-2.5" />{service.categoryName}
								</span>
							{:else}
								<span class="text-xs text-gray-300 dark:text-gray-600">—</span>
							{/if}
						</td>

						<!-- Base price -->
						<td class="px-4 py-3 font-semibold whitespace-nowrap text-gray-900 dark:text-gray-50">
							{formatCurrency(service.basePrice)}
						</td>

						<!-- Price range -->
						<td class="px-4 py-3 text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
							{formatPriceRange(service.priceMin, service.priceMax)}
						</td>

						<!-- Pricing type -->
						<td class="px-4 py-3">
							<span
								class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium {pricing.class}"
							>
								{pricing.label}
							</span>
						</td>

						<!-- Location type -->
						<td class="px-4 py-3">
							<span class="inline-flex items-center gap-1.5 text-xs font-medium {location.class}">
								<location.icon class="size-3.5 shrink-0" />{location.label}
							</span>
							{#if service.serviceRadiusKm && service.locationType === 'customer_location'}
								<p class="mt-0.5 flex items-center gap-1 text-[10px] text-gray-400">
									<Radius class="size-3" />{service.serviceRadiusKm}km
								</p>
							{/if}
						</td>

						<!-- Rating -->
						<td class="px-4 py-3">
							{#if (service.ratingCount ?? 0) > 0}
								<div class="flex items-center gap-1">
									<Star class="size-3.5 fill-amber-400 text-amber-400" />
									<span class="font-semibold text-gray-800 dark:text-gray-100"
										>{(service.averageRating ?? 0).toFixed(1)}</span
									>
									<span class="text-xs text-gray-400">({service.ratingCount})</span>
								</div>
							{:else}
								<span class="text-xs text-gray-300 dark:text-gray-600">No ratings</span>
							{/if}
						</td>

						<!-- Duration -->
						<td class="px-4 py-3">
							<span class="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
								<Clock class="size-3.5 text-gray-400" />{formatDuration(
									service.estimatedDurationMinutes
								)}
							</span>
						</td>

						<!-- Status -->
						<td class="px-4 py-3">
							<div class="flex flex-col gap-0.5">
								<span
									class="inline-flex items-center gap-1 text-xs
									{service.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}"
								>
									{#if service.isActive}
										<ToggleRight class="size-3.5" />Active
									{:else}
										<ToggleLeft class="size-3.5" />Inactive
									{/if}
								</span>
								{#if !service.bookingEnabled}
									<span class="text-[10px] text-rose-500 dark:text-rose-400">Bookings off</span>
								{/if}
							</div>
						</td>

						<!-- Action -->
						<td class="px-4 py-3 text-right">
							<Button
								size="sm"
								variant="ghost"
								onclick={() => goto(`/dashboard/services/${service.id}`)}
								class="h-8 gap-1.5 px-3 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100"
							>
								View <ArrowRight class="size-3" />
							</Button>
						</td>
					</tr>
				{/each}
			</tbody>

			{#if filtered().length > 0}
				<tfoot class="border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/40">
					<tr>
						<td colspan="4" class="px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">
							{filtered().length} service{filtered().length !== 1 ? 's' : ''} · {filtered().filter(
								(s) => s.isActive
							).length} active
						</td>
						<td colspan="7" class="px-4 py-2.5 text-right text-xs text-gray-500 dark:text-gray-400">
							Avg rating:
							<span class="font-semibold text-gray-700 dark:text-gray-200">
								{#if filtered().some((s) => (s.ratingCount ?? 0) > 0)}
									{(() => {
										const rated = filtered().filter((s) => (s.ratingCount ?? 0) > 0);
										return (
											rated.reduce((s, v) => s + (v.averageRating ?? 0), 0) / rated.length
										).toFixed(1);
									})()}
								{:else}
									—
								{/if}
							</span>
						</td>
					</tr>
				</tfoot>
			{/if}
		</table>
	</div>
</div>

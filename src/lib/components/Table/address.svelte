<script lang="ts">
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import DialogComp from '$lib/formComponents/DialogComp.svelte';
	import {
		MapPinIcon,
		GlobeIcon,
		MapIcon,
		NavigationIcon,
		BuildingIcon,
		Home,
		CompassIcon
	} from '@lucide/svelte';

	interface Props {
		locationCity?: string | null;
		locationState?: string | null;
		locationCountry?: string | null;
		primaryAddress?: string | null;
		latitude?: number | null;
		longitude?: number | null;
	}

	const {
		locationCity,
		locationState,
		locationCountry,
		primaryAddress,
		latitude,
		longitude
	}: Props = $props();

	// Derived full string for the header/description
	let concatenatedAddress = $derived(
		[primaryAddress, locationCity, locationState, locationCountry].filter(Boolean).join(', ') ||
			'No address provided'
	);

	// Determine if we have enough data to show anything
	const hasAddress = $derived(
		!!(
			locationCity ||
			locationState ||
			locationCountry ||
			primaryAddress ||
			(latitude && longitude)
		)
	);

	// URL for Google Maps Embed using Coordinates if available, otherwise address string
	let mapSrc = $derived.by(() => {
		if (latitude && longitude) {
			return `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
		}
		return `https://maps.google.com/maps?q=${encodeURIComponent(concatenatedAddress)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
	});

	function truncate(str: string, maxLength = 25) {
		const safeStr = String(str || '');
		return safeStr.length > maxLength ? safeStr.slice(0, maxLength) + '...' : safeStr;
	}

	// Updated hierarchy to reflect City/State/Country
	const hierarchyItems = $derived(
		[
			{
				label: 'Country',
				value: locationCountry,
				icon: GlobeIcon,
				color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
			},
			{
				label: 'State/Region',
				value: locationState,
				icon: MapIcon,
				color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
			},
			{
				label: 'City',
				value: locationCity,
				icon: BuildingIcon,
				color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
			},
			{
				label: 'Address',
				value: primaryAddress,
				icon: Home,
				color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
			},
			{
				label: 'Coordinates',
				value: latitude && longitude ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : null,
				icon: CompassIcon,
				color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
			}
		].filter((item) => item.value)
	); // Only show items that have data
</script>

<DialogComp
	title={truncate(concatenatedAddress)}
	description={concatenatedAddress}
	IconComp={MapPinIcon}
	variant="secondary"
>
	{#if hasAddress}
		<div class="space-y-4">
			<div class="space-y-3">
				<h4 class="text-sm font-semibold">Location Details</h4>
				<div class="flex flex-col gap-2">
					{#each hierarchyItems as item, index (item.label)}
						<div class="relative flex items-start gap-3">
							{#if index < hierarchyItems.length - 1}
								<div class="absolute top-8 left-[15px] h-6 w-0.5 bg-border"></div>
							{/if}

							<div class={['shrink-0 rounded-md border p-1.5', item.color]}>
								<item.icon class="size-4" />
							</div>

							<div class="min-w-0 flex-1 py-0.5">
								<p class="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
									{item.label}
								</p>
								<p class="truncate text-sm font-medium">{item.value}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="overflow-hidden rounded-lg border bg-muted">
				<iframe
					title="Google Map"
					width="100%"
					height="300"
					frameborder="0"
					style="border:0"
					src={mapSrc}
					allowfullscreen
				></iframe>
			</div>
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center py-10 text-center">
			<MapPinIcon class="mb-2 size-8 text-muted-foreground/50" />
			<div class="text-sm text-muted-foreground">No location information available</div>
		</div>
	{/if}
</DialogComp>

<script lang="ts">
	// Configuration Maps directly matching your database keys
	const FIELD_LABELS: Record<string, string> = {
		title: 'Service Title',
		short_description: 'Short Summary',
		full_description: 'Full Description',
		cover_image_url: 'Main Cover Photo',
		gallery_image_urls: 'Gallery Collections',
		base_price: 'Base Price Rate',
		price_min: 'Minimum Allowed Range',
		price_max: 'Maximum Allowed Range',
		pricing_type: 'Pricing Structure Type',
		pricing_mode: 'Operational Pricing Mode',
		location_type: 'Service Fulfillment Type',
		service_radius_km: 'Operational Coverage Radius',
		estimated_duration_minutes: 'Estimated Execution Duration',
		min_booking_notice_hours: 'Minimum Lead Notice Time',
		max_daily_bookings: 'Max Bookings Per Single Day',
		latitude: 'Fulfillment Coordinates (Lat)',
		longitude: 'Fulfillment Coordinates (Lng)',
		is_active: 'Global Status Visibility',
		booking_enabled: 'Booking Engine Operations',
		allow_images: 'Customer Image Attachments',
		requires_before_image: 'Mandatory Prior Evidence Image',
		requires_after_image: 'Mandatory Outcome Evidence Image'
	};

	const HIGH_RISK_FIELDS = new Set([
		'base_price',
		'price_min',
		'price_max',
		'pricing_type',
		'pricing_mode',
		'latitude',
		'longitude',
		'is_active'
	]);

	function classifyFieldKind(
		key: string
	): 'currency' | 'image' | 'gallery' | 'boolean' | 'number' | 'text' {
		if (['base_price', 'price_min', 'price_max'].includes(key)) return 'currency';
		if (key === 'cover_image_url') return 'image';
		if (key === 'gallery_image_urls') return 'gallery';
		if (
			typeof key === 'boolean' ||
			key.startsWith('allow_') ||
			key.startsWith('requires_') ||
			key === 'booking_enabled' ||
			key === 'is_active'
		)
			return 'boolean';
		if (
			[
				'service_radius_km',
				'estimated_duration_minutes',
				'min_booking_notice_hours',
				'max_daily_bookings',
				'latitude',
				'longitude'
			].includes(key)
		)
			return 'number';
		return 'text';
	}

	interface Props {
		requestedFields: Record<string, any>;
		beforeSnapshot: Record<string, any>;
		pendingSnapshot: Record<string, any>;
	}

	let { requestedFields = {}, beforeSnapshot = {}, pendingSnapshot = {} }: Props = $props();

	// Read keys directly out of the patch update payload object
	let changedKeys = $derived(Object.keys(requestedFields || {}));

	function formatCurrency(val: any) {
		const num = Number(val);
		return isNaN(num)
			? '—'
			: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
	}
</script>

<div class="space-y-4">
	{#if changedKeys.length === 0}
		<div
			class="rounded-lg border border-dashed bg-zinc-50 p-6 text-center text-sm text-zinc-500 dark:bg-zinc-900"
		>
			No active field mutations detected in this request patch layer.
		</div>
	{:else}
		<div
			class="divide-y divide-zinc-200 overflow-hidden rounded-lg border bg-white dark:divide-zinc-800 dark:bg-zinc-950"
		>
			{#each changedKeys as key}
				{@const kind = classifyFieldKind(key)}
				{@const isHighRisk = HIGH_RISK_FIELDS.has(key)}
				{@const label = FIELD_LABELS[key] || key}

				<div
					class="p-4 transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 {isHighRisk
						? 'bg-amber-50/20 dark:bg-amber-950/10'
						: ''}"
				>
					<div class="mb-2 flex items-center justify-between gap-2">
						<span class="text-sm font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
						{#if isHighRisk}
							<span
								class="inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
							>
								⚠️ Verification Critical
							</span>
						{/if}
					</div>

					<div class="mt-1 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
						<div
							class="rounded border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50"
						>
							<span class="mb-1 block text-xs font-semibold text-zinc-400 uppercase"
								>Previous Live State</span
							>

							{#if kind === 'currency'}
								<span class="font-mono text-zinc-500 line-through"
									>{formatCurrency(beforeSnapshot?.[key])}</span
								>
							{:else if kind === 'boolean'}
								<span
									class="rounded px-2 py-0.5 text-xs font-medium {beforeSnapshot?.[key]
										? 'bg-emerald-100 text-emerald-800'
										: 'bg-rose-100 text-rose-800'}"
								>
									{beforeSnapshot?.[key] ? 'Yes / Enabled' : 'No / Disabled'}
								</span>
							{:else if kind === 'image'}
								{#if beforeSnapshot?.[key]}
									<img
										src={beforeSnapshot[key]}
										alt="Original asset preview"
										class="mt-1 h-16 w-24 rounded border object-cover opacity-60"
									/>
								{:else}
									<span class="text-xs text-zinc-400 italic">No media resource assigned</span>
								{/if}
							{:else if kind === 'gallery'}
								<div class="mt-1 flex flex-wrap gap-1">
									{#each beforeSnapshot?.[key] || [] as img}
										<img
											src={img}
											alt="Gallery mini thumbnail"
											class="h-12 w-12 rounded border object-cover opacity-60"
										/>
									{/each}
								</div>
							{:else}
								<p class="font-sans break-words whitespace-pre-wrap text-zinc-500">
									{beforeSnapshot?.[key] ?? '—'}
								</p>
							{/if}
						</div>

						<div
							class="rounded border border-emerald-100/50 bg-emerald-50/20 p-3 dark:border-emerald-900/30 dark:bg-emerald-950/10"
						>
							<span
								class="mb-1 block text-xs font-semibold text-emerald-600/80 uppercase dark:text-emerald-400"
								>Proposed Update</span
							>

							{#if kind === 'currency'}
								<span class="font-mono font-bold text-emerald-700 dark:text-emerald-400"
									>{formatCurrency(pendingSnapshot?.[key])}</span
								>
							{:else if kind === 'boolean'}
								<span
									class="rounded px-2 py-0.5 text-xs font-medium {pendingSnapshot?.[key]
										? 'bg-emerald-600 text-white'
										: 'bg-rose-600 text-white'}"
								>
									{pendingSnapshot?.[key] ? 'Yes / Enabled' : 'No / Disabled'}
								</span>
							{:else if kind === 'image'}
								{#if pendingSnapshot?.[key]}
									<img
										src={pendingSnapshot[key]}
										alt="Proposed asset preview"
										class="mt-1 h-16 w-24 rounded border border-emerald-300 object-cover shadow-sm"
									/>
								{:else}
									<span class="text-xs text-rose-500 italic">Removing asset media link</span>
								{/if}
							{:else if kind === 'gallery'}
								<div class="mt-1 flex flex-wrap gap-1">
									{#each pendingSnapshot?.[key] || [] as img}
										<img
											src={img}
											alt="Proposed gallery asset"
											class="h-12 w-12 rounded border border-emerald-300 object-cover"
										/>
									{/each}
								</div>
							{:else}
								<p
									class="font-medium break-words whitespace-pre-wrap text-emerald-950 dark:text-emerald-300"
								>
									{pendingSnapshot?.[key] ?? '—'}
								</p>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

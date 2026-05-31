<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Search, MapPin, Star, Briefcase, ShieldCheck, Clock } from '@lucide/svelte';

	type Provider = {
		id: string;
		role: string;
		firstName: string | null;
		lastName: string | null;
		email: string | null;
		phoneNumber: string | null;
		profilePhotoUrl: string | null;
		bio: string | null;
		locationCity: string | null;
		locationState: string | null;
		locationCountry: string | null;
		primaryAddress: string | null;
		latitude: number | null;
		longitude: number | null;
		ratingAverage: number;
		ratingCount: number;
		isVerifiedProvider: boolean;
		verificationStatus: string;
		createdAt: Date | null;
		updatedAt: Date | null;
		version: number | null;
		stripeCustomerId: string | null;
		banned: boolean | null;
		banReason: string | null;
		bannedAt: Date | null;
		bannedBy: string | null;
		numberOfServices: number;
	};

	let { providers = [] }: { providers: Provider[] } = $props();

	let searchQuery = $state('');

	const filtered = $derived(
		providers.filter((p) => {
			const q = searchQuery.toLowerCase();
			if (!q) return true;
			const fullName = `${p.firstName ?? ''} ${p.lastName ?? ''}`.toLowerCase();
			const email = (p.email ?? '').toLowerCase();
			const city = (p.locationCity ?? '').toLowerCase();
			const state = (p.locationState ?? '').toLowerCase();
			return fullName.includes(q) || email.includes(q) || city.includes(q) || state.includes(q);
		})
	);

	function initials(p: Provider) {
		return `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase() || '?';
	}

	function locationLabel(p: Provider) {
		return [p.locationCity, p.locationState, p.locationCountry].filter(Boolean).join(', ');
	}

	function verificationBadge(status: string) {
		switch (status) {
			case 'approved':
				return { label: 'Verified', variant: 'default' } as const;
			case 'pending':
				return { label: 'Pending', variant: 'secondary' } as const;
			case 'rejected':
				return { label: 'Rejected', variant: 'destructive' } as const;
			default:
				return { label: 'Not Started', variant: 'outline' } as const;
		}
	}

	function stars(avg: number) {
		return Math.round(avg * 2) / 2;
	}
</script>

<div class="mx-auto block w-full space-y-4 px-4 py-6 lg:hidden">
	<!-- Header -->
	<div class="space-y-1">
		<h1 class="text-2xl font-semibold tracking-tight">Providers</h1>
		<p class="text-sm text-muted-foreground">
			{filtered.length} of {providers.length} provider{providers.length !== 1 ? 's' : ''}
		</p>
	</div>

	<!-- Search -->
	<div class="relative">
		<Search
			class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
		/>
		<Input
			type="search"
			placeholder="Search by name, email or location…"
			bind:value={searchQuery}
			class="h-10 w-full pl-9"
		/>
	</div>

	<!-- List -->
	{#if filtered.length === 0}
		<div class="flex flex-col items-center justify-center gap-2 py-16 text-center">
			<Search class="h-8 w-8 text-muted-foreground/40" />
			<p class="text-sm text-muted-foreground">No providers match your search.</p>
		</div>
	{:else}
		<ul class="space-y-3">
			{#each filtered as provider (provider.id)}
				{@const vb = verificationBadge(provider.verificationStatus)}
				{@const loc = locationLabel(provider)}
				<li>
					<Card
						class="overflow-hidden transition-shadow hover:shadow-md {provider.banned
							? 'opacity-60'
							: ''}"
					>
						<CardContent class="p-4">
							<div class="flex items-start gap-3">
								<!-- Avatar -->
								<Avatar class="h-12 w-12 shrink-0 ring-2 ring-border">
									<AvatarImage
										src={provider.profilePhotoUrl ?? undefined}
										alt="{provider.firstName} {provider.lastName}"
									/>
									<AvatarFallback class="text-sm font-medium">{initials(provider)}</AvatarFallback>
								</Avatar>

								<!-- Main content -->
								<div class="min-w-0 flex-1 space-y-1.5">
									<!-- Name row -->
									<div class="flex flex-wrap items-center gap-2">
										<span class="truncate text-sm leading-none font-semibold">
											{provider.firstName ?? ''}
											{provider.lastName ?? ''}
										</span>
										{#if provider.isVerifiedProvider}
											<ShieldCheck class="h-4 w-4 shrink-0 text-blue-500" />
										{/if}
										{#if provider.banned}
											<Badge variant="destructive" class="py-0 text-xs">Banned</Badge>
										{/if}
									</div>

									<!-- Email -->
									{#if provider.email}
										<p class="truncate text-xs text-muted-foreground">{provider.email}</p>
									{/if}

									<!-- Location -->
									{#if loc}
										<div class="flex items-center gap-1 text-xs text-muted-foreground">
											<MapPin class="h-3 w-3 shrink-0" />
											<span class="truncate">{loc}</span>
										</div>
									{/if}

									<!-- Stats row -->
									<div class="flex flex-wrap items-center gap-3 pt-0.5">
										<!-- Rating -->
										<div class="flex items-center gap-1 text-xs">
											<Star class="h-3 w-3 fill-amber-400 text-amber-400" />
											<span class="font-medium">{stars(provider.ratingAverage).toFixed(1)}</span>
											<span class="text-muted-foreground">({provider.ratingCount})</span>
										</div>

										<!-- Services -->
										<div class="flex items-center gap-1 text-xs text-muted-foreground">
											<Briefcase class="h-3 w-3" />
											<span
												>{provider.numberOfServices} service{provider.numberOfServices !== 1
													? 's'
													: ''}</span
											>
										</div>

										<!-- Verification badge -->
										<Badge variant={vb.variant} class="h-5 py-0 text-xs">{vb.label}</Badge>
									</div>

									<!-- Bio -->
									{#if provider.bio}
										<p class="line-clamp-2 pt-0.5 text-xs text-muted-foreground">{provider.bio}</p>
									{/if}
								</div>

								<!-- Created date (desktop only) -->
								{#if provider.createdAt}
									<div
										class="mt-0.5 hidden shrink-0 items-center gap-1 self-start text-xs text-muted-foreground sm:flex"
									>
										<Clock class="h-3 w-3" />
										<span>{new Date(provider.createdAt).toLocaleDateString()}</span>
									</div>
								{/if}
							</div>
						</CardContent>
					</Card>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import {
		HeartIcon,
		UtensilsIcon,
		GraduationCapIcon,
		TruckIcon,
		LeafIcon,
		CookieIcon
	} from '@lucide/svelte';
	import { fly } from 'svelte/transition';

	const highlights = [
		{
			icon: GraduationCapIcon,
			label: 'Bake-ucation',
			description: 'A real-world learning ground for the Melela team.'
		},
		{
			icon: LeafIcon,
			label: 'Locally Rooted',
			description: 'Supporting Ethiopian agro-businesses.'
		},
		{
			icon: TruckIcon,
			label: 'Fair Delivery',
			description: '100% of fees go directly to our drivers.'
		},
		{
			icon: HeartIcon,
			label: 'Guilt-Free',
			description: 'Health-conscious & fasting-friendly options.'
		}
	];

	const services = [
		'Marvelous Muffins',
		'Naked Cupcakes',
		'Grandma’s Cookies',
		'Chuchi Bites',
		'Corporate Gifts',
		'Wholesale'
	];

	const subBrands = [
		{
			name: 'Amy & Chuche',
			description: 'The heart of the kitchen and our fastest taste-testing "Spokes-Puppy".'
		},
		{
			name: 'The Amy Baksters',
			description: 'Our exclusive WhatsApp community for early access and promos.'
		}
	];
</script>

<section
	class="relative bg-linear-to-b from-background via-rose-50/20 to-background px-4 py-16 sm:px-6 lg:px-8"
>
	<div class="mx-auto max-w-5xl">
		<div transition:fly={{ y: 20, duration: 600 }} class="mb-12 flex flex-col gap-3 text-center">
			<h2 class="text-3xl font-bold text-foreground sm:text-4xl">The Amy Bakes Story</h2>
			<p class="mx-auto max-w-2xl text-base text-foreground/70">
				What started as Amy baking for every Melela Partners training session evolved into a
				hands-on business laboratory where we practice exactly what we consult.
			</p>
		</div>

		<div class="mb-12 grid gap-6 lg:grid-cols-3">
			<div transition:fly={{ y: 20, duration: 600, delay: 100 }} class="lg:col-span-2">
				<Card class="h-full border-rose-100 shadow-sm">
					<CardHeader class="pb-3">
						<CardTitle class="text-xl">The Why Behind the Whisk</CardTitle>
						<CardDescription>From Training Room to Tasting Room</CardDescription>
					</CardHeader>
					<CardContent class="flex flex-col gap-3 text-sm sm:text-base">
						<p class="leading-relaxed text-foreground/80">
							Amy Bakes was born from a simple philosophy: you can’t consult businesses if you’ve
							never truly run one. Amy began by baking for her teams; today, it is a real-world
							classroom for sourcing, pricing, and testing recipes.
						</p>
						<p class="leading-relaxed text-foreground/80">
							Every muffin and cookie is a lesson in quality. Whether it's our "Less Guilt" muffins
							or our authentic American-style chewy cookies, we believe that business—like
							baking—requires the perfect balance of heart and precision.
						</p>
					</CardContent>
				</Card>
			</div>
			<img
				src="/files/mascot.webp"
				alt="Chuche the Spokes-Puppy"
				class="w-auto transition-transform duration-500 hover:scale-110"
			/>
			<div
				transition:fly={{ y: 20, duration: 600, delay: 200 }}
				class="grid w-full grid-cols-1 gap-3 lg:col-span-3 lg:grid-cols-4"
			>
				{#each highlights as highlight (highlight.label)}
					<Card class="border-rose-100 bg-background/50 transition-all hover:bg-background">
						<CardContent class="flex items-center gap-3 p-4">
							<div class="shrink-0">
								<div class="flex size-9 items-center justify-center rounded-full bg-rose-100">
									<svelte:component this={highlight.icon} class="size-5 text-rose-500" />
								</div>
							</div>
							<div class="min-w-0 flex-1">
								<p class="text-xs font-bold tracking-wide text-foreground uppercase">
									{highlight.label}
								</p>
								<p class="text-xs text-foreground/60">{highlight.description}</p>
							</div>
						</CardContent>
					</Card>
				{/each}
			</div>
		</div>

		<div transition:fly={{ y: 20, duration: 600, delay: 300 }} class="mb-12">
			<Card class="border-rose-100 shadow-sm">
				<CardHeader class="pb-4">
					<CardTitle class="text-center text-lg">Our Signature Treats</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
						{#each services as service (service)}
							<div
								class="flex flex-col items-center gap-2 rounded-xl border border-rose-50 bg-rose-50/30 p-4 text-center transition-all hover:border-rose-200"
							>
								<span class="text-sm font-semibold text-foreground">{service}</span>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>
		</div>

		<div transition:fly={{ y: 20, duration: 600, delay: 400 }}>
			<div class="rounded-2xl bg-linear-to-r from-rose-50 to-purple-50 p-6 sm:p-8">
				<div class="mb-6 text-center">
					<h3 class="text-xl font-bold">Join the Family</h3>
					<p class="text-sm text-foreground/70">From our kitchen to your community</p>
				</div>
				<div class="grid gap-4 md:grid-cols-2">
					{#each subBrands as brand (brand.name)}
						<div class="rounded-xl bg-white/80 p-5 shadow-sm backdrop-blur-sm">
							<h4 class="mb-1 text-sm font-bold tracking-tight text-rose-600 uppercase">
								{brand.name}
							</h4>
							<p class="text-xs text-foreground/70">{brand.description}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>

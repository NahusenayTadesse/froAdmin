<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ShoppingBagIcon, CookieIcon } from '@lucide/svelte';
	import { fly } from 'svelte/transition';
</script>

<section class="relative min-h-dvh w-full overflow-hidden bg-primary">
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div
			class="absolute top-20 right-1/3 size-72 rounded-full bg-primary-foreground/10 blur-3xl"
		></div>
		<div
			class="absolute bottom-20 left-10 size-96 rounded-full bg-primary-foreground/5 blur-3xl"
		></div>
	</div>

	<div
		class="relative z-10 mx-auto flex min-h-dvh max-w-7xl flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8"
	>
		<div class="grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-16">
			<div class="order-2 space-y-8 lg:order-1">
				<div
					transition:fly={{ y: -20, duration: 600, delay: 100 }}
					class="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-4 py-2 backdrop-blur-sm"
				>
					<CookieIcon class="size-4 text-primary-foreground" />
					<span class="text-sm font-medium text-primary-foreground">Freshly Baked Daily</span>
				</div>

				<div transition:fly={{ y: 20, duration: 600, delay: 200 }} class="space-y-4">
					<h1
						class="text-5xl font-bold tracking-tight text-primary-foreground sm:text-6xl lg:text-7xl"
					>
						Amy Bakes <br />
						<span class="opacity-90">Cookies & Muffins</span>
					</h1>
				</div>

				<div transition:fly={{ y: 20, duration: 600, delay: 300 }} class="flex flex-col gap-4">
					<p class="text-xl font-semibold text-primary-foreground/80 italic sm:text-2xl">
						Taste Happiness in Every Bite
					</p>
					<p class="max-w-xl text-lg leading-relaxed text-primary-foreground/70">
						From gooey chocolate chip centers to fluffy, golden-domed muffins, we use only the
						finest ingredients to craft treats that warm your soul.
					</p>
				</div>

				<div
					transition:fly={{ y: 20, duration: 600, delay: 400 }}
					class="flex flex-col gap-4 pt-4 sm:flex-row"
				>
					<Button
						size="lg"
						href="/shop"
						class="group bg-primary-foreground text-primary hover:bg-primary-foreground/90"
					>
						Order Now
						<ShoppingBagIcon class="ml-2 size-5 transition-transform group-hover:scale-110" />
					</Button>
					<Button
						size="lg"
						href="/about-us"
						variant="outline"
						class="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10"
					>
						Learn More
					</Button>
				</div>

				<div
					transition:fly={{ y: 20, duration: 600, delay: 500 }}
					class="grid grid-cols-3 gap-4 border-t border-primary-foreground/20 pt-8 sm:gap-8"
				>
					{#each [{ label: 'Unique Flavors', value: '24' }, { label: 'Happy Foodies', value: '5k+' }, { label: 'Natural Ingredients', value: '100%' }] as stat (stat.label)}
						<div class="flex flex-col gap-2">
							<p class="text-2xl font-bold text-primary-foreground sm:text-3xl">{stat.value}</p>
							<p class="text-sm text-primary-foreground/60">{stat.label}</p>
						</div>
					{/each}
				</div>
			</div>

			<div class="order-1 lg:order-2" transition:fly={{ x: 20, duration: 600, delay: 200 }}>
				<div
					class="relative aspect-video w-full overflow-hidden rounded-2xl border-4 border-primary-foreground/20 shadow-2xl"
				>
					<iframe
						class="absolute inset-0 h-full w-full"
						src="https://www.youtube.com/embed/rEdl2Uetpvo"
						title="How To Make Perfect Chocolate Chip Cookies"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						referrerpolicy="strict-origin-when-cross-origin"
						allowfullscreen
					></iframe>
				</div>
			</div>
		</div>
	</div>
</section>

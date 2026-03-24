<script lang="ts">
	import { SearchIcon, ShoppingBag, Flower, MenuIcon, XIcon, CookieIcon } from '@lucide/svelte';
	import { Input } from '$lib/components/ui/input';
	import DarkMode from './DarkMode.svelte';
	let mobileMenuOpen = $state(false);

	import { Sheet, SheetContent, SheetTrigger } from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';

	let isOpen = $state(false);

	const handleMenuClick = (href: string) => {
		isOpen = false;
	};
	import { page } from '$app/state';

	const menuItems = [
		{ label: 'Home', href: '/' },

		{ label: 'About Us', href: '/about-us' },

		{ label: 'Shop', href: '/shop' },
		{ label: 'Contact Us', href: '/contact-us' }
	];
</script>

<header
	class="sticky top-0 z-50 w-full bg-primary px-2 py-2 backdrop-blur supports-backdrop-filter:bg-primary lg:px-16"
>
	<div class="flex h-14 items-center justify-between px-4 md:px-6">
		<!-- Logo/Title -->
		<div class="flex shrink-0 items-center gap-2">
			<a href="/" class="inline-block">
				<img
					src="/logo.webp"
					width="128"
					height="96"
					class="h-16 w-auto object-contain"
					alt="Amy Bakes Home"
					fetchpriority="high"
				/>
			</a>

			<!-- <span class="text-xl font-bold text-foreground">Lalo Bakery Solution</span> -->
		</div>

		<!-- Desktop Menu -->
		<nav class="hidden items-center gap-1 md:flex">
			{#each menuItems as item (item.href)}
				<Button
					variant={page.url.pathname === item.href ? 'secondary' : 'default'}
					size="sm"
					href={item.href}
					onclick={() => handleMenuClick(item.href)}
				>
					{item.label}
				</Button>
			{/each}
		</nav>

		<div class="flex flex-row items-center justify-end">
			<div class="m-2">
				<!-- Search and Auth -->
			</div>
			<DarkMode />
		</div>

		<!-- Mobile Menu -->
		<div class="md:hidden">
			<Sheet bind:open={isOpen}>
				<SheetTrigger>
					{#snippet child({ props: triggerProps })}
						<Button variant="default" size="icon" {...triggerProps}>
							{#if isOpen}
								<XIcon class="size-5" />
							{:else}
								<MenuIcon class="size-5" />
							{/if}
						</Button>
					{/snippet}
				</SheetTrigger>
				<SheetContent side="right" class="w-64">
					<nav class="mt-8 flex flex-col gap-2">
						{#each menuItems as item (item.href)}
							<Button
								variant="ghost"
								href={item.href}
								class="justify-start"
								onclick={() => handleMenuClick(item.href)}
							>
								{item.label}
							</Button>
						{/each}
					</nav>
				</SheetContent>
			</Sheet>
		</div>
	</div>
</header>

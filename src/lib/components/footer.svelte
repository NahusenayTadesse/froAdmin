<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import {
		MailIcon,
		PhoneIcon,
		MapPinIcon,
		MessageCircleIcon,
		MapPin,
		Cookie,
		Facebook,
		Send,
		Instagram
	} from '@lucide/svelte';
	let email = $state('');

	const handleNewsletterSubmit = (e: Event) => {
		e.preventDefault();
		// Beauty brands often use "Join the Glam Club" or "Get 10% off your first treatment"
		console.log('Glam Newsletter signup:', email);
		email = '';
	};

	const socialLinks = [
		{
			name: 'Instagram',
			// Updated placeholder handles to reflect the brand
			url: 'https://www.instagram.com/amybakes',
			icon: Instagram,
			color: 'hover:text-pink-500'
		},
		{
			name: 'Facebook',
			url: 'https://www.facebook.com/@amybakes',
			icon: Facebook,
			color: 'hover:text-black dark:hover:text-white'
		},

		{
			name: 'Telegram',
			url: 'https://t.me/AmyBakes',
			icon: Send,
			color: 'hover:text-blue-400'
		}
	];
</script>

<footer class="border-t bg-card text-card-foreground">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="mb-8 grid grid-cols-1 gap-12 md:grid-cols-3">
			<div class="space-y-4">
				<div class="flex items-center gap-2">
					<Cookie class="size-8 text-primary" />
					<span class="text-xl font-bold tracking-tight">Amy Bakes</span>
				</div>
				<h4 class="font-semibold text-primary">Cookies and Muffins</h4>
				<p class="max-w-xs text-sm text-foreground/70">
					Freshly baked cookies and muffins made with love, perfect for every sweet moment.
				</p>

				<div class="flex flex-col gap-3 pt-2 text-sm">
					<a
						href="https://maps.app.goo.gl/RLC2iCgNoqqu4ssC8"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-start gap-2 text-foreground/70 transition-colors hover:text-primary"
					>
						<MapPinIcon class="mt-0.5 size-4 shrink-0" />
						<span>Shola, Addis Ababa, Ethiopia</span>
					</a>
					<a
						href="tel:0996983244"
						class="flex items-center gap-2 text-foreground/70 transition-colors hover:text-primary"
					>
						<PhoneIcon class="size-4 shrink-0" />
						<span>+251 996983244</span>
					</a>
					<a
						href="mailto:hello@amybakes.com"
						class="flex items-center gap-2 text-foreground/70 transition-colors hover:text-primary"
					>
						<MailIcon class="size-4 shrink-0" />
						<span>hello@amybakes.com</span>
					</a>
				</div>
			</div>

			<div class="md:pl-12">
				<h4 class="mb-4 font-semibold">Quick Links</h4>
				<ul class="flex flex-col gap-3 text-sm">
					<li>
						<a href="/" class="text-foreground/70 transition-colors hover:text-primary">Home</a>
					</li>

					<li>
						<a href="/about-us" class="text-foreground/70 transition-colors hover:text-primary"
							>Our Story</a
						>
					</li>
					<li>
						<a href="/shop" class="font-medium text-primary transition-colors hover:underline">
							Shop</a
						>
					</li>
					<li>
						<a href="/contact-us" class="text-foreground/70 transition-colors hover:text-primary"
							>Contact & Support</a
						>
					</li>
				</ul>
			</div>

			<div class="space-y-4">
				<h4 class="flex items-center gap-2 font-semibold">
					<MapPin class="size-4" /> Find Us
				</h4>

				<img
					src="/files/motor.webp"
					alt="Chuche the Spokes-Puppy"
					class="h-48 w-auto transition-transform duration-500 hover:scale-110"
				/>
				<div class="overflow-hidden rounded-2xl border bg-muted">
					<iframe
						src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4342.005005207254!2d38.79191906137545!3d9.02238228049564!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b8565d4a30387%3A0x1cf0bebcc87aa5b2!2sShola%20Market!5e0!3m2!1sen!2set!4v1772700056618!5m2!1sen!2set"
						style="border:0;"
						class="h-40 w-full opacity-80 contrast-125 grayscale transition-all hover:opacity-100 hover:grayscale-0"
						loading="lazy"
						title="Amy Bakes Location"
					></iframe>
				</div>
				<p class="text-xs text-foreground/50 italic">Open Monday — Sunday: 9:00 AM - 8:00 PM</p>
			</div>
		</div>

		<div class="mt-12 border-t pt-8">
			<div class="flex flex-col items-center justify-between gap-8 md:flex-row">
				<div class="flex flex-col items-center gap-4">
					<p class="text-xs font-medium tracking-widest text-foreground/50 uppercase">
						Follow Our Journey
					</p>
					<div class="flex gap-3">
						{#each socialLinks as social (social.url)}
							<a
								href={social.url}
								target="_blank"
								rel="noopener noreferrer"
								class={[
									'group flex items-center justify-center rounded-full border p-3 transition-all hover:border-primary hover:shadow-md',
									social.color
								]}
								title={social.name}
							>
								<social.icon class="h-5 w-5 transition-transform group-hover:scale-110" />
							</a>
						{/each}
					</div>
				</div>
			</div>

			<div class="mt-12 border-t border-border/50 pt-8 text-center text-xs text-foreground/50">
				<p>
					© {new Date().getFullYear()} Amy Bakes. Authentic Baking. All rights reserved. Powered By:
					<a
						href="https://leoradigitals.com"
						target="_blank"
						rel="noopener noreferrer"
						class="text-foreground/50 hover:text-foreground"
					>
						Leora Digitals
					</a>
				</p>
			</div>
		</div>
	</div>
</footer>

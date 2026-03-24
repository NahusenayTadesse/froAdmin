<script lang="ts">
	import {
		Accordion,
		AccordionItem,
		AccordionTrigger,
		AccordionContent
	} from '$lib/components/ui/accordion';
	import {
		SparklesIcon,
		LeafIcon,
		HeartIcon,
		GraduationCapIcon,
		ShoppingBagIcon,
		TruckIcon
	} from '@lucide/svelte';
	import Button from './ui/button/button.svelte';

	const features = [
		{
			id: 'bake-ucation',
			title: 'What is a "Bake-ucation"?',
			description:
				'It’s our philosophy that the best consultants are practitioners. Amy Bakes serves as a real-world business laboratory where our team learns everything from supply chain management to customer delight.',
			icon: GraduationCapIcon
		},
		{
			id: 'ingredients',
			title: 'Are your bakes healthy?',
			description:
				'We offer "Marvelous Muffins" made with oatmeal, olive oil, and bananas for a healthy twist, alongside "Naked Cupcakes" for pure indulgence. We also test new fasting-friendly recipes weekly.',
			icon: LeafIcon
		},
		{
			id: 'delivery-fees',
			title: 'Where do delivery fees go?',
			description:
				'We believe in fair pay. 100% of our delivery fees go directly to our incredible delivery team to support their hard work and dedication.',
			icon: TruckIcon
		},
		{
			id: 'chuchi-bites',
			title: 'What are Chuchi Bites?',
			description:
				'Specially crafted, dog-friendly treats inspired by our spokes-puppy, Chuche. They are the perfect healthy snack for your furry "buchila" friends.',
			icon: HeartIcon
		},
		{
			id: 'corporate-orders',
			title: 'Do you offer bulk discounts?',
			description:
				'Yes! We provide bulk discounts and branded packaging for corporate gifts, events, and wholesale partnerships with local cafés.',
			icon: ShoppingBagIcon
		},
		{
			id: 'bakster-community',
			title: 'How do I become an "Amy Bakster"?',
			description:
				'Simply join our WhatsApp community! You will get exclusive access to new recipe tests, flash promos, and special discounts.',
			icon: SparklesIcon
		}
	];
</script>

<div
	class="min-h-dvh bg-linear-to-br from-primary/5 via-background to-accent/5 px-4 py-12 sm:px-6 lg:px-8"
>
	<div class="mx-auto max-w-3xl">
		<!-- Header -->
		<div class="mb-12 text-center">
			<h1 class="mb-4 text-4xl font-bold text-foreground sm:text-5xl">Why Choose Us</h1>
			<p class="text-lg text-muted-foreground">
				Discover what makes our bakery solutions exceptional
			</p>
		</div>

		<!-- Accordion -->
		<Accordion type="single" collapsible class="w-full space-y-3">
			{#each features as feature (feature.id)}
				<AccordionItem
					value={feature.id}
					class="hover:shadow-lg-md transition-shadow-lg overflow-hidden rounded-lg border border-border shadow-lg duration-200"
				>
					<AccordionTrigger
						class="px-6 py-4 transition-colors duration-200 hover:bg-accent/5 [&[data-state=open]]:bg-primary/5"
					>
						<div class="flex items-center gap-4 text-left">
							<div class="shrink-0 rounded-lg bg-primary/10 p-2">
								<svelte:component this={feature.icon} class="size-5 text-primary" />
							</div>
							<h3 class="text-lg font-semibold text-foreground">{feature.title}</h3>
						</div>
					</AccordionTrigger>
					<AccordionContent class="border-t border-border bg-card/50 px-6 py-4">
						<p class="leading-relaxed text-muted-foreground">{feature.description}</p>
					</AccordionContent>
				</AccordionItem>
			{/each}
		</Accordion>
	</div>
</div>

<script lang="ts">
	import { Card } from "$lib/components/ui/card";
	import { Button } from "$lib/components/ui/button";
	import { ChevronLeftIcon, ChevronRightIcon, ImageIcon } from "@lucide/svelte";

	type Props = {
		title: string;
		images: string[];
	};

	const { title, images }: Props = $props();

	let currentIndex = $state(0);

	const goNext = () => {
		if (currentIndex < images.length - 1) {
			currentIndex++;
		}
	};

	const goPrev = () => {
		if (currentIndex > 0) {
			currentIndex--;
		}
	};
</script>

<div class="flex flex-col gap-2">
	<h4 class="text-sm font-medium text-muted-foreground flex items-center gap-2">
		<ImageIcon class="size-4" />
		{title}
	</h4>

	{#if images.length > 0}
		<Card class="relative overflow-hidden pt-0">
			<div class="aspect-square relative">
				<img src={images[currentIndex]} alt="{title} {currentIndex + 1}" class="w-full h-full object-cover" />

				{#if images.length > 1}
					<div class="absolute inset-x-0 bottom-0 flex items-center justify-between p-2 bg-gradient-to-t from-black/50 to-transparent">
						<Button size="icon" variant="ghost" class="size-8 text-white hover:bg-white/20" onclick={goPrev} disabled={currentIndex === 0}>
							<ChevronLeftIcon class="size-5" />
						</Button>

						<div class="flex gap-1.5">
							{#each images as _, idx}
								<button class={["size-2 rounded-full transition-all", idx === currentIndex ? "bg-white scale-110" : "bg-white/50"]} onclick={() => (currentIndex = idx)}></button>
							{/each}
						</div>

						<Button size="icon" variant="ghost" class="size-8 text-white hover:bg-white/20" onclick={goNext} disabled={currentIndex === images.length - 1}>
							<ChevronRightIcon class="size-5" />
						</Button>
					</div>
				{/if}
			</div>

			<p class="text-xs text-center text-muted-foreground py-2">
				{currentIndex + 1} of {images.length}
			</p>
		</Card>
	{:else}
		<Card class="flex items-center justify-center h-32 text-muted-foreground">
			<p class="text-sm">No images available</p>
		</Card>
	{/if}
</div>

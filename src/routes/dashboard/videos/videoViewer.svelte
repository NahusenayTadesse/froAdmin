<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Play, Video, X, ChevronRight, ChevronLeft } from '@lucide/svelte';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import type { changeStatus } from './schema';
	import Edit from './edit.svelte';

	type Props = {
		src: string;
		label?: string;
		poster?: string;
		id: string;
		form: SuperValidated<Infer<typeof changeStatus>>;
		verificationsStates?: string[{ state }];
		rows: any[];
		rowIndex: number;
	};

	let {
		src,
		label,
		poster,
		id,
		form,
		verificationsStates,
		rows = [],
		rowIndex = 0
	}: Props = $props();

	let open = $state(false);
	let modalVideoEl = $state<HTMLVideoElement | null>(null);
	let isHovered = $state(false);

	// ✅ Mutable state — not $derived
	let currentIndex = $derived(rowIndex);

	// ✅ Derive video data from currentIndex
	const currentRow = $derived(rows[currentIndex]?.original);
	const currentSrc = $derived(currentRow?.url ?? src);
	const currentLabel = $derived(currentRow?.title ?? label);
	const currentPoster = $derived(currentRow?.thumbnail ?? poster);
	const currentId = $derived(currentRow?.id ?? id);
	const idArray = $derived([currentId]);

	// ✅ Restart video when navigating
	$effect(() => {
		if (open && modalVideoEl) {
			modalVideoEl.load();
			modalVideoEl.play().catch(() => {});
		}
	});

	$effect(() => {
		if (open && modalVideoEl) {
			modalVideoEl.play().catch(() => {});
		}
	});

	function goPrev() {
		if (currentIndex > 0) currentIndex--;
	}

	function goNext() {
		if (currentIndex < rows.length - 1) currentIndex++;
	}

	let touchStartY = $state(0);
	let touchEndY = $state(0);
	const minSwipeDistance = 50; // Minimum pixels to qualify as a swipe

	function handleTouchStart(e: TouchEvent) {
		touchStartY = e.touches[0].screenY;
	}

	function handleTouchMove(e: TouchEvent) {
		// Prevents elastic bouncing/scrolling the underlying page while swiping the video
		if (e.cancelable) e.preventDefault();
	}

	function handleTouchEnd(e: TouchEvent) {
		touchEndY = e.changedTouches[0].screenY;
		handleSwipeGesture();
	}

	function handleSwipeGesture() {
		const distance = touchStartY - touchEndY;

		// Swipe Up -> Next Video (Distance is positive)
		if (distance > minSwipeDistance) {
			goNext();
		}
		// Swipe Down -> Previous Video (Distance is negative)
		else if (distance < -minSwipeDistance) {
			goPrev();
		}
	}
</script>

<Dialog.Root bind:open>
	<!-- THUMBNAIL TRIGGER -->
	<Dialog.Trigger>
		{#snippet child({ props })}
			<button
				{...props}
				class="group relative flex w-full items-center gap-3 rounded-lg border border-border bg-card p-2 text-left transition-all hover:border-primary/50 hover:bg-accent/50 hover:shadow-sm"
				onmouseenter={() => (isHovered = true)}
				onmouseleave={() => (isHovered = false)}
			>
				<!-- Video Preview Thumbnail -->
				<div
					class="relative h-12 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-muted"
				>
					<video
						src={currentSrc}
						poster={currentPoster}
						muted
						preload="metadata"
						class="h-full w-full object-cover"
					></video>

					<!-- Hover Play Icon -->
					<div
						class="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity {isHovered
							? 'opacity-100'
							: 'opacity-0'}"
					>
						<Play class="h-5 w-5 fill-white text-white" />
					</div>

					<!-- Static badge when not hovered -->
					{#if !isHovered}
						<div class="absolute inset-0 flex items-center justify-center">
							<div class="rounded-full bg-black/40 p-1 backdrop-blur-sm">
								<Play class="h-3 w-3 fill-white text-white" />
							</div>
						</div>
					{/if}
				</div>

				<div class="min-w-0 flex-1">
					<p class="truncate text-sm leading-none font-semibold text-foreground">
						{label ?? 'View Video'}
					</p>
					<p class="mt-1 text-xs text-muted-foreground">Preview recording</p>
				</div>

				<ChevronRight
					class="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-primary"
				/>
			</button>
		{/snippet}
	</Dialog.Trigger>

	<!-- MODAL CONTENT -->
	<Dialog.Content class="gap-0 overflow-hidden p-0 ">
		<Dialog.Header class="border-b bg-muted/30 p-4">
			<div class="flex items-center gap-2">
				<Video class="h-4 w-4 text-primary" />
				<Dialog.Title class="text-base font-medium">{currentLabel ?? 'Video Preview'}</Dialog.Title>
			</div>
		</Dialog.Header>
		<div class="my-2 flex flex-row flex-wrap items-start justify-start px-2">
			<Edit
				data={form}
				name="Discoverablity"
				action="?/discover"
				discoverable={true}
				ids={idArray}
				disabled={false}
			/>

			<Edit
				data={form}
				name="Compliance Reviewed"
				action="?/review"
				discoverable={false}
				ids={idArray}
				disabled={false}
			/>

			<Edit
				data={form}
				name="Verification State"
				action="?/verify"
				discoverable={false}
				ids={idArray}
				disabled={false}
				{verificationsStates}
			/>
		</div>

		<div
			class="aspect-video w-full bg-black"
			ontouchstart={handleTouchStart}
			ontouchend={handleTouchEnd}
			role="region"
			aria-label="Video player swipe controls. Swipe up for next video, swipe down for previous video."
		>
			<video
				bind:this={modalVideoEl}
				src={currentSrc}
				poster={currentPoster}
				controls
				playsinline
				class="h-full w-full"
			>
				<track kind="captions" />
				Your browser does not support the video tag.
			</video>
		</div>
		<div class="flex items-center justify-between border-t px-4 py-3">
			<Button variant="outline" size="sm" disabled={currentIndex === 0} onclick={goPrev}>
				<ChevronLeft /> Previous
			</Button>
			<span class="text-sm text-muted-foreground">
				{currentIndex + 1} / {rows.length}
			</span>
			<Button
				variant="outline"
				size="sm"
				disabled={currentIndex === rows.length - 1}
				onclick={goNext}
			>
				Next <ChevronRight />
			</Button>
		</div>
		<Dialog.Footer class="flex flex-row items-start justify-between">
			<Dialog.Close>
				<Button variant="secondary" size="sm"><X /> Close</Button>
			</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

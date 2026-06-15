<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Play, Video, X, ChevronRight, ChevronLeft } from '@lucide/svelte';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';
	import type { changeStatus } from './schema';
	import Edit from './edit.svelte';

	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	type Props = {
		src: string;
		label?: string;
		poster?: string;
		id: string;
		form: SuperValidated<Infer<typeof changeStatus>>;
		verificationsStates?: { state: string }[];
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

	// Important: this must be mutable state
	let currentIndex = $state(rowIndex);

	const currentRow = $derived(rows[currentIndex]?.original);
	const currentSrc = $derived(currentRow?.url ?? src);
	const currentLabel = $derived(currentRow?.title ?? label);
	const currentPoster = $derived(currentRow?.thumbnail ?? poster);
	const currentId = $derived(currentRow?.id ?? id);
	const idArray = $derived([currentId]);

	// 1 = next, -1 = previous
	let slideDirection = $state(1);

	let touchStartY = $state(0);
	let dragY = $state(0);
	const minSwipeDistance = 50;

	$effect(() => {
		if (open && modalVideoEl) {
			modalVideoEl.play().catch(() => {});
		}
	});
	function goPrev() {
		if (currentIndex > 0) {
			hasVideoMetadata = false;
			slideDirection = -1;
			currentIndex--;
		}
	}

	function goNext() {
		if (currentIndex < rows.length - 1) {
			hasVideoMetadata = false;
			slideDirection = 1;
			currentIndex++;
		}
	}

	function handleTouchStart(e: TouchEvent) {
		touchStartY = e.touches[0].clientY;
		dragY = 0;
	}

	function handleTouchMove(e: TouchEvent) {
		const currentY = e.touches[0].clientY;
		dragY = currentY - touchStartY;

		if (e.cancelable) e.preventDefault();
	}

	function handleTouchEnd() {
		if (dragY < -minSwipeDistance && currentIndex < rows.length - 1) {
			goNext();
		} else if (dragY > minSwipeDistance && currentIndex > 0) {
			goPrev();
		}

		dragY = 0;
	}

	let isPortraitVideo = $state(false);
	let hasVideoMetadata = $state(false);

	function handleVideoMetadata(e: Event) {
		const video = e.currentTarget as HTMLVideoElement;

		isPortraitVideo = video.videoHeight > video.videoWidth;
		hasVideoMetadata = true;
	}

	const dialogContentClass = $derived(
		isPortraitVideo
			? 'flex max-h-[100dvh] flex-col gap-0 overflow-hidden p-0 sm:!max-w-[520px] md:!max-w-[560px] lg:!max-w-[620px] max-sm:!h-[100dvh] max-sm:!w-[100dvw] max-sm:!max-w-none max-sm:!rounded-none max-sm:!border-0'
			: 'gap-0 overflow-hidden p-0 sm:!max-w-3xl'
	);

	const videoShellClass = $derived(
		isPortraitVideo
			? 'relative min-h-0 w-full flex-1 overflow-hidden bg-black sm:h-[75dvh] sm:flex-none'
			: 'relative aspect-video w-full overflow-hidden bg-black'
	);
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
	<Dialog.Content class={dialogContentClass}>
		<Dialog.Header class="border-b bg-muted/30 p-4">
			<div class="flex items-center gap-2">
				<Video class="h-4 w-4 text-primary" />
				<Dialog.Title class="text-base font-medium">
					{currentLabel ?? 'Video Preview'}
				</Dialog.Title>
			</div>
		</Dialog.Header>

		<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
			<div
				class="flex shrink-0 flex-row flex-wrap items-start justify-start gap-2 overflow-y-auto px-2 py-2"
			>
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
				class={videoShellClass}
				ontouchstart={handleTouchStart}
				ontouchmove={handleTouchMove}
				ontouchend={handleTouchEnd}
				role="region"
				aria-label="Video player swipe controls. Swipe up for next video, swipe down for previous video."
			>
				{#key currentId}
					<div
						class="absolute inset-0"
						style:transform={`translateY(${dragY}px)`}
						in:fly={{
							y: slideDirection * 180,
							duration: 260,
							easing: cubicOut
						}}
						out:fly={{
							y: -slideDirection * 180,
							duration: 220,
							easing: cubicOut
						}}
					>
						<video
							bind:this={modalVideoEl}
							src={currentSrc}
							poster={currentPoster}
							controls
							playsinline
							autoplay
							onloadedmetadata={handleVideoMetadata}
							class="h-full w-full object-contain"
						>
							<track kind="captions" />
							Your browser does not support the video tag.
						</video>
					</div>
				{/key}
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
		</div>

		<Dialog.Footer class="flex flex-row items-start justify-between">
			<Dialog.Close>
				<Button variant="secondary" size="sm"><X /> Close</Button>
			</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

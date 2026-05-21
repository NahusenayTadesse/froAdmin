<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Play, Video, X, ChevronRight } from '@lucide/svelte';
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
	};

	let { src, label, poster, id, form, verificationsStates }: Props = $props();

	let open = $state(false);
	let modalVideoEl = $state<HTMLVideoElement | null>(null);
	let isHovered = $state(false);

	// Handle auto-play when dialog opens via shadcn's open state
	$effect(() => {
		if (open && modalVideoEl) {
			modalVideoEl.play().catch(() => {
				console.log('Autoplay blocked or failed');
			});
		}
	});

	let idArray: string[] = $state([id]);
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
					<video {src} {poster} muted preload="metadata" class="h-full w-full object-cover"></video>

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
	<Dialog.Content class="gap-0 overflow-hidden p-0 sm:max-w-[800px]">
		<Dialog.Header class="border-b bg-muted/30 p-4">
			<div class="flex items-center gap-2">
				<Video class="h-4 w-4 text-primary" />
				<Dialog.Title class="text-base font-medium">{label ?? 'Video Preview'}</Dialog.Title>
			</div>
		</Dialog.Header>
		<div class="my-2 flex flex-row items-start justify-start px-2">
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

		<div class="aspect-video w-full bg-black">
			<video bind:this={modalVideoEl} {src} {poster} controls playsinline class="h-full w-full">
				<track kind="captions" />
				Your browser does not support the video tag.
			</video>
		</div>

		<Dialog.Footer class="flex flex-row items-start justify-between">
			<Dialog.Close>
				<Button variant="secondary" size="sm"><X /> Close</Button>
			</Dialog.Close>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

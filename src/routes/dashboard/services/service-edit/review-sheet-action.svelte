<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { Button } from '$lib/components/ui/button/index';
	import * as Sheet from '$lib/components/ui/sheet';
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import ServiceEditDiff from './ServiceEditDiff.svelte'; // The file built previously
	import Errors from '$lib/formComponents/Errors.svelte';
	import { Check, X, ShieldAlert } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let {
		requestId,
		serviceTitle,
		providerName,
		providerNote,
		status,
		changeType,
		requestedFields,
		beforeSnapshot,
		pendingSnapshot,
		reviewForm
	} = $props();

	// Instantiate local superform scope tied back to page server action
	const { form, errors, enhance, delayed, allErrors } = superForm(reviewForm, {
		id: `review-${requestId}`,
		onUpdated: ({ form }) => {
			if (form.message) {
				if (form.message.type === 'success') {
					toast.success(form.message.text);
				} else if (form.message.type === 'error') {
					toast.error(form.message.text);
				}
			}
		},
		resetForm: true
	});

	let chosenAction = $state<'approve' | 'reject_restore' | 'reject_suspend' | null>(null);
	let isSheetOpen = $state(false);

	function submitDecision(actionValue: 'approve' | 'reject_restore' | 'reject_suspend') {
		$form.requestId = requestId;
		$form.action = actionValue;
		chosenAction = actionValue;
	}
</script>

<button
	class="block max-w-70 truncate text-left font-medium text-emerald-600 hover:underline dark:text-emerald-400"
	onclick={() => (isSheetOpen = true)}
>
	{serviceTitle || 'Unnamed Service Proposal'}
	<span class="block text-xs font-normal text-zinc-400"
		>By {providerName ?? 'Unknown Provider'}</span
	>
</button>

<Sheet.Root bind:open={isSheetOpen}>
	<Sheet.Content class="flex h-full min-w-1/2 flex-col justify-between overflow-y-auto p-2">
		<div>
			<Sheet.Header class="mb-4">
				<Sheet.Title class="text-xl">Evaluation Workbench</Sheet.Title>
				<Sheet.Description>
					Reviewing <strong class="text-zinc-900 dark:text-white">{serviceTitle}</strong> by {providerName}.
				</Sheet.Description>
			</Sheet.Header>

			{#if status === 'pending'}
				<div
					class="mb-4 flex gap-2 rounded border border-amber-200/50 bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-400"
				>
					<span>⚠️</span>
					<p>
						<strong>Marketplace Blocked:</strong> While pending review, new customer bookings are frozen
						for this service instance.
					</p>
				</div>
			{/if}

			{#if providerNote}
				<div class="mb-6 rounded border bg-zinc-50 p-4 text-sm dark:bg-zinc-900">
					<span class="mb-1 block text-xs font-bold text-zinc-400 uppercase"
						>Provider Submission Note:</span
					>
					<p class="text-zinc-700 italic dark:text-zinc-300">"{providerNote}"</p>
				</div>
			{/if}

			<div class="my-4">
				<h3 class="mb-2 text-sm font-semibold tracking-wider text-zinc-400 uppercase">
					Modified Value Snapshot Layer
				</h3>
				<ServiceEditDiff {requestedFields} {beforeSnapshot} {pendingSnapshot} />
			</div>
		</div>

		{#if status === 'pending'}
			<form
				action="?/review"
				use:enhance
				method="post"
				class="sticky bottom-0 mt-6 space-y-4 border-t bg-white pt-4 dark:bg-zinc-950"
			>
				<Errors allErrors={$allErrors} />
				<input type="hidden" name="requestId" value={requestId} />
				<input type="hidden" name="action" value={$form.action} />

				<div class="flex flex-col gap-1.5">
					<label for="adminNote" class="text-sm font-medium">Internal Admin Review Statement</label>
					<textarea
						id="adminNote"
						name="adminNote"
						bind:value={$form.adminNote}
						placeholder="Mandatory for rejections. Explain reasoning clearly to help guide the provider..."
						class="min-h-[75px] w-full rounded border bg-transparent p-2 text-sm focus:ring-1 focus:ring-emerald-500"
					></textarea>
					{#if $errors.adminNote}
						<span class="text-xs font-medium text-rose-500">{$errors.adminNote}</span>
					{/if}
				</div>

				<div class="flex flex-row flex-wrap gap-2">
					<Button
						type="submit"
						variant="default"
						class="flex gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
						onclick={() => submitDecision('approve')}
					>
						{#if $delayed && chosenAction === 'approve'}
							<LoadingBtn name="Approving..." />
						{:else}
							<Check class="h-4 w-4" /> Approve & Publish
						{/if}
					</Button>

					<Button
						type="submit"
						variant="outline"
						class="flex gap-1.5 border-amber-200/50 text-amber-600 hover:bg-amber-50"
						onclick={() => submitDecision('reject_restore')}
					>
						{#if $delayed && chosenAction === 'reject_restore'}
							<LoadingBtn name="Rejecting..." />
						{:else}
							<X class="h-4 w-4" /> Reject & Restore Old
						{/if}
					</Button>

					<Button
						type="submit"
						variant="destructive"
						class="flex gap-1.5"
						onclick={() => submitDecision('reject_suspend')}
					>
						{#if $delayed && chosenAction === 'reject_suspend'}
							<LoadingBtn name="Suspending..." />
						{:else}
							<ShieldAlert class="h-4 w-4" /> Reject & Suspend
						{/if}
					</Button>
				</div>
			</form>
		{:else}
			<div class="mt-6 border-t pt-4 text-center text-sm text-zinc-400 italic">
				This submission item is finalized and logged under historical state: <span
					class="font-mono font-bold">{status}</span
				>.
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>

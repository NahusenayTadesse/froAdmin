<script lang="ts">
	import type { Transaction } from '$lib/types/transaction.js';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import { Button } from '$lib/components/ui/button';
	import StatusBadge from './status-badge.svelte';
	import InfoRow from './info-row.svelte';
	import ImageGallery from './image-gallery.svelte';
	import {
		UserIcon,
		BriefcaseIcon,
		CalendarIcon,
		ClockIcon,
		MapPinIcon,
		CreditCardIcon,
		MessageSquareIcon,
		HashIcon,
		ArrowLeftIcon
	} from '@lucide/svelte';

	type Props = {
		transaction: Transaction;
		onBack?: () => void;
	};

	const { transaction, onBack }: Props = $props();

	const formatDate = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	};

	const formatCreatedAt = (dateStr: string) => {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	};
</script>

<div class="min-h-dvh bg-background">
	<!-- Sticky Header -->
	<header class="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm">
		<div class="flex items-center gap-3 px-4 py-3">
			{#if onBack}
				<Button size="icon" variant="ghost" class="size-9 shrink-0" onclick={onBack}>
					<ArrowLeftIcon class="size-5" />
				</Button>
			{/if}
			<div class="min-w-0 flex-1">
				<h1 class="truncate text-lg font-semibold">{transaction.serviceName}</h1>
				<p class="text-xs text-muted-foreground">{transaction.id}</p>
			</div>
		</div>

		<!-- Status Badges -->
		<div class="flex gap-2 px-4 pb-3">
			<StatusBadge status={transaction.bookingStatus} type="booking" />
			<StatusBadge status={transaction.paymentStatus} type="payment" />
		</div>
	</header>

	<!-- Content -->
	<div class="flex flex-col gap-4 p-4 pb-8">
		<!-- People Section -->
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">People</CardTitle>
			</CardHeader>
			<CardContent class="pt-0">
				<InfoRow label="Customer">
					{#snippet icon()}<UserIcon class="size-4" />{/snippet}
					{transaction.customerName}
				</InfoRow>
				<Separator />
				<InfoRow label="Service Provider">
					{#snippet icon()}<BriefcaseIcon class="size-4" />{/snippet}
					{transaction.providerName}
				</InfoRow>
			</CardContent>
		</Card>

		<!-- Schedule & Location Section -->
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Schedule & Location</CardTitle>
			</CardHeader>
			<CardContent class="pt-0">
				<InfoRow label="Date">
					{#snippet icon()}<CalendarIcon class="size-4" />{/snippet}
					{formatDate(transaction.scheduledDate)}
				</InfoRow>
				<Separator />
				<InfoRow label="Time">
					{#snippet icon()}<ClockIcon class="size-4" />{/snippet}
					{transaction.scheduledStartTime} - {transaction.scheduledEndTime}
				</InfoRow>
				{#if transaction.address}
					<Separator />
					<InfoRow label="Address">
						{#snippet icon()}<MapPinIcon class="size-4" />{/snippet}
						<span class="wrap-break-words">{transaction.address}</span>
					</InfoRow>
				{/if}
			</CardContent>
		</Card>

		<!-- Payment Section -->
		<Card>
			<CardHeader class="pb-2">
				<CardTitle class="text-sm font-medium text-muted-foreground">Payment</CardTitle>
			</CardHeader>
			<CardContent class="pt-0">
				<InfoRow label="Total Amount">
					{#snippet icon()}<CreditCardIcon class="size-4" />{/snippet}
					<span class="text-lg font-semibold text-primary">{transaction.totalPrice}</span>
				</InfoRow>
				<Separator />
				<InfoRow label="Booking ID">
					{#snippet icon()}<HashIcon class="size-4" />{/snippet}
					<span class="font-mono text-xs">{transaction.id}</span>
				</InfoRow>
				<p class="mt-2 text-xs text-muted-foreground">
					Booked on {formatCreatedAt(transaction.createdAt)}
				</p>
			</CardContent>
		</Card>

		<!-- Notes Section -->
		{#if transaction.notesFromCustomer}
			<Card>
				<CardHeader class="pb-2">
					<CardTitle class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
						<MessageSquareIcon class="size-4" />
						Customer Notes
					</CardTitle>
				</CardHeader>
				<CardContent class="pt-0">
					<p class="text-sm leading-relaxed">{transaction.notesFromCustomer}</p>
				</CardContent>
			</Card>
		{/if}

		<!-- Images Section -->
		<!-- {#if transaction?.beforeImageUrls.length > 0 || transaction.afterImageUrls.length > 0}
			<div class="flex flex-col gap-4">
				<h3 class="font-semibold">Service Images</h3>

				<div class="grid grid-cols-1 gap-4">
					{#if transaction.beforeImageUrls.length > 0}
						<ImageGallery title="Before" images={transaction.beforeImageUrls} />
					{/if}

					{#if transaction.afterImageUrls.length > 0}
						<ImageGallery title="After" images={transaction.afterImageUrls} />
					{/if}
				</div>
			</div>
		{/if} -->
	</div>
</div>

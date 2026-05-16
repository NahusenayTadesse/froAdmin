<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Calendar } from '$lib/components/ui/calendar';
	import { CalendarIcon } from '@lucide/svelte';
	import { getLocalTimeZone, today, type CalendarDate } from '@internationalized/date';

	interface Props {
		start?: CalendarDate;
		end?: CalendarDate;
		link?: string;
		onDateChange?: (dates: { start: CalendarDate; end: CalendarDate }) => void;
	}

	let {
		start = today(getLocalTimeZone()).subtract({ months: 1 }),
		end = today(getLocalTimeZone()),
		link = '',
		onDateChange
	}: Props = $props();

	let startDate: CalendarDate = $state(start);
	let endDate: CalendarDate = $state(end);

	const formatDate = (date: CalendarDate) => {
		return date.toDate(getLocalTimeZone()).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	};

	const handleStartChange = (value: CalendarDate | undefined) => {
		if (value) {
			startDate = value;
			onDateChange?.({ start: startDate, end: endDate });
		}
	};

	const handleEndChange = (value: CalendarDate | undefined) => {
		if (value) {
			endDate = value;
			onDateChange?.({ start: startDate, end: endDate });
		}
	};
</script>

<div class="flex items-center gap-2">
	<Popover>
		<PopoverTrigger>
			{#snippet child({ props })}
				<Button variant="outline" class="min-w-35 justify-start text-left font-normal" {...props}>
					<CalendarIcon class="mr-2 size-4 text-muted-foreground" />
					{formatDate(startDate)}
				</Button>
			{/snippet}
		</PopoverTrigger>
		<PopoverContent class="w-auto p-0" align="start">
			<Calendar type="single" value={startDate} onValueChange={handleStartChange} />
		</PopoverContent>
	</Popover>

	<span class="text-sm text-muted-foreground">to</span>

	<Popover>
		<PopoverTrigger>
			{#snippet child({ props })}
				<Button variant="outline" class="min-w-35 justify-start text-left font-normal" {...props}>
					<CalendarIcon class="mr-2 size-4 text-muted-foreground" />
					{formatDate(endDate)}
				</Button>
			{/snippet}
		</PopoverTrigger>
		<PopoverContent class="w-auto p-0" align="start">
			<Calendar type="single" value={endDate} onValueChange={handleEndChange} />
		</PopoverContent>
	</Popover>
</div>

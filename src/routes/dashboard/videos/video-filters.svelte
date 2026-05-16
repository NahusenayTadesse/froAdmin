<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import DateMonth from './date-month.svelte';
	import {
		XIcon,
		EyeIcon,
		ShieldCheckIcon,
		ShieldCheck as CheckCircleIcon,
		Funnel,
		Calendar1
	} from '@lucide/svelte';
	import { getLocalTimeZone, today, type CalendarDate } from '@internationalized/date';
	import { CalendarDate as CDate } from '@internationalized/date';

	interface VerificationState {
		state: string;
	}

	interface Props {
		start?: string;
		end?: string;
		currentDiscoverable?: string;
		currentCompliance?: string;
		currentVerification?: string;
		verificationStates?: VerificationState[];
		onFilterChange?: (filters: FilterValues) => void;
	}

	interface FilterValues {
		isDiscoverable: string;
		complianceReview: string;
		verificationStates: string;
		dateRange: { start: CalendarDate; end: CalendarDate };
	}

	let {
		start = today(getLocalTimeZone()),
		end = today(getLocalTimeZone()),
		currentDiscoverable = '',
		currentCompliance = '',
		currentVerification = '',
		verificationStates = [
			{ state: 'Verified' },
			{ state: 'Pending' },
			{ state: 'Rejected' },
			{ state: 'Under Review' }
		],
		onFilterChange
	}: Props = $props();

	let discoverableValue: string = $state(currentDiscoverable);
	let complianceValue: string = $state(currentCompliance);
	let verificationValue: string = $state(currentVerification);
	let dateRange: { start: CalendarDate; end: CalendarDate } = $state({
		start: new CDate(
			new Date(start).getFullYear(),
			new Date(start).getMonth(),
			new Date(start).getDate()
		),
		end: new CDate(new Date(end).getFullYear(), new Date(end).getMonth(), new Date(end).getDate())
	});

	const activeFilterCount = $derived(
		[discoverableValue, complianceValue, verificationValue].filter((v) => v !== '').length
	);

	const updateFilter = (key: keyof Omit<FilterValues, 'dateRange'>, value: string) => {
		if (key === 'isDiscoverable') discoverableValue = value;
		if (key === 'complianceReview') complianceValue = value;
		if (key === 'verificationStates') verificationValue = value;

		onFilterChange?.({
			isDiscoverable: discoverableValue,
			complianceReview: complianceValue,
			verificationStates: verificationValue,
			dateRange
		});
	};

	const handleDateChange = (dates: { start: CalendarDate; end: CalendarDate }) => {
		dateRange = dates;
		onFilterChange?.({
			isDiscoverable: discoverableValue,
			complianceReview: complianceValue,
			verificationStates: verificationValue,
			dateRange
		});
	};

	const clearAllFilters = () => {
		discoverableValue = '';
		complianceValue = '';
		verificationValue = '';
		onFilterChange?.({
			isDiscoverable: '',
			complianceReview: '',
			verificationStates: '',
			dateRange
		});
	};

	const getDiscoverableLabel = (value: string) => {
		if (value === 'true') return 'Discoverable Only';
		if (value === 'false') return 'Hidden Only';
		return 'All statuses';
	};

	const getComplianceLabel = (value: string) => {
		if (value === 'true') return 'Passed Compliance';
		if (value === 'false') return 'Failed/Pending';
		return 'All reviews';
	};

	const newStart = new CDate(
		new Date(start).getFullYear(),
		new Date(start).getMonth(),
		new Date(start).getDate()
	);
	const newEnd = new CDate(
		new Date(end).getFullYear(),
		new Date(end).getMonth(),
		new Date(end).getDate()
	);
</script>

<Card class="border-border/50 shadow-lg">
	<CardHeader class="pb-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="flex size-9 items-center justify-center rounded-lg bg-primary/10">
					<Funnel class="size-4 text-primary" />
				</div>
				<div>
					<CardTitle class="text-lg">Video Dashboard</CardTitle>
					<p class="text-sm text-muted-foreground">Filter and analyze your video content</p>
				</div>
			</div>
			{#if activeFilterCount > 0}
				<div class="flex items-center gap-2">
					<Badge variant="secondary" class="font-medium">
						{activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}
					</Badge>
					<Button
						variant="ghost"
						size="sm"
						class="h-8 px-2 text-muted-foreground hover:text-foreground"
						onclick={clearAllFilters}
					>
						<XIcon class="mr-1 size-3" />
						Clear all
					</Button>
				</div>
			{/if}
		</div>
	</CardHeader>

	<Separator />

	<CardContent class="pt-6">
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<!-- Date Range -->
			<div class="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
				<label class="flex items-center gap-2 text-sm font-medium text-foreground">
					<Calendar1 />

					Date Range
				</label>
				<DateMonth
					start={newStart}
					end={newEnd}
					link="/dashboard/videos"
					onDateChange={handleDateChange}
				/>
			</div>

			<!-- Discoverable Status -->
			<div class="flex flex-col gap-2">
				<label class="flex items-center gap-2 text-sm font-medium text-foreground">
					<span class="flex size-5 items-center justify-center rounded bg-muted">
						<EyeIcon class="size-3 text-muted-foreground" />
					</span>
					Discoverable Status
				</label>
				<Select
					type="single"
					value={discoverableValue}
					onValueChange={(v) => updateFilter('isDiscoverable', v ?? '')}
				>
					<SelectTrigger class="w-full bg-background transition-colors hover:bg-accent/50">
						{getDiscoverableLabel(discoverableValue)}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">All statuses</SelectItem>
						<SelectItem value="true">
							<span class="flex items-center gap-2">
								<span class="size-2 rounded-full bg-green-500"></span>
								Discoverable Only
							</span>
						</SelectItem>
						<SelectItem value="false">
							<span class="flex items-center gap-2">
								<span class="size-2 rounded-full bg-orange-500"></span>
								Hidden Only
							</span>
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<!-- Compliance Review -->
			<div class="flex flex-col gap-2">
				<label class="flex items-center gap-2 text-sm font-medium text-foreground">
					<span class="flex size-5 items-center justify-center rounded bg-muted">
						<ShieldCheckIcon class="size-3 text-muted-foreground" />
					</span>
					Compliance Review
				</label>
				<Select
					type="single"
					value={complianceValue}
					onValueChange={(v) => updateFilter('complianceReview', v ?? '')}
				>
					<SelectTrigger class="w-full bg-background transition-colors hover:bg-accent/50">
						{getComplianceLabel(complianceValue)}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">All reviews</SelectItem>
						<SelectItem value="true">
							<span class="flex items-center gap-2">
								<span class="size-2 rounded-full bg-green-500"></span>
								Passed Compliance
							</span>
						</SelectItem>
						<SelectItem value="false">
							<span class="flex items-center gap-2">
								<span class="size-2 rounded-full bg-red-500"></span>
								Failed/Pending
							</span>
						</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<!-- Verification State -->
			<div class="flex flex-col gap-2">
				<label class="flex items-center gap-2 text-sm font-medium text-foreground">
					<span class="flex size-5 items-center justify-center rounded bg-muted">
						<CheckCircleIcon class="size-3 text-muted-foreground" />
					</span>
					Verification State
				</label>
				<Select
					type="single"
					value={verificationValue}
					onValueChange={(v) => updateFilter('verificationStates', v ?? '')}
				>
					<SelectTrigger class="w-full bg-background transition-colors hover:bg-accent/50">
						{verificationValue || 'All verification states'}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">All verification states</SelectItem>
						{#each verificationStates as state (state.state)}
							{#if state !== null}
								<SelectItem value={state.state}>
									<span class="flex items-center gap-2">
										<span
											class={[
												'h-2 w-2 rounded-full',
												state.state === 'Verified' && 'bg-green-500',
												state.state === 'Pending' && 'bg-yellow-500',
												state.state === 'Rejected' && 'bg-red-500',
												state.state === 'Under Review' && 'bg-blue-500',
												!['Verified', 'Pending', 'Rejected', 'Under Review'].includes(
													state.state
												) && 'bg-gray-500'
											]}
										></span>
										{state.state}
									</span>
								</SelectItem>
							{/if}
						{/each}
					</SelectContent>
				</Select>
			</div>
		</div>
	</CardContent>
</Card>

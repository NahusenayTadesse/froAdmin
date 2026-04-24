<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { editUserSchema } from './schema';

	let { data } = $props();

	import SingleTable from '$lib/components/SingleTable.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { superForm } from 'sveltekit-superforms/client';

	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import { ArrowLeft, Banknote, CalendarClock, Pencil, Save } from '@lucide/svelte';
	import SelectComp from '$lib/formComponents/SelectComp.svelte';
	import type { Snapshot } from '@sveltejs/kit';

	import Delete from '$lib/forms/Delete.svelte';
	import SingleView from '$lib/components/SingleView.svelte';
	import Errors from '$lib/formComponents/Errors.svelte';
	import InputComp from '$lib/formComponents/InputComp.svelte';
	import Ban from '$lib/forms/Ban.svelte';
	import UnBan from '$lib/forms/UnBan.svelte';
	import DataTable from '$lib/components/Table/data-table.svelte';
	import { columns } from './columns.js';
	let singleTable = $derived([
		{
			name: 'Name',
			value:
				`${data.singleUser?.firstName ?? ''} ${data.singleUser?.lastName ?? ''}`.trim() || 'N/A'
		},
		{ name: 'Email', value: data.singleUser?.email ?? 'N/A' },
		{ name: 'Phone', value: data.singleUser?.phoneNumber ?? 'N/A' },
		{ name: 'Role', value: data.singleUser?.role },
		{ name: 'Status', value: data.singleUser?.banned ? 'Banned' : 'Active' },
		{ name: 'Verified Provider', value: data.singleUser?.isVerifiedProvider ? 'Yes' : 'No' },
		{ name: 'Verification Status', value: data.singleUser?.verificationStatus?.replace('_', ' ') },

		// Location Details
		{ name: 'City', value: data.singleUser?.locationCity ?? 'N/A' },
		{
			name: 'State/Country',
			value: `${data.singleUser?.locationState ?? ''}, ${data.singleUser?.locationCountry ?? ''}`
		},
		{ name: 'Address', value: data.singleUser?.primaryAddress ?? 'N/A' },
		{
			name: 'Coordinates',
			value: data.singleUser?.latitude
				? `${data.singleUser.latitude}, ${data.singleUser.longitude}`
				: 'N/A'
		},

		// Reputation
		{
			name: 'Rating',
			value: `${data.singleUser?.ratingAverage} (${data.singleUser?.ratingCount} reviews)`
		},

		// Business/Internal
		{ name: 'Stripe ID', value: data.singleUser?.stripeCustomerId ?? 'None' },
		{ name: 'Bio', value: data.singleUser?.bio ?? 'No bio provided' },
		{ name: 'Version', value: data.singleUser?.version ?? 0 },

		// Ban Info (Conditional logic)
		...(data.singleUser?.banned
			? [
					{ name: 'Ban Reason', value: data.singleUser?.banReason ?? 'No reason provided' },
					{
						name: 'Banned At',
						value: data.singleUser?.bannedAt
							? formatDate(new Date(data.singleUser.bannedAt))
							: 'N/A'
					}
				]
			: []),

		// Timestamps
		{
			name: 'Created At',
			value: data.singleUser?.createdAt ? formatDate(new Date(data.singleUser.createdAt)) : 'N/A'
		},
		{
			name: 'Updated At',
			value: data.singleUser?.updatedAt ? formatDate(new Date(data.singleUser.updatedAt)) : 'N/A'
		}
	]);

	const bannedInfo = $derived([
		{ name: 'Ban Reason', value: data.singleUser?.banReason },
		{ name: 'Banned At', value: formatDate(data.singleUser?.bannedAt) }
	]);

	const { form, errors, enhance, delayed, capture, restore, allErrors, message } = superForm(
		data.form,
		{
			validators: zod4Client(editUserSchema),
			resetForm: false
		}
	);

	import { toast } from 'svelte-sonner';
	import { formatDate } from '$lib/global.svelte.js';
	import { Provider } from '$lib/components/ui/sidebar/index.js';
	import Statuses from '$lib/components/Table/statuses.svelte';
	import Verify from '$lib/forms/Verify.svelte';
	import { page } from '$app/state';
	import FormCard from '$lib/formComponents/FormCard.svelte';
	$effect(() => {
		if ($message) {
			if ($message.type === 'error') {
				toast.error($message.text);
			} else {
				toast.success($message.text);
			}
		}
	});

	export const snapshot: Snapshot = { capture, restore };

	//   let date = $derived(dateProxy(editForm, 'appointmentDate', { format: 'date'}));

	let edit = $state(false);
</script>

<svelte:head>
	<title>Provider Details</title>
</svelte:head>
<SingleView title="Provider Details" class="w-full!">
	<div
		class="mt-4 flex w-full flex-row flex-wrap
 items-start justify-start gap-2 pl-4"
	>
		<Button onclick={() => (edit = !edit)}>
			{#if !edit}
				<Pencil class="h-4 w-4" />
				Edit
			{:else}
				<ArrowLeft class="h-4 w-4" />

				Back
			{/if}
		</Button>

		<Button href="/dashboard/vendor/{page.params.id}/bookings">
			<CalendarClock /> Bookings
		</Button>

		<Button href="/dashboard/vendor/{page.params.id}/transactions">
			<Banknote /> Transactions
		</Button>

		{#if data?.singleUser?.banned}
			<UnBan
				action="?/unban"
				data={data.unBanForm}
				name="{data.singleUser?.firstName} {data.singleUser?.lastName}"
			/>
		{/if}
		{#if !data?.singleUser?.banned}
			<Ban
				action="?/ban"
				data={data.banForm}
				name="{data.singleUser?.firstName} {data.singleUser?.lastName}"
			/>
		{/if}
		<Delete redirect="/dashboard/users" />
		<Verify
			action="?/verify"
			data={data.verifyForm}
			verify={data.singleUser?.isVerifiedProvider}
			verificationStatus={data.singleUser?.verificationStatus}
			name="{data.singleUser?.firstName} {data.singleUser?.lastName}"
		/>

		<div class="mt-6 justify-self-start">
			<div class="grid gap-4 justify-self-start! md:grid-cols-2 lg:grid-cols-4">
				<div
					class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"
				>
					<p class="text-sm font-medium text-slate-500 dark:text-slate-400">Available Balance</p>
					<div class="mt-2 flex items-baseline gap-1">
						<h3 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
							${data?.vendorWallets?.balance ?? '0.00'}
						</h3>
					</div>
					<p class="mt-1 text-xs text-slate-400">Ready for withdrawal</p>
				</div>

				<div
					class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"
				>
					<p class="text-sm font-medium text-slate-500 dark:text-slate-400">Pending</p>
					<div class="mt-2 flex items-baseline gap-1">
						<h3 class="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-500">
							${data?.vendorWallets?.pendingBalance ?? '0.00'}
						</h3>
					</div>
					<p class="mt-1 text-xs text-slate-400">In escrow/processing</p>
				</div>

				<div
					class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"
				>
					<p class="text-sm font-medium text-slate-500 dark:text-slate-400">Lifetime Earnings</p>
					<div class="mt-2 flex items-baseline gap-1">
						<h3 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
							${data?.vendorWallets?.totalEarnings ?? '0.00'}
						</h3>
					</div>
					<p class="mt-1 text-xs font-medium text-emerald-600">
						Includes tips: ${data?.vendorWallets?.totalTips ?? '0'}
					</p>
				</div>

				<div
					class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"
				>
					<p class="text-sm font-medium text-slate-500 dark:text-slate-400">Total Withdrawals</p>
					<div class="mt-2 flex items-baseline gap-1">
						<h3 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
							${data?.vendorWallets?.totalWithdrawals ?? '0.00'}
						</h3>
					</div>
					<p class="mt-1 text-xs text-slate-400">Transferred to bank</p>
				</div>
			</div>
		</div>
	</div>

	{#if edit === false}
		<div class="w-full p-4">
			<SingleTable
				singleTable={data?.singleUser?.banned ? [...singleTable, ...bannedInfo] : singleTable}
			/>
		</div>
	{/if}
	{#if edit}
		<div class="w-full p-4">
			<form action="?/editUser" use:enhance class="flex flex-col gap-4" id="edit" method="post">
				<Errors allErrors={$allErrors} />
				<InputComp
					label="First Name"
					{form}
					{errors}
					type="text"
					name="firstName"
					placeholder="Enter the first name of new user"
					required
				/>

				<InputComp
					label="Last Name"
					{form}
					{errors}
					type="text"
					name="lastName"
					placeholder="Enter the last name of new user"
					required
				/>
				<InputComp
					label="Email"
					{form}
					type="email"
					{errors}
					name="email"
					placeholder="Enter the email of new admin user"
					required
				/>

				<InputComp {form} {errors} name="role" type="text" label="Role" required />

				<InputComp
					label="Phone Number"
					{form}
					{errors}
					type="text"
					name="phoneNumber"
					placeholder="+1 (555) 000-0000"
				/>

				<InputComp
					label="Profile Photo URL"
					{form}
					{errors}
					type="url"
					name="profilePhotoUrl"
					placeholder="https://example.com/photo.jpg"
				/>

				<InputComp
					label="Bio"
					{form}
					{errors}
					type="text"
					name="bio"
					placeholder="Tell us a little about the user..."
				/>

				<hr class="my-4" />

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<InputComp
						label="City"
						{form}
						{errors}
						type="text"
						name="locationCity"
						placeholder="Austin"
					/>
					<InputComp
						label="State / Province"
						{form}
						{errors}
						type="text"
						name="locationState"
						placeholder="Texas"
					/>
				</div>

				<InputComp
					label="Country"
					{form}
					{errors}
					type="text"
					name="locationCountry"
					placeholder="USA"
				/>

				<InputComp
					label="Primary Address"
					{form}
					{errors}
					type="text"
					name="primaryAddress"
					placeholder="123 Street Name"
				/>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<InputComp label="Latitude" {form} {errors} type="number" name="latitude" />
					<InputComp label="Longitude" {form} {errors} type="number" name="longitude" />
				</div>

				<input type="hidden" name="version" bind:value={$form.version} />

				<Button form="edit" type="submit" class="mt-4">
					{#if $delayed}
						<LoadingBtn name="Saving Changes" />
					{:else}
						<Save class="h-4 w-4" />
						Save Changes
					{/if}
				</Button>
			</form>
		</div>
	{/if}
</SingleView>

<br />

<FormCard
	title="{`${data.singleUser?.firstName ?? ''} ${data.singleUser?.lastName ?? ''}`.trim() ||
		'Provider'} Services"
	description="View the full catalog of services offered by this provider."
	className="w-full! max-w-full!"
>
	{#if data?.serviceList?.length > 0}
		<DataTable
			class="lg:max-w-6xl"
			data={data.serviceList}
			{columns}
			fileName="{data?.singleUser?.firstName}_{data?.singleUser?.lastName}_Services"
		/>
	{:else}
		<div class="flex flex-col items-center justify-center py-12 text-center">
			<div class="rounded-full bg-slate-50 p-3 dark:bg-slate-900"></div>
			<p class="mt-2 text-sm font-medium text-slate-900 dark:text-slate-50">No services listed</p>
			<p class="text-sm text-slate-500">This provider hasn't added any services yet.</p>
		</div>
	{/if}
</FormCard>

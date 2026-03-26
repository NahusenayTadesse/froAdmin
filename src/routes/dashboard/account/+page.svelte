<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { Loader, LogOut, User, Globe, Mail } from '@lucide/svelte';
	import InputComp from '$lib/formComponents/InputComp.svelte';

	// ...

	let { data, form } = $props();
	let { claims, supabase, profile } = $derived(data);
	let profileForm: HTMLFormElement;
	let loading = $state(false);
	let fullName: string = profile?.full_name ?? '';
	let username: string = profile?.username ?? '';
	let website: string = profile?.website ?? '';

	// ...

	const handleSubmit: SubmitFunction = () => {
		loading = true;
		return async ({ update }) => {
			loading = false;
			update();
		};
	};

	let avatarUrl: string = $state('');

	const handleSignOut: SubmitFunction = () => {
		loading = true;
		return async ({ update }) => {
			loading = false;
			update();
		};
	};
</script>

<div class="container max-w-2xl py-10">
	<Card.Root>
		<Card.Header>
			<Card.Title class="text-2xl">Profile Settings</Card.Title>
			<Card.Description>Manage your public profile and account details.</Card.Description>
		</Card.Header>

		<Card.Content>
			<form
				method="post"
				action="?/update"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
				class="space-y-6"
			>
				<input type="hidden" name="avatarUrl" value={avatarUrl} />

				<div class="grid gap-4">
					<div class="space-y-2">
						<Label for="email">Email Address</Label>
						<div class="relative">
							<Mail class="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="email"
								name="email"
								class="cursor-not-allowed bg-muted pl-10"
								value={claims?.email ?? ''}
								disabled
							/>
						</div>
					</div>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label for="fullName">Full Name</Label>
							<div class="relative">
								<User class="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									id="fullName"
									name="fullName"
									placeholder="John Doe"
									class="pl-10"
									value={form?.fullName ?? fullName}
								/>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="username">Username</Label>
							<Input
								id="username"
								name="username"
								placeholder="johndoe"
								value={form?.username ?? username}
							/>
						</div>
					</div>

					<div class="space-y-2">
						<Label for="website">Website</Label>
						<div class="relative">
							<Globe class="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
							<Input
								id="website"
								name="website"
								type="url"
								placeholder="https://yourwebsite.com"
								class="pl-10"
								value={form?.website ?? website}
							/>
						</div>
					</div>
				</div>

				<Button type="submit" class="w-full md:w-max" disabled={loading}>
					{#if loading}
						<Loader class="mr-2 h-4 w-4 animate-spin" />
						Updating...
					{:else}
						Save Changes
					{/if}
				</Button>
			</form>
		</Card.Content>

		<Separator />

		<Card.Footer class="flex flex-col items-start gap-4 py-6">
			<div class="text-sm text-muted-foreground">Danger Zone</div>
			<form method="post" action="?/signout" use:enhance class="w-full">
				<Button
					variant="outline"
					type="submit"
					class="w-full text-destructive hover:bg-destructive/10 md:w-max"
				>
					<LogOut class="mr-2 h-4 w-4" />
					Sign Out
				</Button>
			</form>
		</Card.Footer>
	</Card.Root>
</div>
<!-- <div class="form-widget">
	<form
		class="form-widget"
		method="post"
		action="?/update"
		use:enhance={handleSubmit}
		bind:this={profileForm}
	>
		<input type="hidden" name="avatarUrl" value={avatarUrl} />
		<div>
			<label for="email">Email</label>
			<input id="email" type="text" value={claims?.email ?? ''} disabled />
		</div>

		<div>
			<label for="fullName">Full Name</label>
			<input id="fullName" name="fullName" type="text" value={form?.fullName ?? fullName} />
		</div>

		<div>
			<label for="username">Username</label>
			<input id="username" name="username" type="text" value={form?.username ?? username} />
		</div>

		<div>
			<label for="website">Website</label>
			<input id="website" name="website" type="url" value={form?.website ?? website} />
		</div>

		<div>
			<input
				type="submit"
				class="button primary block"
				value={loading ? 'Loading...' : 'Update'}
				disabled={loading}
			/>
		</div>
	</form>

	<form method="post" action="?/signout" use:enhance={handleSignOut}>
		<div>
			<button class="button block" disabled={loading}>Sign Out</button>
		</div>
	</form>
</div> -->

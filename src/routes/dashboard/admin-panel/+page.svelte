<script>
	import AdminNavCard from '$lib/components/AdminCard.svelte';
	import { Button } from '$lib/components/ui/button';

	let userManagement = [
		{ name: 'Admin Users', href: '/dashboard/admin-panel/users' },
		{ name: 'Admin Roles', href: '/dashboard/admin-panel/roles' }
	];
</script>

<svele:head>
	<title>Admin Panel</title>
</svele:head>

<div class="min-h-dvh w-full text-foreground transition-colors duration-300">
	<!-- Header -->

	<!-- Main Content -->
	<main class="mx-auto max-w-7xl px-6 py-12">
		<!-- Hero Section -->
		<div class="mb-16 flex flex-col gap-4">
			<h2 class="text-4xl font-bold tracking-tight">Welcome to Admin Dashboard</h2>
			<p class="max-w-2xl text-lg text-muted-foreground">Manage roles and user access.</p>
		</div>

		<!-- Navigation Cards Grid -->
		<div class="grid gap-8 md:grid-cols-3">
			<AdminNavCard
				title="User Management"
				description="Control users and their assigned roles"
				icon="Users"
				items={userManagement}
				accentColor="from-violet-500/15 to-violet-500/5"
			/>
		</div>
	</main>

	<!-- Footer -->
</div>

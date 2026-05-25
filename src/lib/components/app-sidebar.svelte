<script lang="ts">
	import {
		Users,
		LayoutDashboard,
		Toolbox,
		User,
		ShieldUser,
		KeyRound,
		UserCheck,
		CalendarClock,
		Banknote,
		BanknoteArrowDown,
		Video
	} from '@lucide/svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import { bgGradient } from '$lib/global.svelte';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';

	import NavMain from './NavMain.svelte';

	const navigation = [
		{ title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
		{ title: 'Customers', url: '/dashboard/users', icon: Users },
		{ title: 'Providers', url: '/dashboard/vendor', icon: UserCheck },
		{ title: 'Services', url: '/dashboard/services', icon: Toolbox },
		{ title: 'Bookings', url: '/dashboard/bookings', icon: CalendarClock },
		{ title: 'Videos', url: '/dashboard/videos', icon: Video },
		{ title: 'Payments', url: '/dashboard/payments', icon: Banknote },
		{ title: 'Transactions', url: '/dashboard/transactions', icon: Banknote },
		{ title: 'Expenses', url: '/dashboard/expenses', icon: BanknoteArrowDown },

		{
			title: 'My Account',
			url: '/dashboard/account',
			icon: User,
			items: [
				{ title: 'Profile', url: '/dashboard/account', icon: User },
				{ title: 'Change Password', url: '/dashboard/change-password', icon: KeyRound }
			]
		},

		{
			title: 'Admin Panel',
			url: '/dashboard/admin-panel',
			icon: ShieldUser,
			items: [
				{
					title: 'Disputes & Reports',
					url: '/dashboard/admin-panel/disputes',
					icon: ShieldUser
				},
				{ title: 'Admin Users', url: '/dashboard/admin-panel/users', icon: Users },
				{ title: 'Admin Roles', url: '/dashboard/admin-panel/roles', icon: ShieldUser }
			]
		}
	];

	let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();

	const on = 'bg-sidebar-primary text-sidebar-primary-foreground';
	const off = 'text-sidebar-foreground';
	// function blacken(url: string) {
	// 	const currentPath = page.url.pathname;

	// 	// Special case for root dashboard
	// 	if (url === '/dashboard') {
	// 		return currentPath === '/dashboard' ? on : off;
	// 	}

	// 	// For other items, check if current path starts with their URL but is not just /dashboard
	// 	return currentPath.startsWith(url) && currentPath !== '/dashboard' ? on : off;
	// }

	// let open = $state(false);

	const sidebar = useSidebar();

	function closeSidebar() {
		if (sidebar.isMobile) {
			sidebar.setOpenMobile(false);
		}
	}
</script>

<Sidebar.Root collapsible="offcanvas" {...restProps}>
	<Sidebar.Content
		class="z-9999! h-full
  [scrollbar-width:thin] [scrollbar-color:#a3a3a3_transparent]
  overflow-y-scroll
  pt-4
  [&::-webkit-scrollbar]:w-2
  [&::-webkit-scrollbar-thumb]:bg-gray-400
  [&::-webkit-scrollbar-thumb:hover]:bg-gray-500 [&::-webkit-scrollbar-track]:bg-transparent
  {bgGradient}
"
	>
		<Sidebar.Group>
			<Sidebar.GroupLabel>
				<h4 class="text-4xl">Fro Admin</h4>
			</Sidebar.GroupLabel>
			<Sidebar.GroupContent class="my-4">
				<NavMain items={navigation} />
				<!-- <Sidebar.Menu class="w-full gap-3">
					{#each navigation as item (item.title)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								class="flex items-center gap-3 rounded-lg px-3 py-5 text-lg
          font-normal transition-colors duration-300 hover:bg-sidebar-accent
          hover:text-sidebar-accent-foreground {selectItem}
          {blacken(item.url)}"
							>
								{#snippet child({ props })}
									<a href={item.url} onclick={closeSidebar} {...props} transition:fade>
										<item.icon class="!h-5 !w-5" />
										<span>{item.title}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu> -->
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer class="flex flex-row bg-white dark:bg-black">
		<!-- <Sidebar.GroupLabel>
			Powered By <a href="https://leoradigitals.com" target="_blank" class="ml-1">Leora Digitals</a>
		</Sidebar.GroupLabel> -->
	</Sidebar.Footer>
</Sidebar.Root>

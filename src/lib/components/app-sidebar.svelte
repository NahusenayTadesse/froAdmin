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
		Video,
		Link,
		ArrowRightLeft,
		Sheet,
		SquarePen
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
		{
			title: 'Services',
			url: '/dashboard/services',
			icon: Toolbox,
			items: [
				{ title: 'All Services', url: '/dashboard/services', icon: Sheet },
				{ title: 'Service Categories', url: '/dashboard/services/categories', icon: Sheet },
				{ title: 'Service Edit', url: '/dashboard/services/service-edit', icon: SquarePen }
			]
		},
		{ title: 'Bookings', url: '/dashboard/bookings', icon: CalendarClock },
		{ title: 'Videos', url: '/dashboard/videos', icon: Video },
		{ title: 'Payments', url: '/dashboard/payments', icon: Banknote },
		{ title: 'Transactions', url: '/dashboard/transactions', icon: Banknote },
		{ title: 'Expenses', url: '/dashboard/expenses', icon: BanknoteArrowDown },
		{ title: 'Affiliate', url: '/dashboard/affiliate', icon: Link },
		{ title: 'Sales', url: '/dashboard/sales', icon: ArrowRightLeft },

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

<Sidebar.Root class="w-1/2! lg:w-1/6!" collapsible="offcanvas" {...restProps}>
	<Sidebar.Content
		class="z-9999! h-full  scrollbar-thin
  [scrollbar-color:#a3a3a3_transparent] overflow-y-scroll
  pt-4

  [&::-webkit-scrollbar]:w-2
  [&::-webkit-scrollbar-thumb]:bg-gray-400
  [&::-webkit-scrollbar-thumb:hover]:bg-gray-500 [&::-webkit-scrollbar-track]:bg-transparent
  {bgGradient}
"
	>
		<Sidebar.Group>
			<Sidebar.GroupLabel>
				<img src="/logo.png" alt="Fro Admin" class="h-12 w-1/2 justify-self-center dark:invert" />
			</Sidebar.GroupLabel>
			<Sidebar.GroupContent class="my-4">
				<NavMain {closeSidebar} items={navigation} />
			</Sidebar.GroupContent>
		</Sidebar.Group>
	</Sidebar.Content>
	<Sidebar.Footer class="flex flex-row bg-white dark:bg-black"></Sidebar.Footer>
</Sidebar.Root>

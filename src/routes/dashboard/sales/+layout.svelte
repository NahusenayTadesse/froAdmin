<script>
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	// import DialogComp from "$lib/formComponents/DialogComp.svelte";
	// import AddCustomer from "$lib/forms/AddCustomer.svelte";
	import { Plus, Sheet } from '@lucide/svelte';
	let { children } = $props();
</script>

<div class="mb-8 flex flex-row items-center justify-start gap-2">
	<Button
		href="/dashboard/sales"
		variant={page.url.pathname === '/dashboard/vendor' ? 'default' : 'outline'}
		><Sheet /> Sales Persons</Button
	>
	<Button
		href="/dashboard/sales/add"
		variant={page.url.pathname === '/dashboard/sales/add' ? 'default' : 'outline'}
		><Plus /> Add Sales Person</Button
	>

	<Button
		href="/dashboard/sales/tiers"
		variant={page.url.pathname === '/dashboard/sales/tiers' ? 'default' : 'outline'}
		><Sheet /> Sales Tiers</Button
	>
</div>

{@render children?.()}

<script>
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	// import DialogComp from "$lib/formComponents/DialogComp.svelte";
	// import AddCustomer from "$lib/forms/AddCustomer.svelte";
	import { Sheet } from '@lucide/svelte';
	let { children } = $props();
</script>

<div class="mb-8 flex flex-row items-center justify-start gap-2">
	<Button
		href="/dashboard/services"
		variant={page.url.pathname === '/dashboard/services' ? 'default' : 'outline'}
		><Sheet /> Services
	</Button>
	<Button
		href="/dashboard/services/categories"
		variant={page.url.pathname === '/dashboard/services/categories' ? 'default' : 'outline'}
		><Sheet /> Services Categories</Button
	>
</div>

{@render children?.()}

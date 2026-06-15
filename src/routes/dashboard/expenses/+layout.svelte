<script>
	import { page } from '$app/state';
	import Button from '$lib/components/ui/button/button.svelte';
	// import DialogComp from "$lib/formComponents/DialogComp.svelte";
	// import AddCustomer from "$lib/forms/AddCustomer.svelte";
	import { Sheet } from '@lucide/svelte';
	let { children } = $props();
</script>

<div class="mb-8 flex flex-row flex-wrap items-center justify-start gap-2">
	<Button
		href="/dashboard/expenses"
		variant={page.url.pathname === '/dashboard/expenses' ? 'default' : 'outline'}
		><Sheet /> Expenses
	</Button>
	<Button
		href="/dashboard/expenses/add-expense"
		variant={page.url.pathname === '/dashboard/expenses/add-expense' ? 'default' : 'outline'}
		><Sheet />Add Expense
	</Button>
	<Button
		href="/dashboard/expenses/categories"
		variant={page.url.pathname === '/dashboard/expenses/categories' ? 'default' : 'outline'}
		><Sheet />Expense Categories</Button
	>
</div>

{@render children?.()}

<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import type { Snapshot } from '@sveltejs/kit';

	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import LoadingBtn from '$lib/formComponents/LoadingBtn.svelte';
	import DatePicker2 from '$lib/formComponents/DatePicker2.svelte';

	import * as Card from '$lib/components/ui/card/index.js';
	import { Plus } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { insertExpenseSchema as expensesSchema } from './expenseSchema';
	import { superForm } from 'sveltekit-superforms/client';
	import SelectComp from '$lib/formComponents/SelectComp.svelte';

	let { data } = $props();

	const { form, errors, enhance, delayed, message, capture, restore } = superForm(data.form, {
		taintedMessage: () => {
			return new Promise((resolve) => {
				resolve(window.confirm('Do you want to leave?\nChanges you made may not be saved.'));
			});
		},

		validators: zod4Client(expensesSchema)
	});

	import { toast } from 'svelte-sonner';
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
</script>

<svelte:head>
	<title>Add New Expense</title>
</svelte:head>

{#snippet fe(
	label = '',
	name = '',
	type = '',
	placeholder = '',
	required = false,
	min = '',

	max = ''
)}
	<div class="flex w-full flex-col justify-start gap-2">
		<Label for={name}>{label}</Label>
		<Input
			{type}
			{name}
			{placeholder}
			{required}
			{min}
			{max}
			bind:value={$form[name]}
			aria-invalid={$errors[name] ? 'true' : undefined}
		/>
		{#if $errors[name]}
			<span class="text-red-500">{$errors[name]}</span>
		{/if}
	</div>
{/snippet}
{#snippet selects(name, items)}
	<div class="flex w-full flex-col justify-start gap-2">
		<Label for={name} class="capitalize">Expense {name.replace(/([a-z])([A-Z])/g, '$1 $2')}:</Label>

		<SelectComp {name} bind:value={$form[name]} {items} />
		{#if $errors[name]}<span class="text-red-500">{$errors[name]}</span>{/if}
	</div>
{/snippet}

{#snippet date(name, title)}
	<Label for={name} class="capitalize">{title}</Label>

	<DatePicker2 bind:data={$form[name]} oldDays={true} />
	<input type="hidden" {name} bind:value={$form[name]} />
	{#if $errors[name]}<span class="text-red-500">{$errors[name]}</span>{/if}
{/snippet}

<Card.Root class="flex w-full flex-col gap-4 lg:w-lg">
	<Card.Header>
		<Card.Title class="text-2xl">Add an Expense</Card.Title>
		<Card.Description>Add a new expense that is not a sale.</Card.Description>
	</Card.Header>
	<Card.Content>
		<form
			use:enhance
			action="?/addExpense"
			id="main"
			class="flex flex-col gap-4"
			method="post"
			enctype="multipart/form-data"
		>
			{@render date('expenseDate', 'Expense Date')}
			{@render selects('type', data?.categories)}

			<div class="flex w-full flex-col justify-start gap-2">
				<Label for="description">Expense Description (optional)</Label>

				<Textarea
					name="description"
					placeholder="Enter added product description"
					bind:value={$form.description}
					aria-invalid={$errors.description ? 'true' : undefined}
				/>

				{#if $errors.description}<span class="text-red-500">{$errors.description}</span>{/if}
			</div>
			{@render fe(
				'Amount Fee',
				'total',
				'number',
				'Enter the total amount of the expense',
				true,
				'0'
			)}

			<Button type="submit" class="mt-4" form="main">
				{#if $delayed}
					<LoadingBtn name="Adding Expense" />
				{:else}
					<Plus class="h-4 w-4" />
					Add Expense
				{/if}
			</Button>
		</form>
	</Card.Content>
</Card.Root>

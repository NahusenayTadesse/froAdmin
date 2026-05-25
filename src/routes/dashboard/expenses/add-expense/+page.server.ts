import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { fail } from '@sveltejs/kit';
import { sql, eq, and } from 'drizzle-orm';
import { insertExpenseSchema as schema } from './expenseSchema';
import { db } from '$lib/server/db';
import { expenses, expensesType } from '$lib/server/db/schema';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types.js';
import { setFlash } from 'sveltekit-flash-message/server';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(schema));
	const categories = await db
		.select({
			value: expensesType.id,
			name: expensesType.name,
			description: expensesType.description
		})
		.from(expensesType);

	return {
		form,
		categories
	};
};

export const actions: Actions = {
	addExpense: async ({ request, cookies, locals }) => {
		const form = await superValidate(request, zod4(schema));

		console.log(form);

		if (!form.valid) {
			// Stay on the same page and set a flash message
			setFlash({ type: 'error', message: 'Please check your form data.' }, cookies);
			return fail(400, { form });
		}

		const { expenseDate, total, type, description } = form.data;

		console.log(locals?.user?.id);

		try {
			await db.insert(expenses).values({
				total,
				type,
				description,
				expenseDate,
				createdBy: locals.user.id
			});

			return message(form, { type: 'success', text: 'Expense Added Successfully' });
		} catch (err) {
			console.error(err);
			return message(
				form,
				{ type: 'error', text: `Unexpected Error: ${err.message}` },
				{ status: 500 }
			);
		}
	}
};

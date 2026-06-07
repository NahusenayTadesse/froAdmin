import { setError, superValidate, message, fail } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { eq } from 'drizzle-orm';

import { add, edit, disable, enable } from './schema';
import { db } from '$lib/server/db';
import { salesTiers as department } from '$lib/server/db/schema';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(add));
	const editForm = await superValidate(zod4(edit));
	const disableForm = await superValidate(zod4(disable));
	const enableForm = await superValidate(zod4(enable));

	const allData = await db.select().from(department);

	return {
		form,
		editForm,
		disableForm,
		allData,
		enableForm
	};
};

export const actions: Actions = {
	add: async ({ request }) => {
		const form = await superValidate(request, zod4(add));

		if (!form.valid) {
			return message(form, { type: 'error', text: 'Please check the form for Errors' });
		}

		const {
			name,
			minSignups,
			ratePerUser,
			bonusThreshold,
			bonusAmount,
			currency,

			isActive
		} = form.data;

		try {
			await db.insert(department).values({
				name,
				minSignups,
				ratePerUser,
				bonusThreshold,
				bonusAmount,
				currency,
				isActive
			});

			return message(form, { type: 'success', text: 'Sales Tier Successfully Added' });
		} catch (err: any) {
			if (err.code === 'ER_DUP_ENTRY') setError(form, 'name', 'Sales Tier already exists.');
			return message(form, {
				type: 'error',
				text:
					err.code === 'ER_DUP_ENTRY'
						? 'Sales Tier already exists. Please choose another one.'
						: err.message
			});
		}
	},
	edit: async ({ request }) => {
		const form = await superValidate(request, zod4(edit));
		if (!form.valid) {
			return message(form, { type: 'error', text: 'Please check the form for Errors' });
		}

		const {
			id,
			name,
			minSignups,
			ratePerUser,
			bonusThreshold,
			bonusAmount,
			currency,

			isActive
		} = form.data;

		try {
			await db
				.update(department)
				.set({
					name,
					minSignups,
					ratePerUser,
					bonusThreshold,
					bonusAmount,
					currency,

					isActive
				})
				.where(eq(department.id, id));
			return message(form, { type: 'success', text: 'Sales Tier Successfully Updated' });
		} catch (err: any) {
			if (err.code === 'ER_DUP_ENTRY') return;
			setError(form, 'name', 'Sales Tier name already exists.');
			return message(form, {
				type: 'error',
				text:
					err.code === 'ER_DUP_ENTRY'
						? 'Sales Tier  name is already taken. Please choose another one.'
						: err.message
			});
		}
	},
	disable: async ({ request }) => {
		const form = await superValidate(request, zod4(disable));
		if (!form.valid) {
			return message(form, { type: 'error', text: 'Please check the form for Errors' });
		}

		const { id } = form.data;

		try {
			await db.update(department).set({ status: false }).where(eq(department.id, id));
			return message(form, { type: 'success', text: 'Service Category Successfully Updated' });
		} catch (err: any) {
			return message(form, {
				type: 'error',
				text: err.message
			});
		}
	},
	enable: async ({ request }) => {
		const form = await superValidate(request, zod4(disable));
		if (!form.valid) {
			return message(form, { type: 'error', text: 'Please check the form for Errors' });
		}
		const { id } = form.data;

		try {
			await db.update(department).set({ status: true }).where(eq(department.id, id));
			return message(form, { type: 'success', text: 'Service Category Successfully Updated' });
		} catch (err: any) {
			return message(form, {
				type: 'error',
				text: err.message
			});
		}
	}
};

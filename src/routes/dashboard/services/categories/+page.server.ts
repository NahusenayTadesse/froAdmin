import { setError, superValidate, message, fail } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { eq } from 'drizzle-orm';

import { add, edit } from './schema';
import { db } from '$lib/server/db';
import { serviceCategories as department } from '$lib/server/db/schema';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(add));
	const editForm = await superValidate(zod4(edit));

	const allData = await db.select().from(department).orderBy(department.sortOrder);

	return {
		form,
		editForm,
		allData
	};
};

export const actions: Actions = {
	add: async ({ request }) => {
		const form = await superValidate(request, zod4(add));

		if (!form.valid) {
			return message(form, { type: 'error', text: 'Please check the form for Errors' });
		}

		const { name, description, allowImages, requiresBeforeImage, requiresAfterImage } = form.data;

		try {
			await db.insert(department).values({
				name,
				description,
				allowImages,
				requiresBeforeImage,
				requiresAfterImage
			});

			return message(form, { type: 'success', text: 'Service Category Successfully Added' });
		} catch (err: any) {
			if (err.code === 'ER_DUP_ENTRY') setError(form, 'name', 'Service Category already exists.');
			return message(form, {
				type: 'error',
				text:
					err.code === 'ER_DUP_ENTRY'
						? 'Educational Level already exists. Please choose another one.'
						: err.message
			});
		}
	},
	edit: async ({ request }) => {
		const form = await superValidate(request, zod4(edit));
		if (!form.valid) {
			return fail(400, { form });
		}

		const { id, name, description, allowImages, requiresBeforeImage, requiresAfterImage } =
			form.data;

		try {
			await db
				.update(department)
				.set({ name, description, allowImages, requiresBeforeImage, requiresAfterImage })
				.where(eq(department.id, id));
			return message(form, { type: 'success', text: 'Educational Level Successfully Updated' });
		} catch (err: any) {
			if (err.code === 'ER_DUP_ENTRY') return;
			setError(form, 'name', 'Educational Level name already exists.');
			return message(form, {
				type: 'error',
				text:
					err.code === 'ER_DUP_ENTRY'
						? 'Educational Level name is already taken. Please choose another one.'
						: err.message
			});
		}
	}
};

import { setError, superValidate, message, fail } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { and, eq, getTableColumns, ilike, or } from 'drizzle-orm';

import { add, edit } from './schema';
import { db } from '$lib/server/db';
import { services, serviceCategories } from '$lib/server/db/schema';

import type { Actions, PageServerLoad } from './$types';

function getStringParam(url: URL, key: string, fallback = '') {
	return url.searchParams.get(key)?.trim() ?? fallback;
}

function getBooleanParam(url: URL, key: string): boolean | null {
	const value = url.searchParams.get(key);

	if (value === 'true') return true;
	if (value === 'false') return false;

	return null;
}

export const load: PageServerLoad = async ({ url }) => {
	const form = await superValidate(zod4(add));
	const editForm = await superValidate(zod4(edit));

	const search = getStringParam(url, 'search');
	const categoryId = getStringParam(url, 'categoryId');
	const pricingType = getStringParam(url, 'pricingType');
	const locationType = getStringParam(url, 'locationType');
	const isActive = getBooleanParam(url, 'isActive');
	const bookingEnabled = getBooleanParam(url, 'bookingEnabled');

	const whereConditions = and(
		search
			? or(
					ilike(services.title, `%${search}%`),
					ilike(services.shortDescription, `%${search}%`),
					ilike(services.fullDescription, `%${search}%`),
					ilike(serviceCategories.name, `%${search}%`)
				)
			: undefined,

		categoryId ? eq(services.categoryId, categoryId) : undefined,
		pricingType ? eq(services.pricingType, pricingType) : undefined,
		locationType ? eq(services.locationType, locationType) : undefined,
		isActive !== null ? eq(services.isActive, isActive) : undefined,
		bookingEnabled !== null ? eq(services.bookingEnabled, bookingEnabled) : undefined
	);

	const allData = await db
		.select({
			...getTableColumns(services),
			categoryName: serviceCategories.name
		})
		.from(services)
		.leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
		.where(whereConditions);

	const categoryList = await db
		.select({
			value: serviceCategories.id,
			name: serviceCategories.name
		})
		.from(serviceCategories);

	return {
		form,
		editForm,
		allData,
		categoryList,
		query: {
			search,
			categoryId,
			pricingType,
			locationType,
			isActive,
			bookingEnabled
		}
	};
};

export const actions: Actions = {
	add: async ({ request }) => {
		const form = await superValidate(request, zod4(add));

		if (!form.valid) {
			return message(form, { type: 'error', text: 'Please check the form for Errors' });
		}

		const { name, category, description, status } = form.data;

		try {
			await db.insert(department).values({
				name,
				categoryId: category,
				description,
				status: status
			});

			return message(form, { type: 'success', text: 'Service Successfully Added' });
		} catch (err: any) {
			if (err.code === 'ER_DUP_ENTRY') setError(form, 'name', 'Service already exists.');
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

		const { id, name, description, status } = form.data;

		try {
			await db
				.update(department)
				.set({ name, description, status })
				.where(eq(department.id, Number(id)));
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

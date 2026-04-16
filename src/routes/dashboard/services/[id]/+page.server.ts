import { setError, superValidate, message, fail } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';

import { add, edit } from './schema';
import { db } from '$lib/server/db';
import { services, serviceCategories, bookings, profiles } from '$lib/server/db/schema';
import { eq, count, getTableColumns } from 'drizzle-orm';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;

	const idSchema = z.uuid();
	const validation = idSchema.safeParse(id);

	if (!validation.success) {
		error(404, 'Invalid ID, there is no Service with this ID');
	}
	const form = await superValidate(zod4(add));

	const singleService = await db
		.select({
			...getTableColumns(services),
			categoryName: serviceCategories.name,
			providerName: profiles.firstName,
			providerLastName: profiles.lastName,
			numberOfBookings: count(bookings.id)
		})
		.from(services)
		.leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
		.leftJoin(profiles, eq(services.providerId, profiles.id))
		.leftJoin(bookings, eq(services.id, bookings.serviceId))
		.where(eq(services.id, id))
		.groupBy(services.id, serviceCategories.name, profiles.firstName, profiles.lastName)
		.then((rows) => rows[0]);

	if (!singleService) {
		error(404, 'Invalid ID, there is no Service with this ID');
	}

	const categoryList = await db
		.select({ value: serviceCategories.id, name: serviceCategories.name })
		.from(serviceCategories);

	const editForm = singleService
		? await superValidate(singleService, zod4(edit))
		: await superValidate(zod4(edit));

	return {
		form,
		editForm,
		singleService,
		categoryList
	};
};

export const actions: Actions = {
	edit: async ({ request, params }) => {
		const { id } = params;
		const form = await superValidate(request, zod4(edit));
		if (!form.valid) {
			return message(
				form,
				{
					type: 'error',
					text: 'Plase check the form for errors'
				},
				{ status: 400 }
			);
		}

		try {
			await db.update(services).set(form.data).where(eq(services.id, id));
			return message(form, { type: 'success', text: 'Service Successfully Updated' });
		} catch (err: any) {
			return message(form, {
				type: 'error',
				text: err.message
			});
		}
	}
};

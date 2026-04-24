import { db } from '$lib/server/db';
import { bookings, profiles, services, walletTransactions } from '$lib/server/db/schema';
import { asc, eq, sql, getTableColumns, aliasedTable } from 'drizzle-orm';
import { z } from 'zod/v4';
import { error } from '@sveltejs/kit';

import type { PageServerLoad, Actions } from './$types';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { edit } from './schema';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;
	const idSchema = z.uuid();
	const validation = idSchema.safeParse(id);

	if (!validation.success) {
		error(404, 'Invalid ID, there is no Service with this ID');
	}

	const customers = aliasedTable(profiles, 'customers');
	const providers = aliasedTable(profiles, 'providers');

	const allTransactions = await db
		.select({
			...getTableColumns(bookings),
			customerName: sql<string>`concat(${customers.firstName}, ' ', ${customers.lastName})`,
			providerName: sql<string>`concat(${providers.firstName}, ' ', ${providers.lastName})`,
			serviceName: services.title
		})
		.from(bookings)
		.leftJoin(services, eq(services.id, bookings.serviceId))
		.leftJoin(customers, eq(customers.id, bookings.customerId))
		.leftJoin(providers, eq(providers.id, bookings.providerId))
		.where(eq(bookings.id, id))
		.limit(1)
		.then((rows) => rows[0]);

	if (!allTransactions) {
		error(404, 'Booking not found');
	}

	const form = await superValidate(allTransactions, zod4(edit));

	const bookingWallets = await db
		.select()
		.from(walletTransactions)
		.where(eq(walletTransactions.bookingId, id));

	return {
		booking: allTransactions,
		bookingWallets,
		form
	};
};

export const actions: Actions = {
	edit: async ({ request, params }) => {
		const { id } = params;
		const form = await superValidate(request, zod4(edit));

		const {
			scheduledDate,
			scheduledStartTime,
			scheduledEndTime,
			address,

			// Geolocation (Optional updates)
			latitude,
			longitude,

			// Statuses (Use enums if you have them defined in your DB)
			bookingStatus,
			paymentStatus,

			// Financials (Numeric is usually handled as a string in JS to preserve precision)
			totalPrice,

			// Notes & Context
			notesFromCustomer,
			cancellationReason
		} = form.data; // Makes all fields optional for PATCH requests}
		if (!form.valid) {
			return message(
				form,
				{
					type: 'error',
					text: 'Please check the form for errors'
				},
				{ status: 400 }
			);
		}

		try {
			await db
				.update(bookings)
				.set({
					scheduledDate,
					scheduledStartTime,
					scheduledEndTime: scheduledEndTime ?? null,
					address,
					latitude,
					longitude,
					bookingStatus: String(bookingStatus),
					paymentStatus: String(paymentStatus),
					totalPrice: String(totalPrice),
					notesFromCustomer,
					cancellationReason
				})
				.where(eq(bookings.id, id));
			return message(form, { type: 'success', text: 'Service Successfully Updated' });
		} catch (err: any) {
			console.error(err);
			return message(form, {
				type: 'error',
				text: err.message
			});
		}
	}
};

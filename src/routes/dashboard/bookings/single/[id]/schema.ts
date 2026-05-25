import { z } from 'zod/v4';

export const edit = z.object({
	// Logistics
	scheduledDate: z.string('Scheduled date is required'),
	scheduledStartTime: z.string('Scheduled start time is required'),
	scheduledEndTime: z.string('Scheduled end time is required'),
	address: z.string().nullable().optional(),

	// Geolocation (Optional updates)
	latitude: z.number().min(-90).max(90).nullable().optional(),
	longitude: z.number().min(-180).max(180).nullable().optional(),

	// Statuses (Use enums if you have them defined in your DB)
	bookingStatus: z
		.enum(['pending', 'confirmed', 'ongoing', 'completed', 'canceled'])
		.nullable()
		.optional(),
	paymentStatus: z.enum(['pending', 'paid', 'refunded', 'failed']).nullable().optional(),

	// Financials (Numeric is usually handled as a string in JS to preserve precision)
	totalPrice: z.coerce.number('Total price is required').nullable().optional(),

	// Notes & Context
	notesFromCustomer: z.string().nullable().optional(),
	cancellationReason: z.string().nullable().optional()
}); // Makes all fields optional for PATCH requests

// Type inference
export type Edit = z.infer<typeof edit>;

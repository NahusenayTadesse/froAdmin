import { z } from 'zod/v4';

export const add = z.object({
	name: z.string('Name of Payment Method is required').min(2).max(50),
	description: z.string('Description is required').min(2).max(100),
	category: z.coerce.number('Category is required'),
	status: z.boolean('Status is required')
});

export const edit = z.object({
	// Basic Information
	categoryId: z.string('Category is required'),
	title: z.string().min(3, 'Title must be at least 3 characters').max(100),
	shortDescription: z.string().max(255).optional(),
	fullDescription: z.string('Please provide a detailed description'),

	// Pricing & Logistics
	basePrice: z.coerce.number().min(0, 'Price cannot be negative'),
	priceMin: z.coerce.number().min(0).optional(),
	priceMax: z.coerce.number().min(0).optional(),
	pricingType: z.string().optional(), // Adjust enums to your backend

	// Location & Radius
	locationType: z.string(),
	serviceRadiusKm: z.coerce.number().nonnegative().optional(),
	latitude: z.coerce.number().optional(),
	longitude: z.coerce.number().optional(),

	// Booking Rules
	estimatedDurationMinutes: z.coerce.number().int().positive(),
	minBookingNoticeHours: z.coerce.number().int().nonnegative(),
	maxDailyBookings: z.coerce.number().int().positive(),

	// Status & Flags
	isActive: z.boolean().default(true),
	bookingEnabled: z.boolean().default(true),
	allowImages: z.boolean().default(false).optional().nullable(),
	requiresBeforeImage: z.boolean().default(false).optional().nullable(),
	requiresAfterImage: z.boolean().default(false).optional().nullable(),

	// Read-only or Metadata (Usually handled by backend, but included for completeness)
	averageRating: z.number().optional(),
	ratingCount: z.number().optional()
});

// Extract the type for TypeScript usage

export type Edit = z.infer<typeof edit>;

import { z } from 'zod/v4';

export const editUserSchema = z.object({
	email: z.email('Invalid email address'),
	firstName: z.string().min(2, 'First name is too short').max(100),
	lastName: z.string().min(2, 'Last name is too short').max(100),
	role: z.string().min(1, 'Role is required'),

	// Profile Details
	phoneNumber: z.string().max(20).optional().nullable(),
	profilePhotoUrl: z.string().url('Invalid URL').optional().nullable(),
	bio: z.string().max(500, 'Bio must be under 500 characters').optional().nullable(),

	// Location
	locationCity: z.string().max(100).optional().nullable(),
	locationState: z.string().max(100).optional().nullable(),
	locationCountry: z.string().max(100).optional().nullable(),
	primaryAddress: z.string().max(255).optional().nullable(),

	// Precision Data
	latitude: z.number().min(-90).max(90).optional().nullable(),
	longitude: z.number().min(-180).max(180).optional().nullable(),

	version: z.number().int().optional().nullable()
});

export type EditUserSchema = typeof editUserSchema;

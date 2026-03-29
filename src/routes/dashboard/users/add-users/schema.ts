import { z } from 'zod/v4';

export const addUserSchema = z.object({
	firstName: z
		.string()
		.min(1, 'First Name is required')
		.max(100, 'First Name must be less than 100 characters'),
	lastName: z
		.string()
		.min(1, 'Last Name is required')
		.max(100, 'Last Name must be less than 100 characters'),
	email: z.email('Invalid email address').min(1, 'Email is required'),
	password: z
		.string()
		.min(6, 'Password must be at least 6 characters')
		.max(128, 'Password must be less than 128 characters'),
	role: z.uuid('Role is required')
});

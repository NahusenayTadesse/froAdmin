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
		.min(8, 'Password must be at least 8 characters')
		.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
		.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
		.regex(/[0-9]/, 'Password must contain at least one number')
		.regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
	role: z.uuid('Role is required')
});

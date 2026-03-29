import { z } from 'zod/v4';

export const editUserSchema = z.object({
	email: z.email('Email is required'),
	firstName: z.string('First name is required').min(2).max(100),
	lastName: z.string('Last name is required').min(2).max(100),
	role: z.uuid(),
	editPermission: z.boolean().default(false),
	permissionsList: z.array(z.uuid()).optional()
});

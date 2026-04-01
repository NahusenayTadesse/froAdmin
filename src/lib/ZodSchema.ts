import { z } from 'zod/v4';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 5MB limit
const ACCEPTED_FILE_TYPES = [
	'image/jpeg', // Common for both platforms
	'image/png', // Common for both platforms (and screenshots)
	'image/webp', // Common modern format (often Android screenshots/exports)
	'image/heic', // High Efficiency Image File (iOS default)
	'image/heif', // High Efficiency Image File (related to HEIC)
	'application/pdf' // Document format, kept from original
];
export const addUser = z.object({
	name: z.string('Name is Required').min(2).max(100),
	phone: z.string('Phone is Required').min(10).max(15),
	email: z.email('Email is Required'),
	password: z.string('Password is required!')
});
export type SignupSchema = typeof addUser;
export const loginSchema = z.object({
	email: z.email({ error: 'Invalid email address' }),
	password: z.string().min(8, { error: 'Password must be at least 8 characters' })
});
export type LoginSchema = typeof loginSchema;

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
	role: z.number('Role is required')
});

export type AddUserSchema = typeof addUserSchema;

export type EditService = typeof editService;

export const createRoleSchema = z.object({
	name: z
		.string()
		.min(1, 'Role name is required')
		.max(100, 'Role name must be under 100 characters'),

	description: z
		.string()
		.min(1, 'Role description is required')
		.max(500, 'Role description must be under 500 characters'),

	permissions: z.array(z.string().min(1)).nonempty('At least one permission must be selected')
});

export type CreateRoleSchema = z.infer<typeof createRoleSchema>;

export const positionSchema = z.object({
	name: z
		.string()
		.min(1, 'Role name is required')
		.max(100, 'Role name must be under 100 characters'),

	description: z
		.string()
		.min(1, 'Role description is required')
		.max(500, 'Role description must be under 500 characters')
});
export type PositionSchema = z.infer<typeof positionSchema>;

export const serviceCategorySchema = z.object({
	name: z
		.string()
		.min(1, 'Role name is required')
		.max(100, 'Role name must be under 100 characters'),

	description: z
		.string()
		.min(1, 'Role description is required')
		.max(500, 'Role description must be under 500 characters')
});

export type ServiceCategorySchema = z.infer<typeof serviceCategorySchema>;

const today = new Date();
today.setHours(0, 0, 0, 0);

export const banUserSchema = z.object({
	banReason: z.string().max(500, 'Reason must be less than 500 characters')
});

export type BanUserSchema = z.infer<typeof banUserSchema>;

import { z } from 'zod/v4';

export const add = z.object({
	name: z.string().min(1, 'Name is required'),

	minSignups: z.number().int().nonnegative().default(0),

	// Decimals/Numerics are best handled as strings or coerced numbers in Zod
	ratePerUser: z.number().int().nonnegative().default(0),

	// Nullable because it lacks .notNull() in Drizzle
	bonusThreshold: z.number().int().nonnegative().nullable().optional(),

	bonusAmount: z.number().int().nonnegative().default(0),

	currency: z.string().default('usd'),

	isActive: z.boolean().default(true)
});

export const edit = z.object({
	id: z.coerce.string(),
	name: z.string().min(1, 'Name is required'),

	minSignups: z.number().int().nonnegative().default(0),

	// Decimals/Numerics are best handled as strings or coerced numbers in Zod
	ratePerUser: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, 'Invalid currency format')
		.default('0.00'),

	// Nullable because it lacks .notNull() in Drizzle
	bonusThreshold: z.number().int().nonnegative().nullable(),

	bonusAmount: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, 'Invalid currency format')
		.default('0.00'),

	currency: z.string().default('usd'),

	isActive: z.boolean().default(true)
});
export type Edit = z.infer<typeof edit>;

export const disable = z.object({
	id: z.coerce.string('Category Not Found')
});
export type Disable = z.infer<typeof disable>;

export const enable = z.object({
	id: z.coerce.string('Category Not Found')
});
export type Enable = z.infer<typeof enable>;

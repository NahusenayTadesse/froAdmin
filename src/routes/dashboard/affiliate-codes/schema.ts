import { z } from 'zod/v4';

export const add = z.object({
	name: z.string('Name of Payment Method is required').min(2).max(50),
	description: z.string('Description is required').min(2).max(100),
	allowImages: z.boolean('Allow Images is required').default(false),
	sortOrder: z.number('Sort Order is required').default(0),
	requiresBeforeImage: z.boolean('Requires Before Image is required').default(false),
	requiresAfterImage: z.boolean('Requires After Image is required').default(false)
});

export const edit = z.object({
	id: z.coerce.string(),
	name: z.string('Name of Payment Method is required').min(2).max(50),
	description: z.string('Description is required').min(2).max(100),
	sortOrder: z.number('Sort Order is required').default(0),
	allowImages: z.boolean('Allow Images is required').default(false),
	requiresBeforeImage: z.boolean('Requires Before Image is required').default(false),
	requiresAfterImage: z.boolean('Requires After Image is required').default(false)
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

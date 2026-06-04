import { z } from 'zod/v4';

export const edit = z.object({
	code: z
		.string()
		.min(3, 'Code must be at least 3 characters long.')
		.max(40, 'Code cannot exceed 40 characters.')
		.regex(
			/^[A-Za-z0-9_-]+$/,
			'Code can only contain letters, numbers, hyphens (-), and underscores (_).'
		),

	isActive: z.boolean('Is Active is required').default(true),

	customCommissionBps: z
		.preprocess(
			(val) => (val === '' || val === null ? undefined : Number(val)),
			z.number().int().min(0).max(10000)
		)
		.optional(),

	manualAdjustmentAmount: z
		.preprocess((val) => (val === '' || val === null ? 0 : Number(val)), z.number())
		.default(0),

	adminNotes: z.string().trim().max(1000, 'Notes cannot exceed 1000 characters.').optional()
});

export type Edit = typeof edit;

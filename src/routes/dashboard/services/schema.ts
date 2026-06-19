import { z } from 'zod/v4';

export const add = z.object({
	name: z.string('Name of Payment Method is required').min(2).max(50),
	description: z.string('Description is required').min(2).max(100),
	category: z.coerce.number('Category is required'),

	status: z.boolean('Status is required')
});

export const edit = z.object({
	id: z.coerce.string(),
	name: z.string('Name of Payment Method is required').min(2).max(50),
	category: z.coerce.number('Category is required'),
	description: z.string('Description is required').min(2).max(100),
	status: z.boolean('Status is required')
});
export type Edit = z.infer<typeof edit>;

const reviewSchema = z
	.object({
		requestId: z.string().uuid('Valid edit request ID is required.'),
		action: z.enum(['approve', 'reject_restore', 'reject_suspend']),
		adminNote: z.string().optional()
	})
	.refine(
		(data) => data.action === 'approve' || (data.adminNote && data.adminNote.trim().length > 0),
		{
			message: 'An explanatory note is strictly required when rejecting a request.',
			path: ['adminNote']
		}
	);

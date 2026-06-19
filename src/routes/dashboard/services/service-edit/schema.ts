// src/routes/dashboard/admin-panel/service-edits/schema.ts
import { z } from 'zod';

export const reviewSchema = z
	.object({
		requestId: z.string().uuid({ message: 'Valid request ID is required.' }),
		action: z.enum(['approve', 'reject_restore', 'reject_suspend'], {
			errorMap: () => ({ message: 'Please select a valid review action status.' })
		}),
		adminNote: z.string().optional()
	})
	.refine(
		(data) => {
			// If rejecting, the admin note must be filled out and not just blank space
			if (data.action === 'reject_restore' || data.action === 'reject_suspend') {
				return data.adminNote && data.adminNote.trim().length > 0;
			}
			return true;
		},
		{
			message: 'An explanatory note is strictly required when rejecting a request.',
			path: ['adminNote']
		}
	);

export type ReviewSchema = typeof reviewSchema;

import { z } from 'zod/v4';

export const changeStatus = z.object({
	ids: z.string('Select a video first').nonempty('Select a video first'),
	status: z.boolean().default(true),
	verificationState: z.string().optional()
});

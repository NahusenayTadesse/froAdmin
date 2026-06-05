import { z } from 'zod/v4';

export const addUserSchema = z.object({
	provider: z.uuid('Provider is required'),
	currentTier: z.uuid('Current Tier is required'),
	status: z.string('Status is required').default('active'),
	canAlsoViewAffiliate: z.boolean('Can Also View Affiliate is required').default(false)
});

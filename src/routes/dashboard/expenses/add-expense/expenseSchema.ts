import { z } from 'zod/v4';

/**
 * Zod schema for inserting a new expense record.
 * This corresponds to the 'expenses' table.
 */
export const insertExpenseSchema = z.object({
	expenseDate: z.string().min(1, { message: 'Expense date is required.' }),

	type: z.string('Type ID must be positive.'),

	description: z
		.string()
		.max(255, { message: 'Description cannot exceed 255 characters.' })
		.optional(),

	total: z.coerce
		.number('Amount is Required')
		.positive({ message: 'Total must be a positive number.' })
});

// To use this schema for a form, you might extract the type:
export type InsertExpenseForm = z.infer<typeof insertExpenseSchema>;

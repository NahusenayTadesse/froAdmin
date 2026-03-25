import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { editUserSchema as schema } from './schema';

import { db } from '$lib/server/db';
import { profiles as user } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { fail } from 'sveltekit-superforms';
import { setFlash } from 'sveltekit-flash-message/server';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;

	const form = await superValidate(zod4(schema));

	const singleUser = await db
		.select({
			id: user.id,
			name: sql<string>`concat(${user.firstName}, ' ', ${user.lastName})`,
			email: user.email,
			role: user.role,
			status: user.isVerifiedProvider,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt
		})
		.from(user)
		.where(eq(user.id, id))
		.then((rows) => rows[0]);

	if (!singleUser) {
		return fail(404, { message: 'User not found' });
	}

	// const roleList = await db
	// 	.select({
	// 		value: roles.id,
	// 		name: roles.name
	// 	})
	// 	.from(roles);

	// const permissionList = await db
	// 	.select({
	// 		id: permissions.id,
	// 		name: permissions.name,
	// 		description: permissions.description
	// 	})
	// 	.from(permissions)
	// 	.innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
	// 	.where(eq(rolePermissions.roleId, singleUser.roleId));

	return {
		singleUser,
		id,
		form
	};
};

// import { saveUploadedFile } from '$lib/server/upload';

// export const actions: Actions = {
// 	editUser: async ({ request, cookies, locals, params }) => {
// 		const form = await superValidate(request, zod4(schema));

// 		const { id } = params;

// 		if (!form.valid) {
// 			// Stay on the same page and set a flash message
// 			setFlash({ type: 'error', message: 'Please check your form data.' }, cookies);
// 			return fail(400, { form });
// 		}

// 		const { name, email, role, status } = form.data;

// 		try {
// 			await db
// 				.update(user)
// 				.set({
// 					name,
// 					email,
// 					roleId: role,
// 					isActive: status,
// 					updatedBy: locals?.user?.id
// 				})
// 				.where(eq(user.id, id));

// 			await db.delete(session).where(eq(session.userId, id));

// 			// Stay on the same page and set a flash message
// 			setFlash({ type: 'success', message: 'User Updated Successuflly Added' }, cookies);
// 			return message(form, { type: 'success', text: 'User Updated Successfully' });
// 		} catch (err) {
// 			setFlash({ type: 'error', message: 'User Update Failed: ' + err?.message }, cookies);
// 			return message(form, { type: 'error', text: 'User Update Failed ' + err?.message });
// 		}
// 	},
// 	delete: async ({ cookies, params }) => {
// 		const { id } = params;

// 		try {
// 			if (!id) {
// 				setFlash({ type: 'error', message: `Unexpected Error: ${err?.message}` }, cookies);
// 				return fail(400);
// 			}

// 			await db.delete(user).where(eq(user.id, id));

// 			setFlash({ type: 'success', message: 'User Deleted Successfully!' }, cookies);
// 		} catch (err) {
// 			console.error('Error deleting user:', err);
// 			setFlash({ type: 'error', message: `Unexpected Error: ${err?.message}` }, cookies);
// 			return fail(400);
// 		}
// 	}
// };

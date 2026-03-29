import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { editUserSchema as schema } from './schema';

import { db } from '$lib/server/db';
import {
	adminUsers as user,
	permissions,
	roles,
	rolePermissions,
	userPermissions
} from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { fail } from 'sveltekit-superforms';
import { setFlash } from 'sveltekit-flash-message/server';
import { error } from '@sveltejs/kit';
import { z } from 'zod/v4';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const { data: claimsData, error } = await supabase.auth.getClaims();

	const id = claimsData?.claims.sub;
	const form = await superValidate(zod4(schema));

	const singleUser = await db
		.select({
			id: user.id,
			name: sql<string>`concat(${user.firstName}, ' ', ${user.lastName})`,
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			roleId: user.roleId,
			role: roles.name,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt
		})
		.from(user)
		.leftJoin(roles, eq(user.roleId, roles.id))
		.where(eq(user.id, id))
		.then((rows) => rows[0]);

	if (!singleUser) {
		return fail(404, { message: 'User not found, It has been Deleted or does not exist' });
	}

	const roleList = await db
		.select({
			value: roles.id,
			name: roles.name
		})
		.from(roles);

	const permissionList = await db
		.select({
			id: permissions.id,
			name: permissions.name,
			description: permissions.description
		})
		.from(permissions)
		.innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
		.where(eq(rolePermissions.roleId, singleUser.roleId));

	if (!singleUser) {
		error(404, 'User with this ID not found');
	}

	return {
		singleUser,
		id,
		form,
		roleList,
		permissionList
	};
};

import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SERVICE_ROLE_KEY } from '$env/static/private';
const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, PRIVATE_SERVICE_ROLE_KEY, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});

export const actions: Actions = {
	editUser: async ({ request, params }) => {
		const form = await superValidate(request, zod4(schema));

		const { id } = params;

		if (!form.valid) {
			// Stay on the same page and set a flash message
			return message(form, { type: 'error', text: 'Please check your form data.' });
		}

		const { firstName, lastName, email, role } = form.data;

		try {
			const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
				email,
				user_metadata: { name: `${firstName} ${lastName}` }
			});
			// Client-side (to sync the changes)

			if (updateError) {
				console.error('Update failed', updateError);

				return message(form, { type: 'error', text: 'Update Failed' }, { status: 500 });
			}

			await db
				.update(user)
				.set({
					firstName,
					lastName,
					email,
					roleId: role
				})
				.where(eq(user.id, id));

			// Stay on the same page and set a flash message
			return message(form, { type: 'success', text: 'User Updated Successfully' });
		} catch (err) {
			return message(form, { type: 'error', text: 'User Update Failed ' + err?.message });
		}
	}
	// delete: async ({ cookies, params }) => {
	// 	const { id } = params;

	// 	try {
	// 		if (!id) {
	// 			return message({ type: 'error', message: `Unexpected Error: ${err?.message}` }, cookies);
	// 		}

	// 		await db.transaction(async (tx) => {
	// 			const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
	// 			if (authError) {
	// 				console.error('Error deleting user:', authError);
	// 				return message(
	// 					{ type: 'error', message: `Unexpected Error: ${authError?.message}` },
	// 					cookies
	// 				);
	// 			}
	// 			await tx.delete(user).where(eq(user.id, id));
	// 			await tx.delete(userPermissions).where(eq(userPermissions.userId, id));
	// 		});

	// 		setFlash({ type: 'success', message: 'User Deleted Successfully!' }, cookies);
	// 	} catch (err) {
	// 		console.error('Error deleting user:', err);
	// 		return fail(400, { type: 'error', message: `Unexpected Error: ${err?.message}` });
	// 	}
	// }
};

import { message, superValidate, setError } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { editUserSchema as schema } from './schema';
import { banUserSchema as ban } from '$lib/ZodSchema';

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

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;

	const idSchema = z.uuid();
	const validation = idSchema.safeParse(id);

	if (!validation.success) {
		error(404, 'Invalid ID, there is no User with this ID');
	}

	const form = await superValidate(zod4(schema));
	const banForm = await superValidate(zod4(ban));

	const singleUser = await db
		.select({
			id: user.id,
			name: sql<string>`concat(${user.firstName}, ' ', ${user.lastName})`,
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			roleId: user.roleId,
			status: user.banned,
			banReason: user.banReason,
			bannedAt: user.bannedAt,
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

	const rolePermissionList = await db
		.select({
			id: permissions.id,
			name: permissions.name,
			description: permissions.description
		})
		.from(permissions)
		.innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
		.where(eq(rolePermissions.roleId, singleUser.roleId));

	const userPermissionsList = await db
		.select({
			permissionId: userPermissions.permissionId,
			name: permissions.name,
			description: permissions.description
		})
		.from(permissions)
		.innerJoin(userPermissions, eq(permissions.id, userPermissions.permissionId))
		.where(eq(userPermissions.userId, id));

	let permissionList;
	if (userPermissionsList.length > 0) {
		permissionList = userPermissionsList;
	} else {
		permissionList = rolePermissionList;
	}

	if (!singleUser) {
		error(404, 'User with this ID not found');
	}

	return {
		singleUser,
		id,
		form,
		roleList,
		permissionList,
		banForm
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
		console.log(form.data);

		const { id } = params;

		if (!form.valid) {
			// Stay on the same page and set a flash message
			return message(form, { type: 'error', text: 'Please check your form data.' });
		}

		const { firstName, lastName, email, role, permissionsList, editPermission } = form.data;

		try {
			await db.transaction(async (tx) => {
				const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
					email,
					user_metadata: { name: `${firstName} ${lastName}` }
				});
				// Client-side (to sync the changes)

				if (updateError) {
					console.error('Update failed', updateError);

					return message(form, { type: 'error', text: 'Update Failed' }, { status: 500 });
				}

				await tx
					.update(user)
					.set({
						firstName,
						lastName,
						email,
						roleId: role
					})
					.where(eq(user.id, id));

				// 2. Wipe existing permissions

				if (editPermission) {
					// 3. Insert new permissions (using 'tx', not 'db')
					if (permissionsList.length > 0) {
						await tx.delete(userPermissions).where(eq(userPermissions.userId, id));
						await tx.insert(userPermissions).values(
							permissionsList.map((permId) => ({
								userId: id,
								permissionId: permId
							}))
						);
					} else {
						setError(form, 'permissionsList', 'Permission cannot be empty');
						return message(
							form,
							{ type: 'error', text: 'Permission cannot be empty' },
							{ status: 400 }
						);
					}
				}
			});

			// Stay on the same page and set a flash message
			return message(form, { type: 'success', text: 'User Updated Successfully' });
		} catch (err) {
			console.error('User Update Failed', err.message);
			return message(form, { type: 'error', text: 'User Update Failed ' + err?.message });
		}
	},
	ban: async ({ params, request }) => {
		const { id } = params;

		const form = await superValidate(request, zod4(ban));

		const { banReason } = form.data;

		try {
			if (!id) {
				return message(
					form,
					{ type: 'error', text: `Unexpected Error: User Not Found` },
					{ status: 400 }
				);
			}

			if (!form.valid) {
				// Stay on the same page and set a flash message
				return message(form, { type: 'error', text: 'Please check your form data.' });
			}

			await db.transaction(async (tx) => {
				await tx.update(user).set({ banned: true, banReason }).where(eq(user.id, id));
			});

			return message(form, { type: 'success', text: 'User Banned Successfully' });
		} catch (err) {
			console.error('Error banning user:', err);
			return fail(400, { type: 'error', message: `Unexpected Error: ${err?.message}` });
		}
	}
};

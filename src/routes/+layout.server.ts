// src/routes/+layout.server.ts
import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	return {
		cookies: cookies.getAll()
	};
};

import { db } from '$lib/server/db';
import { videos, services, profiles as providers } from '$lib/server/db/schema';
import { and, asc, eq, sql, between, getTableColumns, gte, lte, inArray } from 'drizzle-orm';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

import type { PageServerLoad, Actions } from '../$types';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { changeStatus } from './schema';

export const load: PageServerLoad = async ({ url }) => {
	const form = await superValidate(zod4(changeStatus));
	const start = url.searchParams.get('start') ?? new Date();
	const end = url.searchParams.get('end') ?? new Date();
	const isDiscoverableParam = url.searchParams.get('isDiscoverable');
	const complianceReviewParam = url.searchParams.get('complianceReview');
	const verificationState = url.searchParams.get('verificationStates');

	// 1. Convert string query params to actual Booleans (or undefined if not present)
	const isDiscoverable = isDiscoverableParam !== null ? isDiscoverableParam === 'true' : undefined;
	const complianceReview =
		complianceReviewParam !== null ? complianceReviewParam === 'true' : undefined;

	// Fetch your distinct states (unchanged)
	const verificationStates = await db
		.selectDistinct({ state: videos.verificationState })
		.from(videos);

	// 2. Build the query with a dynamic where clause
	const rows = await db
		.select({
			...getTableColumns(videos),
			providerName: sql<string>`concat(${providers.firstName}, ' ', ${providers.lastName})`,
			serviceName: services.title
		})
		.from(videos)
		.leftJoin(providers, eq(videos.providerId, providers.id))
		.leftJoin(services, eq(videos.serviceId, services.id))
		.where(
			and(
				// Only applies the filter if the variable is not undefined
				isDiscoverable !== undefined ? eq(videos.isDiscoverable, isDiscoverable) : undefined,
				complianceReview !== undefined
					? eq(videos.complianceReviewed, complianceReview)
					: undefined,
				verificationState !== null ? eq(videos.verificationState, verificationState) : undefined,

				between(videos.createdAt, new Date(start), new Date(end))
			)
		);

	const videoList = rows.map((video) => ({
		...video,
		url: `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${video.videoPath}`,
		thumb: `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/video_thumbnails/${video.thumbnailPath}`
	}));

	return {
		form,
		videoList,
		verificationStates,
		start,
		end
	};
};

export const actions: Actions = {
	discover: async ({ request }) => {
		const form = await superValidate(request, zod4(changeStatus));
		console.log(form);
		if (!form.valid) {
			return message(form, { type: 'error', text: 'Invalid form data' }, { status: 400 });
		}

		const { ids, status } = form.data;

		const idArray = ids.split(',').map((id) => id.trim());

		try {
			await db.update(videos).set({ isDiscoverable: status }).where(inArray(videos.id, idArray));

			return message(form, { type: 'success', text: 'Discoverability updated successfully' });
		} catch (error) {
			console.error(error);
			return message(
				form,
				{ type: 'error', text: 'Failed to update discoverability' },
				{ status: 500 }
			);
		}
	},
	review: async ({ request }) => {
		const form = await superValidate(request, zod4(changeStatus));
		console.log(form);
		if (!form.valid) {
			return message(form, { type: 'error', text: 'Invalid form data' }, { status: 400 });
		}

		const { ids, status } = form.data;

		const idArray = ids.split(',').map((id) => id.trim());

		try {
			await db
				.update(videos)
				.set({ complianceReviewed: status })
				.where(inArray(videos.id, idArray));

			return message(form, { type: 'success', text: 'Compaliance Status updated successfully' });
		} catch (error) {
			console.error(error);
			return message(
				form,
				{ type: 'error', text: 'Failed to update compliance status' },
				{ status: 500 }
			);
		}
	},
	verify: async ({ request }) => {
		const form = await superValidate(request, zod4(changeStatus));
		console.log(form);
		if (!form.valid) {
			return message(form, { type: 'error', text: 'Invalid form data' }, { status: 400 });
		}

		const { ids, verificationState } = form.data;

		const idArray = ids.split(',').map((id) => id.trim());

		try {
			await db.update(videos).set({ verificationState }).where(inArray(videos.id, idArray));

			return message(form, { type: 'success', text: 'Verification State updated successfully' });
		} catch (error) {
			console.error(error);
			return message(
				form,
				{ type: 'error', text: 'Failed to update Verification State' },
				{ status: 500 }
			);
		}
	}
};

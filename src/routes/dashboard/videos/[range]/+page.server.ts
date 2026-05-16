import { db } from '$lib/server/db';
import { videos, services, profiles as providers } from '$lib/server/db/schema';
import { and, asc, eq, sql, between, getTableColumns, gte, lte } from 'drizzle-orm';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

import type { PageServerLoad } from '../$types';

export const load: PageServerLoad = async ({ url, params }) => {
	const { range } = params;

	const [y1, m1, d1, y2, m2, d2] = range.split('-');

	const start = `${y1}-${m1}-${d1}`;
	const end = `${y2}-${m2}-${d2}`;

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
		videoList,
		verificationStates,
		start,
		end
	};
};

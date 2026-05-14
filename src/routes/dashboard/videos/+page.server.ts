import { db } from '$lib/server/db';
import { videos, services, profiles as providers } from '$lib/server/db/schema';
import { and, asc, eq, sql, between, getTableColumns } from 'drizzle-orm';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			...getTableColumns(videos),
			providerName: sql<string>`concat(${providers.firstName}, ' ', ${providers.lastName})`,
			serviceName: services.title
		})
		.from(videos)
		.leftJoin(providers, eq(videos.providerId, providers.id))
		.leftJoin(services, eq(videos.serviceId, services.id));

	const videoList = rows.map((video) => ({
		...video,
		url: `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${video.videoPath}`,
		thumb: `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/video_thumbnails/${video.thumbnailPath}`
	}));

	return {
		videoList
	};
};

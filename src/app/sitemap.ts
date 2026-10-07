import type { MetadataRoute } from "next";
import { fetchClubEvents } from "@/lib/events";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${base}/eventy`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/aktualnosci`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${base}/promocje`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${base}/wynajem`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/promotorzy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/regulamin`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  let eventRoutes: MetadataRoute.Sitemap = [];
  try {
    const events = await fetchClubEvents();
    eventRoutes = events.map((event) => ({
      url: `${base}/eventy/${event.slug}`,
      lastModified: event.startsAt ? new Date(event.startsAt) : now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // bez eventów — tylko trasy statyczne
  }

  return [...staticRoutes, ...eventRoutes];
}

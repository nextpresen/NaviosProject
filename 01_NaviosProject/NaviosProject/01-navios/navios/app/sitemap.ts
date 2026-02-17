import type { MetadataRoute } from "next";
import { MOCK_EVENTS } from "@/lib/mock-events";
import { prisma } from "@/lib/prisma";

function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "https://navios.life";
  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    return "https://navios.life";
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${siteUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const events = await prisma.event.findMany({
      select: { id: true, updated_at: true },
      orderBy: { updated_at: "desc" },
    });
    const eventRoutes: MetadataRoute.Sitemap = events.map((event) => ({
      url: `${siteUrl}/event/${event.id}`,
      lastModified: event.updated_at,
      changeFrequency: "daily",
      priority: 0.8,
    }));
    return [...staticRoutes, ...eventRoutes];
  } catch {
    const fallbackEventRoutes: MetadataRoute.Sitemap = MOCK_EVENTS.map((event) => ({
      url: `${siteUrl}/event/${event.id}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    }));
    return [...staticRoutes, ...fallbackEventRoutes];
  }
}


import { NextResponse } from "next/server";
import { fail, ok } from "@/lib/api-response";

interface NominatimResponse {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

type GeocodeResult = {
  id: string;
  displayName: string;
  lat: number;
  lon: number;
};

type CacheItem = {
  expiresAt: number;
  results: GeocodeResult[];
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const MIN_INTERVAL_MS = 1000;

const cache = new Map<string, CacheItem>();
const lastRequestByIp = new Map<string, number>();

function getIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ ...ok({ results: [] }), results: [] });
  }

  const key = normalizeQuery(query);
  const now = Date.now();

  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    return NextResponse.json({ ...ok({ results: cached.results, source: "cache" }), results: cached.results, source: "cache" });
  }

  const ip = getIp(request);
  const last = lastRequestByIp.get(ip) ?? 0;
  if (now - last < MIN_INTERVAL_MS) {
    return NextResponse.json(
      fail("RATE_LIMIT", "Rate limit exceeded. Please wait a moment."),
      { status: 429 },
    );
  }
  lastRequestByIp.set(ip, now);

  try {
    const url =
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=jp&limit=5&accept-language=ja&q=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Navios/1.0 (contact: admin@navios.life)",
      },
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      return NextResponse.json({ ...ok({ results: [] }), results: [] }, { status: 200 });
    }

    const data = (await response.json()) as NominatimResponse[];
    const results = data.map((item) => ({
      id: String(item.place_id),
      displayName: item.display_name,
      lat: Number(item.lat),
      lon: Number(item.lon),
    }));

    cache.set(key, { results, expiresAt: now + CACHE_TTL_MS });

    return NextResponse.json({ ...ok({ results, source: "live" }), results, source: "live" });
  } catch {
    return NextResponse.json({ ...ok({ results: [] }), results: [] }, { status: 200 });
  }
}

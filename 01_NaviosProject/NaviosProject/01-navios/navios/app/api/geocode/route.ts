import { NextResponse } from "next/server";
import { fail, ok } from "@/lib/api-response";

interface NominatimResponse {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface NominatimReverseResponse {
  place_id: number;
  display_name: string;
  address?: Record<string, string | undefined>;
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

type ReverseCacheItem = {
  expiresAt: number;
  areaName: string;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const MIN_INTERVAL_MS = 1000;

const cache = new Map<string, CacheItem>();
const reverseCache = new Map<string, ReverseCacheItem>();
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

function reverseKey(lat: number, lng: number) {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function municipalityFromAddress(address?: Record<string, string | undefined>) {
  if (!address) return null;
  return (
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    null
  );
}

function areaNameFromAddress(address?: Record<string, string | undefined>) {
  const municipality = municipalityFromAddress(address);
  if (municipality) return `${municipality}周辺`;
  const prefecture = address?.state;
  if (prefecture) return `${prefecture}周辺`;
  return "日置市周辺";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const query = searchParams.get("q")?.trim();
  const now = Date.now();

  if (lat && lng) {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return NextResponse.json(fail("VALIDATION_ERROR", "Invalid lat/lng"), { status: 400 });
    }

    const key = reverseKey(latNum, lngNum);
    const cachedReverse = reverseCache.get(key);
    if (cachedReverse && cachedReverse.expiresAt > now) {
      return NextResponse.json({
        ...ok({ areaName: cachedReverse.areaName, source: "cache" }),
        areaName: cachedReverse.areaName,
        source: "cache",
      });
    }

    const ip = getIp(request);
    const last = lastRequestByIp.get(ip) ?? 0;
    if (now - last < MIN_INTERVAL_MS) {
      return NextResponse.json({ ...ok({ areaName: "日置市周辺" }), areaName: "日置市周辺" });
    }
    lastRequestByIp.set(ip, now);

    try {
      const url =
        `https://nominatim.openstreetmap.org/reverse?format=json&zoom=12&accept-language=ja&lat=${encodeURIComponent(String(latNum))}&lon=${encodeURIComponent(String(lngNum))}`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Navios/1.0 (contact: admin@navios.life)",
        },
        next: { revalidate: 30 },
      });

      if (!response.ok) {
        return NextResponse.json({ ...ok({ areaName: "日置市周辺" }), areaName: "日置市周辺" });
      }

      const data = (await response.json()) as NominatimReverseResponse;
      const areaName = areaNameFromAddress(data.address);

      reverseCache.set(key, { areaName, expiresAt: now + CACHE_TTL_MS });

      return NextResponse.json({
        ...ok({ areaName, source: "live" }),
        areaName,
        source: "live",
      });
    } catch {
      return NextResponse.json({ ...ok({ areaName: "日置市周辺" }), areaName: "日置市周辺" });
    }
  }

  if (!query || query.length < 2) {
    return NextResponse.json({ ...ok({ results: [] }), results: [] });
  }

  const key = normalizeQuery(query);

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

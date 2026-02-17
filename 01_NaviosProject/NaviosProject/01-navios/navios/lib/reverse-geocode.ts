interface NominatimReverseResponse {
  display_name?: string;
}

type CacheItem = {
  value: string | null;
  expiresAt: number;
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, CacheItem>();

function cacheKey(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
}

export async function reverseGeocodeAddress(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const key = cacheKey(latitude, longitude);
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) {
    return hit.value;
  }

  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&addressdetails=1&accept-language=ja&lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(String(longitude))}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Navios/1.0 (contact: admin@navios.life)",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      cache.set(key, { value: null, expiresAt: now + CACHE_TTL_MS });
      return null;
    }

    const data = (await response.json()) as NominatimReverseResponse;
    const address = data.display_name?.trim() || null;
    cache.set(key, { value: address, expiresAt: now + CACHE_TTL_MS });
    return address;
  } catch {
    cache.set(key, { value: null, expiresAt: now + CACHE_TTL_MS });
    return null;
  }
}


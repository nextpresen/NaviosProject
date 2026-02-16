const MAP_PROVIDER_VALUES = ["leaflet", "google"] as const;

export type MapProvider = (typeof MAP_PROVIDER_VALUES)[number];

const DEFAULT_MAP_PROVIDER: MapProvider = "leaflet";

export function normalizeMapProvider(value?: string | null): MapProvider {
  if (!value) return DEFAULT_MAP_PROVIDER;
  const normalized = value.trim().toLowerCase();
  if (normalized === "google") return "google";
  return "leaflet";
}

export function getClientMapProvider(): MapProvider {
  return normalizeMapProvider(process.env.NEXT_PUBLIC_MAP_PROVIDER);
}


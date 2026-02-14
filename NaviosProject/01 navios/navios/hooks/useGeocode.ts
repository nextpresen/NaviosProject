"use client";

import { useEffect, useState } from "react";

export interface GeocodeResult {
  id: string;
  displayName: string;
  lat: number;
  lon: number;
}

export function useGeocode(query: string) {
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
          setResults([]);
          return;
        }
        const payload = (await response.json()) as {
          ok?: boolean;
          results?: GeocodeResult[];
          data?: { results?: GeocodeResult[] };
        };

        const nextResults = payload.results ?? payload.data?.results ?? [];
        setResults(nextResults);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading };
}

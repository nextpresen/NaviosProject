import { useCallback, useEffect, useState } from 'react';
import type { Whisper } from '../types/whisper';
import { fetchNearbyWhispers, fetchAllWhispers } from '../lib/whisperService';

type Coords = { latitude: number; longitude: number } | null;

export function useWhispers(coords: Coords) {
  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (coords) {
        const data = await fetchNearbyWhispers(coords.latitude, coords.longitude, 500);
        setWhispers(data);
      } else {
        const data = await fetchAllWhispers();
        setWhispers(data);
      }
    } catch (fetchError) {
      console.warn('[useWhispers] primary fetch failed:', fetchError);
      // RPC が失敗した場合、全件取得にフォールバック
      try {
        const fallback = await fetchAllWhispers();
        setWhispers(fallback);
      } catch (fallbackError) {
        console.error('[useWhispers] fallback also failed:', fallbackError);
        const message =
          fallbackError instanceof Error ? fallbackError.message : 'つぶやきの取得に失敗しました。';
        setError(message);
        setWhispers([]);
      }
    } finally {
      setLoading(false);
    }
  }, [coords]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { whispers, loading, error, refetch };
}

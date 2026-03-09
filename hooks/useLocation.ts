import { useEffect, useState } from 'react';
import type { LocationObjectCoords } from 'expo-location';
import * as Location from 'expo-location';

/** 開発用フォールバック座標（伊集院町） */
const DEV_FALLBACK_COORDS: LocationObjectCoords = {
  latitude: 31.6234,
  longitude: 130.3856,
  altitude: null,
  accuracy: null,
  altitudeAccuracy: null,
  heading: null,
  speed: null,
};

/**
 * 現在地座標を取得するカスタムフック
 * エミュレーターなど GPS が使えない環境では開発用フォールバック座標を返す
 */
export function useLocation() {
  const [coords, setCoords] = useState<LocationObjectCoords | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('位置情報の権限が許可されていません');
        setLoading(false);
        return;
      }
      try {
        const location = await Location.getCurrentPositionAsync({});
        setCoords(location.coords);
      } catch {
        if (__DEV__) {
          setCoords(DEV_FALLBACK_COORDS);
        } else {
          setError('位置情報の取得に失敗しました');
        }
      }
      setLoading(false);
    })().catch((e) => {
      setError(e instanceof Error ? e.message : '位置情報の取得に失敗しました');
      setLoading(false);
    });
  }, []);

  return { coords, loading, error };
}

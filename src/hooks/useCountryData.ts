import { useState, useEffect } from 'react';

export type ViewMode = 'countries' | 'subdivisions';

interface UseCountryDataReturn {
  geoJsonData: any | null;
  loading: boolean;
  error: string | null;
}

export const useCountryData = (viewMode: ViewMode = 'countries'): UseCountryDataReturn => {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGeoJsonData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the original working dataset
        const url = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch map data');
        }

        const data = await response.json();
        setGeoJsonData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load map data');
        console.error('Error loading GeoJSON data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGeoJsonData();
  }, [viewMode]);

  return { geoJsonData, loading, error };
};
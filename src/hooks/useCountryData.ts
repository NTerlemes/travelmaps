import { useState, useEffect } from 'react';

export type ViewMode = 'countries' | 'subdivisions';

interface UseCountryDataReturn {
  geoJsonData: any | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

// Data source URLs with fallbacks
const DATA_SOURCES = {
  countries: [
    'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson',
    'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
  ],
  subdivisions: [
    'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson', // Fallback to countries for now
  ]
};

// Simple cache to avoid repeated requests
export const dataCache = new Map<string, any>();

export const useCountryData = (viewMode: ViewMode = 'countries'): UseCountryDataReturn => {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGeoJsonData = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cacheKey = `geojson-${viewMode}`;
      if (dataCache.has(cacheKey)) {
        setGeoJsonData(dataCache.get(cacheKey));
        setLoading(false);
        return;
      }

      const urls = DATA_SOURCES[viewMode];
      let lastError: Error | null = null;

      // Try each data source
      for (const url of urls) {
        try {
          const response = await fetch(url, {
            // Add some basic fetch options for reliability
            headers: {
              'Accept': 'application/json',
            },
            // 30 second timeout
            signal: AbortSignal.timeout(30000),
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();

          // Validate that we got valid GeoJSON
          if (!data || !data.type || !data.features) {
            throw new Error('Invalid GeoJSON format received');
          }

          // Cache successful result
          dataCache.set(cacheKey, data);
          setGeoJsonData(data);
          setLoading(false);
          return;

        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Unknown fetch error');
          console.warn(`Failed to load from ${url}:`, err);
          continue; // Try next URL
        }
      }

      // All sources failed
      throw lastError || new Error('All data sources failed');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load map data';

      // Retry logic for transient failures (disabled in test environment)
      if (retryCount < 2 &&
          (errorMessage.includes('timeout') || errorMessage.includes('fetch')) &&
          (typeof process === 'undefined' || process.env.NODE_ENV !== 'test')) {
        console.log(`Retrying data load... attempt ${retryCount + 1}`);
        setTimeout(() => loadGeoJsonData(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }

      setError(errorMessage);
      console.error('Error loading GeoJSON data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGeoJsonData();
  }, [viewMode]);

  const retry = () => {
    loadGeoJsonData();
  };

  return { geoJsonData, loading, error, retry };
};
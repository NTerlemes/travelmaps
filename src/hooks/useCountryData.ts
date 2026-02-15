import { useGeoData, geoDataCache } from './useGeoData';

export type ViewMode = 'countries' | 'subdivisions';

// Re-export the cache for backward compatibility with tests
export const dataCache = geoDataCache;

/**
 * Thin wrapper around useGeoData for backward compatibility.
 * Delegates to useGeoData with world scope.
 */
export const useCountryData = (viewMode: ViewMode = 'countries') => {
  return useGeoData({
    scope: { type: 'world' },
    detailLevel: viewMode === 'countries' ? 'countries' : 'subdivisions',
  });
};

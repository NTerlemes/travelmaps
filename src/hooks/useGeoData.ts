import { useState, useEffect, useCallback } from 'react';
import { MapScope, DetailLevel, AdminLevel, ContinentName } from '../types';
import { ISO_TO_CONTINENT, getIso3 } from '../data/geography';

interface UseGeoDataParams {
  scope: MapScope;
  detailLevel: DetailLevel;
  adminLevel?: AdminLevel;
}

interface UseGeoDataReturn {
  geoJsonData: any | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

const WORLD_COUNTRIES_URLS = [
  'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
  'https://cdn.jsdelivr.net/npm/world-atlas@3/countries-110m.json',
  'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson',
];

const NATURAL_EARTH_ADMIN1_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson';

const GEOBOUNDARIES_API = 'https://www.geoboundaries.org/api/current/gbOpen';

// Simple cache
export const geoDataCache = new Map<string, any>();

function getCacheKey(scope: MapScope, detailLevel: DetailLevel, adminLevel: AdminLevel = 'ADM1'): string {
  switch (scope.type) {
    case 'world':
      return `world-${detailLevel}`;
    case 'continent':
      return `continent-${scope.continent}-${detailLevel}`;
    case 'country':
      return `country-${scope.countryCode}-${adminLevel}`;
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 30000): Promise<Response> {
  return fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
  });
}

async function fetchWorldCountries(): Promise<any> {
  for (const url of WORLD_COUNTRIES_URLS) {
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.type && data?.features) return data;
      throw new Error('Invalid GeoJSON');
    } catch {
      continue;
    }
  }
  throw new Error('All world GeoJSON sources failed');
}

function filterByContinent(geojson: any, continent: ContinentName): any {
  const filtered = geojson.features.filter((f: any) => {
    const code = f.properties['ISO3166-1-Alpha-2']
      || f.properties.ISO_A2
      || f.properties.iso_a2;
    if (!code || code === '-99') return false;
    return ISO_TO_CONTINENT[code] === continent;
  });
  return { ...geojson, features: filtered };
}

function deduplicateFeatures(geojson: any): any {
  const seen = new Set<string>();
  const deduped = geojson.features.filter((f: any) => {
    const props = f.properties;
    const name = props.NAME || props.name;
    const code = props['ISO3166-1-Alpha-2'] || props.ISO_A2 || props.iso_a2;

    const isFrance = name === 'France' || name === 'French Republic' ||
                     code === 'FR' || code === 'FRA' || props.NAME_EN === 'France';

    if (isFrance) {
      if (seen.has('FR')) return false;
      seen.add('FR');
      props['ISO3166-1-Alpha-2'] = 'FR';
      props.ISO_A2 = 'FR';
      props.NAME = 'France';
      return true;
    }

    if (code && code !== '-99') {
      if (seen.has(code)) return false;
      seen.add(code);
    }
    return true;
  });
  return { ...geojson, features: deduped };
}

async function fetchSubdivisionsNaturalEarth(continent?: ContinentName): Promise<any> {
  const res = await fetchWithTimeout(NATURAL_EARTH_ADMIN1_URL, 60000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data?.features) throw new Error('Invalid Natural Earth data');

  if (continent) {
    const filtered = data.features.filter((f: any) => {
      const code = f.properties.iso_a2 || f.properties.ISO_A2;
      return code && ISO_TO_CONTINENT[code] === continent;
    });
    return { ...data, features: filtered };
  }
  return data;
}

async function fetchCountrySubdivisions(countryCode: string, adminLevel: AdminLevel = 'ADM1'): Promise<any> {
  // Convert ISO2 → ISO3 (geoBoundaries requires Alpha-3 codes)
  const iso3Code = getIso3(countryCode);
  const apiUrl = `${GEOBOUNDARIES_API}/${iso3Code}/${adminLevel}/`;
  const metaRes = await fetchWithTimeout(apiUrl);
  if (!metaRes.ok) throw new Error(`geoBoundaries API HTTP ${metaRes.status}`);
  const meta = await metaRes.json();

  const rawGjUrl = meta.gjDownloadURL;
  if (!rawGjUrl) throw new Error('No gjDownloadURL in geoBoundaries response');

  // Convert github.com/raw/ URLs to media.githubusercontent.com to avoid:
  // 1. CORS issues (github.com 302 sends an invalid Access-Control-Allow-Origin header)
  // 2. Git LFS pointer files (raw.githubusercontent.com returns LFS pointers, not content)
  const gjUrl = rawGjUrl.replace(
    'https://github.com/wmgeolab/geoBoundaries/raw/',
    'https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/'
  );

  const gjRes = await fetchWithTimeout(gjUrl, 60000);
  if (!gjRes.ok) throw new Error(`geoBoundaries GeoJSON HTTP ${gjRes.status}`);
  const data = await gjRes.json();
  if (!data?.features) throw new Error('Invalid geoBoundaries GeoJSON');
  return data;
}

async function loadGeoData(scope: MapScope, detailLevel: DetailLevel, adminLevel: AdminLevel = 'ADM1'): Promise<any> {
  if (scope.type === 'world' && detailLevel === 'countries') {
    const raw = await fetchWorldCountries();
    return deduplicateFeatures(raw);
  }

  if (scope.type === 'world' && detailLevel === 'subdivisions') {
    return fetchSubdivisionsNaturalEarth();
  }

  if (scope.type === 'continent' && detailLevel === 'countries') {
    const raw = await fetchWorldCountries();
    const deduped = deduplicateFeatures(raw);
    return filterByContinent(deduped, scope.continent);
  }

  if (scope.type === 'continent' && detailLevel === 'subdivisions') {
    return fetchSubdivisionsNaturalEarth(scope.continent);
  }

  if (scope.type === 'country') {
    return fetchCountrySubdivisions(scope.countryCode, adminLevel);
  }

  throw new Error('Invalid scope/detailLevel combination');
}

export const useGeoData = ({ scope, detailLevel, adminLevel = 'ADM1' }: UseGeoDataParams): UseGeoDataReturn => {
  const [geoJsonData, setGeoJsonData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const cacheKey = getCacheKey(scope, detailLevel, adminLevel);
      if (geoDataCache.has(cacheKey)) {
        setGeoJsonData(geoDataCache.get(cacheKey));
        setLoading(false);
        return;
      }

      const data = await loadGeoData(scope, detailLevel, adminLevel);
      geoDataCache.set(cacheKey, data);
      setGeoJsonData(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load map data';
      setError(msg);
      console.error('Error loading geo data:', err);
    } finally {
      setLoading(false);
    }
  }, [scope.type,
      scope.type === 'continent' ? scope.continent : '',
      scope.type === 'country' ? scope.countryCode : '',
      detailLevel,
      adminLevel]);

  useEffect(() => {
    load();
  }, [load]);

  return { geoJsonData, loading, error, retry: load };
};

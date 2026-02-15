import { useState, useEffect, useCallback } from 'react';
import { union } from '@turf/union';
import { polygon as turfPolygon, multiPolygon as turfMultiPolygon, featureCollection } from '@turf/helpers';
import { MapScope, DetailLevel, AdminLevel, ContinentName } from '../types';
import { ISO_TO_CONTINENT, getIso3, ISO2_TO_ISO3 } from '../data/geography';

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
  dataVersion: number;
}

const WORLD_COUNTRIES_URLS = [
  'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
  'https://cdn.jsdelivr.net/npm/world-atlas@3/countries-110m.json',
  'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson',
];

const NATURAL_EARTH_ADMIN1_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson';

const GEOBOUNDARIES_API = 'https://www.geoboundaries.org/api/current/gbOpen';

// Reverse mapping: ISO Alpha-3 → ISO Alpha-2
const ISO3_TO_ISO2: Record<string, string> = Object.fromEntries(
  Object.entries(ISO2_TO_ISO3).map(([iso2, iso3]) => [iso3, iso2])
);

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

/**
 * Enrich GeoJSON features that lack ISO Alpha-2 codes in properties.
 * The holtzy world.geojson stores the ISO3 code as the feature-level `id`
 * and only has `{ name }` in properties. This adds ISO_A2 so downstream
 * code (filtering, click handlers) can identify countries.
 */
function enrichFeatureProperties(geojson: any): any {
  const features = geojson.features.map((f: any) => {
    const props = f.properties || {};
    const hasIso2 = props['ISO3166-1-Alpha-2'] || props.ISO_A2 || props.iso_a2;
    if (hasIso2) return f; // Already has Alpha-2

    // Try to derive ISO_A2 from feature.id (ISO3 code like "FRA")
    const iso3 = f.id;
    const iso2 = iso3 ? ISO3_TO_ISO2[iso3] : undefined;
    if (!iso2) return f;

    return {
      ...f,
      properties: {
        ...props,
        ISO_A2: iso2,
        NAME: props.NAME || props.name || iso2,
      },
    };
  });
  return { ...geojson, features };
}

async function fetchWorldCountries(): Promise<any> {
  for (const url of WORLD_COUNTRIES_URLS) {
    try {
      const res = await fetchWithTimeout(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data?.type && data?.features) return enrichFeatureProperties(data);
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

// Filter out tiny subdivisions for continental/world views.
// scalerank: lower = larger/more important, higher = smaller/less important.
// Strategy per country:
//   1. Keep features with scalerank <= threshold
//   2. If ALL features exceed the threshold (e.g. SI, MT, MK), merge by region
//   3. If kept count > MAX_FEATURES_PER_COUNTRY, merge by region (e.g. LV)
//   4. If country is in PARTIAL_MERGE_REGIONS, merge only those region groups
const MAX_SCALERANK = 9;
const MAX_FEATURES_PER_COUNTRY = 80;

// Countries where specific regions should be merged even though scalerank is OK
const PARTIAL_MERGE_REGIONS: Record<string, string[]> = {
  'GB': ['Greater London'],
};

/**
 * Collect all polygon coordinates from an array of features into a flat list.
 * Used as fallback when turf union fails.
 */
function collectPolygons(features: any[]): any[] {
  const polygons: any[] = [];
  for (const f of features) {
    if (f.geometry?.type === 'Polygon') {
      polygons.push(f.geometry.coordinates);
    } else if (f.geometry?.type === 'MultiPolygon') {
      polygons.push(...f.geometry.coordinates);
    }
  }
  return polygons;
}

/**
 * Dissolve an array of GeoJSON features into a single geometry using polygon union.
 * This removes internal shared boundaries, producing clean outlines.
 * Falls back to a raw MultiPolygon if union fails (e.g. invalid geometry).
 */
function dissolveFeatures(features: any[]): { type: string; coordinates: any[] } {
  try {
    const turfFeatures = features
      .filter((f: any) => f.geometry?.coordinates?.length > 0)
      .map((f: any) => {
        if (f.geometry.type === 'MultiPolygon') {
          return turfMultiPolygon(f.geometry.coordinates);
        }
        return turfPolygon(f.geometry.coordinates);
      });
    if (turfFeatures.length === 0) {
      return { type: 'MultiPolygon', coordinates: collectPolygons(features) };
    }
    const dissolved = union(featureCollection(turfFeatures));
    if (dissolved?.geometry) {
      return dissolved.geometry;
    }
  } catch {
    // Fall back to raw MultiPolygon on any error
  }
  return { type: 'MultiPolygon', coordinates: collectPolygons(features) };
}

function mergeCountryFeatures(features: any[]): any {
  const baseProps = { ...features[0].properties };
  baseProps.name = baseProps.admin || baseProps.name;
  baseProps._merged = true;
  return {
    type: 'Feature',
    properties: baseProps,
    geometry: dissolveFeatures(features),
  };
}

/**
 * Merge features by their `region` property into one MultiPolygon per region.
 * Falls back to single-blob merge if features have no region or only one region.
 */
export function mergeFeaturesByRegion(features: any[]): any[] {
  const byRegion = new Map<string, any[]>();
  for (const f of features) {
    const region = f.properties.region || '';
    if (!byRegion.has(region)) byRegion.set(region, []);
    byRegion.get(region)!.push(f);
  }

  // If only 1 region group (or all have no region), fall back to single-blob
  if (byRegion.size <= 1) {
    return [mergeCountryFeatures(features)];
  }

  const merged: any[] = [];
  for (const [regionName, regionFeatures] of byRegion) {
    const baseProps = { ...regionFeatures[0].properties };
    baseProps.name = regionName;
    baseProps._merged = true;
    merged.push({
      type: 'Feature',
      properties: baseProps,
      geometry: dissolveFeatures(regionFeatures),
    });
  }
  return merged;
}

export function filterByScalerank(geojson: any, maxScalerank: number = MAX_SCALERANK): any {
  const byCountry = new Map<string, any[]>();
  for (const f of geojson.features) {
    const cc = f.properties.iso_a2 || f.properties.ISO_A2 || '';
    if (!byCountry.has(cc)) byCountry.set(cc, []);
    byCountry.get(cc)!.push(f);
  }

  const filtered: any[] = [];
  for (const [cc, features] of byCountry) {
    const kept = features.filter((f: any) => (f.properties.scalerank ?? 0) <= maxScalerank);

    if (kept.length === 0) {
      // All features exceed threshold — merge by region
      filtered.push(...mergeFeaturesByRegion(features));
    } else if (kept.length > MAX_FEATURES_PER_COUNTRY) {
      // Too many features — merge by region
      filtered.push(...mergeFeaturesByRegion(kept));
    } else if (PARTIAL_MERGE_REGIONS[cc]) {
      // Partial merge: merge only specified region groups, keep rest as-is
      const regionsToMerge = PARTIAL_MERGE_REGIONS[cc];
      const toMerge = new Map<string, any[]>();
      const toKeep: any[] = [];

      for (const f of kept) {
        const region = f.properties.region || '';
        if (regionsToMerge.includes(region)) {
          if (!toMerge.has(region)) toMerge.set(region, []);
          toMerge.get(region)!.push(f);
        } else {
          toKeep.push(f);
        }
      }

      filtered.push(...toKeep);
      for (const [regionName, regionFeatures] of toMerge) {
        const baseProps = { ...regionFeatures[0].properties };
        baseProps.name = regionName;
        baseProps._merged = true;
        filtered.push({
          type: 'Feature',
          properties: baseProps,
          geometry: dissolveFeatures(regionFeatures),
        });
      }
    } else {
      // Normal case — keep as-is
      filtered.push(...kept);
    }
  }

  return { ...geojson, features: filtered };
}

async function fetchSubdivisionsNaturalEarth(continent?: ContinentName): Promise<any> {
  const res = await fetchWithTimeout(NATURAL_EARTH_ADMIN1_URL, 60000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data?.features) throw new Error('Invalid Natural Earth data');

  let result = data;

  if (continent) {
    const filtered = data.features.filter((f: any) => {
      const code = f.properties.iso_a2 || f.properties.ISO_A2;
      return code && ISO_TO_CONTINENT[code] === continent;
    });
    result = { ...data, features: filtered };
  }

  return filterByScalerank(result);
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
  const [retryCount, setRetryCount] = useState(0);
  const [dataVersion, setDataVersion] = useState(0);
  // Track which cache key the current geoJsonData belongs to
  const [loadedKey, setLoadedKey] = useState<string>('');

  const currentKey = getCacheKey(scope, detailLevel, adminLevel);

  useEffect(() => {
    let cancelled = false;
    const effectAdminLevel = adminLevel;

    setGeoJsonData(null);
    setLoadedKey('');

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const cacheKey = getCacheKey(scope, detailLevel, effectAdminLevel);
        if (geoDataCache.has(cacheKey)) {
          if (!cancelled) {
            setGeoJsonData(geoDataCache.get(cacheKey));
            setLoadedKey(cacheKey);
            setDataVersion(v => v + 1);
            setLoading(false);
          }
          return;
        }

        const data = await loadGeoData(scope, detailLevel, effectAdminLevel);
        geoDataCache.set(cacheKey, data);
        if (!cancelled) {
          setGeoJsonData(data);
          setLoadedKey(cacheKey);
          setDataVersion(v => v + 1);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load map data';
          setError(msg);
          console.error('Error loading geo data:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [scope.type,
      scope.type === 'continent' ? scope.continent : '',
      scope.type === 'country' ? scope.countryCode : '',
      detailLevel,
      adminLevel,
      retryCount]);

  const retry = useCallback(() => {
    setRetryCount(c => c + 1);
  }, []);

  // Never return stale data: if the current scope doesn't match what was loaded, return null
  const effectiveData = loadedKey === currentKey ? geoJsonData : null;

  return { geoJsonData: effectiveData, loading, error, retry, dataVersion };
};

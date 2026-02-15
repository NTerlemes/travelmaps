import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useGeoData, geoDataCache, filterByScalerank, mergeFeaturesByRegion } from './useGeoData'
import { MapScope, DetailLevel } from '../types'

// Mock fetch
global.fetch = vi.fn()

const mockGeoJsonData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { ISO_A2: 'US', NAME: 'United States' },
      geometry: { type: 'Polygon', coordinates: [] }
    },
    {
      type: 'Feature',
      properties: { ISO_A2: 'FR', NAME: 'France' },
      geometry: { type: 'Polygon', coordinates: [] }
    }
  ]
}

const mockSubdivisionData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'California', iso_3166_2: 'US-CA', iso_a2: 'US' },
      geometry: { type: 'Polygon', coordinates: [] }
    }
  ]
}

describe('useGeoData Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    geoDataCache.clear()
  })

  it('initializes with loading state', () => {
    const { result } = renderHook(() =>
      useGeoData({ scope: { type: 'world' }, detailLevel: 'countries' })
    )

    expect(result.current.geoJsonData).toBeNull()
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('loads world country data successfully', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGeoJsonData
    })

    const { result } = renderHook(() =>
      useGeoData({ scope: { type: 'world' }, detailLevel: 'countries' })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.geoJsonData).not.toBeNull()
    expect(result.current.geoJsonData.features.length).toBe(2)
    expect(result.current.error).toBeNull()
  })

  it('handles fetch errors', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() =>
      useGeoData({ scope: { type: 'world' }, detailLevel: 'countries' })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.geoJsonData).toBeNull()
    expect(result.current.error).toBeTruthy()

    consoleSpy.mockRestore()
  })

  it('uses cache for repeated requests', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGeoJsonData
    })

    const scope: MapScope = { type: 'world' }
    const detailLevel: DetailLevel = 'countries'

    const { result: result1 } = renderHook(() =>
      useGeoData({ scope, detailLevel })
    )

    await waitFor(() => {
      expect(result1.current.loading).toBe(false)
    })

    // Second render should use cache
    const { result: result2 } = renderHook(() =>
      useGeoData({ scope, detailLevel })
    )

    await waitFor(() => {
      expect(result2.current.loading).toBe(false)
    })

    // Only 1 fetch call (second used cache)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('filters by continent for continent scope with countries detail', async () => {
    const worldData = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { ISO_A2: 'FR', NAME: 'France' }, geometry: { type: 'Polygon', coordinates: [] } },
        { type: 'Feature', properties: { ISO_A2: 'US', NAME: 'United States' }, geometry: { type: 'Polygon', coordinates: [] } },
        { type: 'Feature', properties: { ISO_A2: 'DE', NAME: 'Germany' }, geometry: { type: 'Polygon', coordinates: [] } },
      ]
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => worldData
    })

    const { result } = renderHook(() =>
      useGeoData({ scope: { type: 'continent', continent: 'Europe' }, detailLevel: 'countries' })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should only have European countries (FR, DE), not US
    expect(result.current.geoJsonData.features.length).toBe(2)
    const codes = result.current.geoJsonData.features.map((f: any) => f.properties.ISO_A2)
    expect(codes).toContain('FR')
    expect(codes).toContain('DE')
    expect(codes).not.toContain('US')
  })

  it('fetches subdivision data for world subdivisions', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSubdivisionData
    })

    const { result } = renderHook(() =>
      useGeoData({ scope: { type: 'world' }, detailLevel: 'subdivisions' })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.geoJsonData).not.toBeNull()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('ne_10m_admin_1'),
      expect.any(Object)
    )
  })

  it('fetches geoBoundaries data for country scope using ISO3 code', async () => {
    const metaResponse = {
      gjDownloadURL: 'https://example.com/USA-ADM1.geojson'
    }

    const gjData = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { shapeName: 'California', shapeISO: 'US-CA', shapeGroup: 'US' }, geometry: { type: 'Polygon', coordinates: [] } }
      ]
    };

    (fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => metaResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => gjData })

    const { result } = renderHook(() =>
      useGeoData({
        scope: { type: 'country', countryCode: 'US', countryName: 'United States' },
        detailLevel: 'subdivisions',
        adminLevel: 'ADM1'
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.geoJsonData).not.toBeNull()
    expect(result.current.geoJsonData.features[0].properties.shapeName).toBe('California')
    // Should make 2 fetch calls: API meta then GeoJSON
    expect(fetch).toHaveBeenCalledTimes(2)
    // Should use ISO3 code (USA) not ISO2 (US) in the geoBoundaries API URL
    expect((fetch as any).mock.calls[0][0]).toContain('/USA/ADM1/')
  })

  it('uses explicit ADM2 admin level when provided', async () => {
    const metaResponse = {
      gjDownloadURL: 'https://example.com/GBR-ADM2.geojson'
    }

    const gjData = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { shapeName: 'Greater London', shapeISO: 'GB-LND', shapeGroup: 'GB' }, geometry: { type: 'Polygon', coordinates: [] } }
      ]
    };

    (fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => metaResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => gjData })

    const { result } = renderHook(() =>
      useGeoData({
        scope: { type: 'country', countryCode: 'GB', countryName: 'United Kingdom' },
        detailLevel: 'subdivisions',
        adminLevel: 'ADM2'
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.geoJsonData).not.toBeNull()
    // Should use ISO3 code (GBR) and explicit ADM2
    expect((fetch as any).mock.calls[0][0]).toContain('/GBR/ADM2/')
  })

  it('provides retry function', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('fail'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() =>
      useGeoData({ scope: { type: 'world' }, detailLevel: 'countries' })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()

    // Now retry with success
    ;(fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGeoJsonData
    })

    result.current.retry()

    await waitFor(() => {
      expect(result.current.error).toBeNull()
    })

    expect(result.current.geoJsonData).not.toBeNull()

    consoleSpy.mockRestore()
  })
})

describe('filterByScalerank', () => {
  it('filters out features with scalerank above threshold', () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { iso_a2: 'FR', name: 'Île-de-France', region: 'Île-de-France', scalerank: 2 }, geometry: { type: 'Polygon', coordinates: [] } },
        { type: 'Feature', properties: { iso_a2: 'FR', name: 'Corsica', region: 'Corsica', scalerank: 6 }, geometry: { type: 'Polygon', coordinates: [] } },
        { type: 'Feature', properties: { iso_a2: 'FR', name: 'Some tiny region', region: 'Some tiny region', scalerank: 9 }, geometry: { type: 'Polygon', coordinates: [] } },
      ]
    }

    const result = filterByScalerank(geojson, 6)
    expect(result.features).toHaveLength(2)
    expect(result.features.map((f: any) => f.properties.name)).toEqual(['Île-de-France', 'Corsica'])
  })

  it('merges all subdivisions into single feature when all exceed threshold', () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { iso_a2: 'DE', name: 'Bavaria', region: 'Bavaria', scalerank: 3 }, geometry: { type: 'Polygon', coordinates: [[[0,0],[1,0],[1,1],[0,0]]] } },
        { type: 'Feature', properties: { iso_a2: 'MT', name: 'Valletta', admin: 'Malta', scalerank: 10 }, geometry: { type: 'Polygon', coordinates: [[[2,2],[3,2],[3,3],[2,2]]] } },
        { type: 'Feature', properties: { iso_a2: 'MT', name: 'Sliema', admin: 'Malta', scalerank: 10 }, geometry: { type: 'Polygon', coordinates: [[[4,4],[5,4],[5,5],[4,4]]] } },
      ]
    }

    const result = filterByScalerank(geojson, 6)
    // DE: Bavaria kept (scalerank 3 <= 6)
    // MT: all exceed threshold → dissolved into a single feature
    expect(result.features).toHaveLength(2)
    const mtFeature = result.features.find((f: any) => f.properties.iso_a2 === 'MT')
    expect(['Polygon', 'MultiPolygon']).toContain(mtFeature.geometry.type)
    expect(mtFeature.geometry.coordinates.length).toBeGreaterThan(0)
    // Name should use the admin/country name
    expect(mtFeature.properties.name).toBe('Malta')
  })

  it('dissolves MultiPolygon geometries into clean outlines', () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { iso_a2: 'GB', name: 'Region 1', admin: 'United Kingdom', scalerank: 8 }, geometry: { type: 'MultiPolygon', coordinates: [[[[0,0],[1,0],[1,1],[0,0]]], [[[2,2],[3,2],[3,3],[2,2]]]] } },
        { type: 'Feature', properties: { iso_a2: 'GB', name: 'Region 2', admin: 'United Kingdom', scalerank: 8 }, geometry: { type: 'Polygon', coordinates: [[[4,4],[5,4],[5,5],[4,4]]] } },
      ]
    }

    const result = filterByScalerank(geojson, 6)
    expect(result.features).toHaveLength(1)
    const gbFeature = result.features[0]
    // Dissolved geometry — internal borders removed
    expect(['Polygon', 'MultiPolygon']).toContain(gbFeature.geometry.type)
    expect(gbFeature.geometry.coordinates.length).toBeGreaterThan(0)
    expect(gbFeature.properties.name).toBe('United Kingdom')
  })

  it('treats missing scalerank as 0 (most important)', () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { iso_a2: 'US', name: 'California', region: 'California' }, geometry: { type: 'Polygon', coordinates: [] } },
        { type: 'Feature', properties: { iso_a2: 'US', name: 'Texas', region: 'Texas', scalerank: 3 }, geometry: { type: 'Polygon', coordinates: [] } },
      ]
    }

    const result = filterByScalerank(geojson, 6)
    expect(result.features).toHaveLength(2)
  })

  it('handles features with ISO_A2 (uppercase) property', () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { ISO_A2: 'GB', name: 'England', region: 'England', scalerank: 2 }, geometry: { type: 'Polygon', coordinates: [] } },
        { type: 'Feature', properties: { ISO_A2: 'GB', name: 'London Borough 1', region: 'London Borough 1', scalerank: 8 }, geometry: { type: 'Polygon', coordinates: [] } },
        { type: 'Feature', properties: { ISO_A2: 'GB', name: 'Scotland', region: 'Scotland', scalerank: 3 }, geometry: { type: 'Polygon', coordinates: [] } },
      ]
    }

    const result = filterByScalerank(geojson, 6)
    expect(result.features).toHaveLength(2)
    expect(result.features.map((f: any) => f.properties.name)).toEqual(['England', 'Scotland'])
  })

  it('preserves FeatureCollection type and extra properties', () => {
    const geojson = {
      type: 'FeatureCollection',
      name: 'admin1',
      features: [
        { type: 'Feature', properties: { iso_a2: 'FR', scalerank: 2 }, geometry: { type: 'Polygon', coordinates: [] } },
      ]
    }

    const result = filterByScalerank(geojson, 6)
    expect(result.type).toBe('FeatureCollection')
    expect(result.name).toBe('admin1')
  })
})

describe('useGeoData scalerank integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    geoDataCache.clear()
  })

  it('applies scalerank filtering for continent subdivision view', async () => {
    const subdivisionData = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { iso_a2: 'FR', name: 'Île-de-France', region: 'Île-de-France', scalerank: 2 }, geometry: { type: 'Polygon', coordinates: [] } },
        { type: 'Feature', properties: { iso_a2: 'FR', name: 'Tiny FR region', region: 'Tiny FR region', scalerank: 10 }, geometry: { type: 'Polygon', coordinates: [] } },
        { type: 'Feature', properties: { iso_a2: 'DE', name: 'Bavaria', region: 'Bavaria', scalerank: 3 }, geometry: { type: 'Polygon', coordinates: [] } },
      ]
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => subdivisionData
    })

    const { result } = renderHook(() =>
      useGeoData({ scope: { type: 'continent', continent: 'Europe' }, detailLevel: 'subdivisions' })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // The tiny FR region (scalerank 10) should be filtered out
    expect(result.current.geoJsonData.features).toHaveLength(2)
    const names = result.current.geoJsonData.features.map((f: any) => f.properties.name)
    expect(names).toContain('Île-de-France')
    expect(names).toContain('Bavaria')
    expect(names).not.toContain('Tiny FR region')
  })

  it('applies scalerank filtering for world subdivision view', async () => {
    const subdivisionData = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { iso_a2: 'US', name: 'California', region: 'California', scalerank: 2 }, geometry: { type: 'Polygon', coordinates: [] } },
        { type: 'Feature', properties: { iso_a2: 'US', name: 'Tiny US region', region: 'Tiny US region', scalerank: 10 }, geometry: { type: 'Polygon', coordinates: [] } },
      ]
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => subdivisionData
    })

    const { result } = renderHook(() =>
      useGeoData({ scope: { type: 'world' }, detailLevel: 'subdivisions' })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.geoJsonData.features).toHaveLength(1)
    expect(result.current.geoJsonData.features[0].properties.name).toBe('California')
  })

  it('merges by region when all features exceed scalerank threshold', async () => {
    // SI has 4 features across 2 regions, all scalerank 10
    const subdivisionData = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { iso_a2: 'SI', name: 'Ljubljana', region: 'Osrednjeslovenska', admin: 'Slovenia', scalerank: 10 }, geometry: { type: 'Polygon', coordinates: [[[14,46],[15,46],[15,47],[14,46]]] } },
        { type: 'Feature', properties: { iso_a2: 'SI', name: 'Kamnik', region: 'Osrednjeslovenska', admin: 'Slovenia', scalerank: 10 }, geometry: { type: 'Polygon', coordinates: [[[14.5,46],[15.5,46],[15.5,47],[14.5,46]]] } },
        { type: 'Feature', properties: { iso_a2: 'SI', name: 'Maribor', region: 'Podravska', admin: 'Slovenia', scalerank: 10 }, geometry: { type: 'Polygon', coordinates: [[[15,46],[16,46],[16,47],[15,46]]] } },
        { type: 'Feature', properties: { iso_a2: 'SI', name: 'Ptuj', region: 'Podravska', admin: 'Slovenia', scalerank: 10 }, geometry: { type: 'Polygon', coordinates: [[[15.5,46],[16.5,46],[16.5,47],[15.5,46]]] } },
        // Also include a normal FR feature to verify it's unchanged
        { type: 'Feature', properties: { iso_a2: 'FR', name: 'Île-de-France', region: 'Île-de-France', scalerank: 2 }, geometry: { type: 'Polygon', coordinates: [] } },
      ]
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => subdivisionData
    })

    const { result } = renderHook(() =>
      useGeoData({ scope: { type: 'continent', continent: 'Europe' }, detailLevel: 'subdivisions' })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // SI: 2 region-merged features, FR: 1 kept as-is = 3 total
    expect(result.current.geoJsonData.features).toHaveLength(3)
    const siFeatures = result.current.geoJsonData.features.filter((f: any) => f.properties.iso_a2 === 'SI')
    expect(siFeatures).toHaveLength(2)
    const regionNames = siFeatures.map((f: any) => f.properties.name).sort()
    expect(regionNames).toEqual(['Osrednjeslovenska', 'Podravska'])
  })

  it('does NOT apply scalerank filtering for country scope', async () => {
    const metaResponse = { gjDownloadURL: 'https://example.com/GRC-ADM1.geojson' }
    const gjData = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { shapeName: 'Attica', scalerank: 9 }, geometry: { type: 'Polygon', coordinates: [] } },
        { type: 'Feature', properties: { shapeName: 'Crete', scalerank: 8 }, geometry: { type: 'Polygon', coordinates: [] } },
      ]
    };

    (fetch as any)
      .mockResolvedValueOnce({ ok: true, json: async () => metaResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => gjData })

    const { result } = renderHook(() =>
      useGeoData({
        scope: { type: 'country', countryCode: 'GR', countryName: 'Greece' },
        detailLevel: 'subdivisions',
        adminLevel: 'ADM1'
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Country scope should NOT filter — all features preserved regardless of scalerank
    expect(result.current.geoJsonData.features).toHaveLength(2)
  })
})

describe('mergeFeaturesByRegion', () => {
  it('merges features grouped by region property', () => {
    const features = [
      { type: 'Feature', properties: { iso_a2: 'SI', name: 'Ljubljana', region: 'Osrednjeslovenska', admin: 'Slovenia' }, geometry: { type: 'Polygon', coordinates: [[[14,46],[15,46],[15,47],[14,46]]] } },
      { type: 'Feature', properties: { iso_a2: 'SI', name: 'Kamnik', region: 'Osrednjeslovenska', admin: 'Slovenia' }, geometry: { type: 'Polygon', coordinates: [[[14.5,46],[15.5,46],[15.5,47],[14.5,46]]] } },
      { type: 'Feature', properties: { iso_a2: 'SI', name: 'Maribor', region: 'Podravska', admin: 'Slovenia' }, geometry: { type: 'Polygon', coordinates: [[[15,46],[16,46],[16,47],[15,46]]] } },
      { type: 'Feature', properties: { iso_a2: 'SI', name: 'Ptuj', region: 'Podravska', admin: 'Slovenia' }, geometry: { type: 'Polygon', coordinates: [[[15.5,46],[16.5,46],[16.5,47],[15.5,46]]] } },
    ]

    const result = mergeFeaturesByRegion(features)
    expect(result).toHaveLength(2)
    const names = result.map((f: any) => f.properties.name).sort()
    expect(names).toEqual(['Osrednjeslovenska', 'Podravska'])
    // All multi-feature regions should be flagged as merged
    result.forEach((f: any) => expect(f.properties._merged).toBe(true))
  })

  it('falls back to single-blob merge when no region property', () => {
    const features = [
      { type: 'Feature', properties: { iso_a2: 'AD', name: 'Canillo', admin: 'Andorra' }, geometry: { type: 'Polygon', coordinates: [[[1,42],[2,42],[2,43],[1,42]]] } },
      { type: 'Feature', properties: { iso_a2: 'AD', name: 'Encamp', admin: 'Andorra' }, geometry: { type: 'Polygon', coordinates: [[[1.5,42],[2.5,42],[2.5,43],[1.5,42]]] } },
    ]

    const result = mergeFeaturesByRegion(features)
    expect(result).toHaveLength(1)
    expect(result[0].properties.name).toBe('Andorra')
    expect(['Polygon', 'MultiPolygon']).toContain(result[0].geometry.type)
    expect(result[0].properties._merged).toBe(true)
  })

  it('preserves iso_a2 on region-merged features', () => {
    const features = [
      { type: 'Feature', properties: { iso_a2: 'MT', name: 'Valletta', region: 'Southern Harbour', admin: 'Malta' }, geometry: { type: 'Polygon', coordinates: [[[14,35],[15,35],[15,36],[14,35]]] } },
      { type: 'Feature', properties: { iso_a2: 'MT', name: 'Floriana', region: 'Southern Harbour', admin: 'Malta' }, geometry: { type: 'Polygon', coordinates: [[[14.1,35],[15.1,35],[15.1,36],[14.1,35]]] } },
      { type: 'Feature', properties: { iso_a2: 'MT', name: 'Mosta', region: 'Northern', admin: 'Malta' }, geometry: { type: 'Polygon', coordinates: [[[14.2,35],[15.2,35],[15.2,36],[14.2,35]]] } },
    ]

    const result = mergeFeaturesByRegion(features)
    expect(result).toHaveLength(2)
    result.forEach((f: any) => {
      expect(f.properties.iso_a2).toBe('MT')
    })
  })

  it('dissolves mixed Polygon and MultiPolygon geometries within a region', () => {
    const features = [
      { type: 'Feature', properties: { iso_a2: 'MK', name: 'Skopje', region: 'Skopje', admin: 'North Macedonia' }, geometry: { type: 'MultiPolygon', coordinates: [[[[21,41],[22,41],[22,42],[21,41]]], [[[21.5,41],[22.5,41],[22.5,42],[21.5,41]]]] } },
      { type: 'Feature', properties: { iso_a2: 'MK', name: 'Arachinovo', region: 'Skopje', admin: 'North Macedonia' }, geometry: { type: 'Polygon', coordinates: [[[21.2,41],[22.2,41],[22.2,42],[21.2,41]]] } },
    ]

    const result = mergeFeaturesByRegion(features)
    expect(result).toHaveLength(1)
    // Dissolved geometry — could be Polygon or MultiPolygon depending on overlap
    expect(['Polygon', 'MultiPolygon']).toContain(result[0].geometry.type)
    expect(result[0].geometry.coordinates.length).toBeGreaterThan(0)
  })
})

describe('filterByScalerank region merging', () => {
  it('merges by region when all features exceed scalerank threshold', () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { iso_a2: 'SI', name: 'Ljubljana', region: 'Osrednjeslovenska', admin: 'Slovenia', scalerank: 10 }, geometry: { type: 'Polygon', coordinates: [[[14,46],[15,46],[15,47],[14,46]]] } },
        { type: 'Feature', properties: { iso_a2: 'SI', name: 'Kamnik', region: 'Osrednjeslovenska', admin: 'Slovenia', scalerank: 10 }, geometry: { type: 'Polygon', coordinates: [[[14.5,46],[15.5,46],[15.5,47],[14.5,46]]] } },
        { type: 'Feature', properties: { iso_a2: 'SI', name: 'Maribor', region: 'Podravska', admin: 'Slovenia', scalerank: 10 }, geometry: { type: 'Polygon', coordinates: [[[15,46],[16,46],[16,47],[15,46]]] } },
        { type: 'Feature', properties: { iso_a2: 'SI', name: 'Ptuj', region: 'Podravska', admin: 'Slovenia', scalerank: 10 }, geometry: { type: 'Polygon', coordinates: [[[15.5,46],[16.5,46],[16.5,47],[15.5,46]]] } },
      ]
    }

    const result = filterByScalerank(geojson, 9)
    const siFeatures = result.features.filter((f: any) => f.properties.iso_a2 === 'SI')
    expect(siFeatures).toHaveLength(2)
    expect(siFeatures.map((f: any) => f.properties.name).sort()).toEqual(['Osrednjeslovenska', 'Podravska'])
  })

  it('groups by region for all countries, even those under scalerank threshold', () => {
    // 6 LV features across 3 regions, all under scalerank threshold
    const geojson = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { iso_a2: 'LV', name: 'Riga city', region: 'Riga', scalerank: 6 }, geometry: { type: 'Polygon', coordinates: [[[24,56],[24.5,56],[24.5,57],[24,56]]] } },
        { type: 'Feature', properties: { iso_a2: 'LV', name: 'Jurmala', region: 'Riga', scalerank: 8 }, geometry: { type: 'Polygon', coordinates: [[[23.5,56],[24,56],[24,57],[23.5,56]]] } },
        { type: 'Feature', properties: { iso_a2: 'LV', name: 'Sigulda', region: 'Vidzeme', scalerank: 8 }, geometry: { type: 'Polygon', coordinates: [[[24.5,57],[25,57],[25,57.5],[24.5,57]]] } },
        { type: 'Feature', properties: { iso_a2: 'LV', name: 'Cesis', region: 'Vidzeme', scalerank: 8 }, geometry: { type: 'Polygon', coordinates: [[[25,57],[25.5,57],[25.5,57.5],[25,57]]] } },
        { type: 'Feature', properties: { iso_a2: 'LV', name: 'Liepaja', region: 'Kurzeme', scalerank: 7 }, geometry: { type: 'Polygon', coordinates: [[[21,56],[21.5,56],[21.5,57],[21,56]]] } },
        { type: 'Feature', properties: { iso_a2: 'LV', name: 'Ventspils', region: 'Kurzeme', scalerank: 8 }, geometry: { type: 'Polygon', coordinates: [[[21.5,57],[22,57],[22,57.5],[21.5,57]]] } },
      ]
    }

    const result = filterByScalerank(geojson, 9)
    // Riga: 2 merged, Vidzeme: 2 merged, Kurzeme: 2 merged = 3 features
    expect(result.features).toHaveLength(3)
    const names = result.features.map((f: any) => f.properties.name).sort()
    expect(names).toEqual(['Kurzeme', 'Riga', 'Vidzeme'])
  })

  it('keeps single-feature regions as-is without dissolving', () => {
    // France: each subdivision has its own unique region
    const geojson = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { iso_a2: 'FR', name: 'Île-de-France', region: 'Île-de-France', scalerank: 2 }, geometry: { type: 'Polygon', coordinates: [[[2,48],[3,48],[3,49],[2,48]]] } },
        { type: 'Feature', properties: { iso_a2: 'FR', name: 'Normandie', region: 'Normandie', scalerank: 3 }, geometry: { type: 'Polygon', coordinates: [[[0,49],[1,49],[1,50],[0,49]]] } },
        { type: 'Feature', properties: { iso_a2: 'FR', name: 'Brittany', region: 'Brittany', scalerank: 3 }, geometry: { type: 'Polygon', coordinates: [[[-3,48],[-2,48],[-2,49],[-3,48]]] } },
      ]
    }

    const result = filterByScalerank(geojson, 9)
    // Each region has 1 feature → kept as-is, no merging
    expect(result.features).toHaveLength(3)
    const names = result.features.map((f: any) => f.properties.name).sort()
    expect(names).toEqual(['Brittany', 'Normandie', 'Île-de-France'])
    // Original geometry preserved (not dissolved into MultiPolygon)
    result.features.forEach((f: any) => {
      expect(f.geometry.type).toBe('Polygon')
    })
  })

  it('merges multi-feature regions while keeping single-feature regions as-is', () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { iso_a2: 'GB', name: 'Westminster', region: 'Greater London', scalerank: 6 }, geometry: { type: 'Polygon', coordinates: [[[0,51],[0.1,51],[0.1,51.1],[0,51]]] } },
        { type: 'Feature', properties: { iso_a2: 'GB', name: 'Camden', region: 'Greater London', scalerank: 6 }, geometry: { type: 'Polygon', coordinates: [[[0.1,51],[0.2,51],[0.2,51.1],[0.1,51]]] } },
        { type: 'Feature', properties: { iso_a2: 'GB', name: 'Scotland', region: 'Scotland', scalerank: 2 }, geometry: { type: 'Polygon', coordinates: [[[3,55],[4,55],[4,56],[3,55]]] } },
        { type: 'Feature', properties: { iso_a2: 'GB', name: 'Wales', region: 'Wales', scalerank: 3 }, geometry: { type: 'Polygon', coordinates: [[[3,51],[4,51],[4,52],[3,51]]] } },
      ]
    }

    const result = filterByScalerank(geojson, 9)
    // Westminster+Camden dissolved into "Greater London", Scotland and Wales kept as-is = 3
    expect(result.features).toHaveLength(3)
    const names = result.features.map((f: any) => f.properties.name).sort()
    expect(names).toEqual(['Greater London', 'Scotland', 'Wales'])
    // London: dissolved, Scotland/Wales: original Polygon preserved
    const london = result.features.find((f: any) => f.properties.name === 'Greater London')
    expect(['Polygon', 'MultiPolygon']).toContain(london.geometry.type)
    expect(london.properties.iso_a2).toBe('GB')
    expect(london.properties._merged).toBe(true)
    const scotland = result.features.find((f: any) => f.properties.name === 'Scotland')
    expect(scotland.geometry.type).toBe('Polygon')
  })

  it('falls back to single-blob when features have no region property', () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { iso_a2: 'AD', name: 'Canillo', admin: 'Andorra', scalerank: 10 }, geometry: { type: 'Polygon', coordinates: [[[1,42],[2,42],[2,43],[1,42]]] } },
        { type: 'Feature', properties: { iso_a2: 'AD', name: 'Encamp', admin: 'Andorra', scalerank: 10 }, geometry: { type: 'Polygon', coordinates: [[[1.5,42],[2.5,42],[2.5,43],[1.5,42]]] } },
      ]
    }

    const result = filterByScalerank(geojson, 9)
    expect(result.features).toHaveLength(1)
    expect(result.features[0].properties.name).toBe('Andorra')
    expect(['Polygon', 'MultiPolygon']).toContain(result.features[0].geometry.type)
  })
})

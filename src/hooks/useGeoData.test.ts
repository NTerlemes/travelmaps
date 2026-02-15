import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useGeoData, geoDataCache } from './useGeoData'
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

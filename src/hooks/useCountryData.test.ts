import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { waitFor } from '@testing-library/react'
import { useCountryData, dataCache } from './useCountryData'

// Mock fetch
global.fetch = vi.fn()

const mockGeoJsonData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { ISO_A2: 'US', NAME: 'United States' },
      geometry: { type: 'Polygon', coordinates: [] }
    }
  ]
}

describe('useCountryData Hook (wrapper)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dataCache.clear()
  })

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useCountryData())

    expect(result.current.geoJsonData).toEqual(null)
    expect(result.current.loading).toEqual(true)
    expect(result.current.error).toEqual(null)
  })

  it('loads country data successfully', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGeoJsonData
    })

    const { result } = renderHook(() => useCountryData('countries'))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.geoJsonData).not.toBeNull()
    expect(result.current.error).toEqual(null)
    expect(fetch).toHaveBeenCalledWith(
      'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
      expect.objectContaining({
        headers: { 'Accept': 'application/json' },
        signal: expect.any(AbortSignal)
      })
    )
  })

  it('handles fetch errors correctly', async () => {
    (fetch as any).mockRejectedValue(new Error('Failed to fetch map data'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useCountryData('countries'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.geoJsonData).toEqual(null)
    expect(result.current.error).toBeTruthy()
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('handles network errors correctly', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useCountryData('countries'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.geoJsonData).toEqual(null)
    expect(result.current.error).toBeTruthy()
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('provides a retry function', () => {
    const { result } = renderHook(() => useCountryData('countries'))
    expect(typeof result.current.retry).toBe('function')
  })
})

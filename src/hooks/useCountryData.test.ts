import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { waitFor } from '@testing-library/react'
import { useCountryData } from './useCountryData'

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

describe('useCountryData Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

    expect(result.current.geoJsonData).toEqual(mockGeoJsonData)
    expect(result.current.error).toEqual(null)
    expect(fetch).toHaveBeenCalledWith(
      'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'
    )
  })

  it('handles fetch errors correctly', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useCountryData('countries'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.geoJsonData).toEqual(null)
    expect(result.current.error).toBe('Failed to fetch map data')
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('handles network errors correctly', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'))

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useCountryData('countries'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.geoJsonData).toEqual(null)
    expect(result.current.error).toBe('Network error')
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('handles unknown errors correctly', async () => {
    (fetch as any).mockRejectedValueOnce('Unknown error')

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useCountryData('countries'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.geoJsonData).toEqual(null)
    expect(result.current.error).toBe('Failed to load map data')
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it('refetches data when view mode changes', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockGeoJsonData
    })

    const { result, rerender } = renderHook(
      ({ viewMode }) => useCountryData(viewMode),
      { initialProps: { viewMode: 'countries' as const } }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetch).toHaveBeenCalledTimes(1)

    // Change view mode
    rerender({ viewMode: 'subdivisions' as const })

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('uses the same URL regardless of view mode', async () => {
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockGeoJsonData
    })

    const { result: result1 } = renderHook(() => useCountryData('countries'))
    await waitFor(() => expect(result1.current.loading).toBe(false))

    const { result: result2 } = renderHook(() => useCountryData('subdivisions'))
    await waitFor(() => expect(result2.current.loading).toBe(false))

    expect(fetch).toHaveBeenCalledWith(
      'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'
    )
  })

})
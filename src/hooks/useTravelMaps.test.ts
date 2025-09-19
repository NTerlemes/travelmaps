import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTravelMaps } from './useTravelMaps'
import { TravelStatus } from '../types'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('useTravelMaps Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  it('initializes with empty saved maps', () => {
    const { result } = renderHook(() => useTravelMaps())

    expect(result.current.savedMaps).toEqual([])
  })

  it('loads saved maps from localStorage on mount', () => {
    const mockSavedMaps = [
      {
        id: '1',
        name: 'Test Map',
        travelData: [{ countryCode: 'US', status: TravelStatus.VISITED }],
        createdAt: '2024-01-01T12:00:00Z',
        updatedAt: '2024-01-01T12:00:00Z'
      }
    ]

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockSavedMaps))

    const { result } = renderHook(() => useTravelMaps())

    expect(result.current.savedMaps).toHaveLength(1)
    expect(result.current.savedMaps[0].name).toBe('Test Map')
    expect(result.current.savedMaps[0].createdAt).toBeInstanceOf(Date)
    expect(result.current.savedMaps[0].updatedAt).toBeInstanceOf(Date)
  })

  it('handles malformed localStorage data gracefully', () => {
    mockLocalStorage.getItem.mockReturnValue('invalid json')

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useTravelMaps())

    expect(result.current.savedMaps).toEqual([])
    expect(consoleSpy).toHaveBeenCalledWith('Error loading saved maps:', expect.any(Error))

    consoleSpy.mockRestore()
  })

  it('saves a new map correctly', () => {
    const { result } = renderHook(() => useTravelMaps())

    const travelData = [
      { countryCode: 'US', status: TravelStatus.VISITED },
      { countryCode: 'CA', status: TravelStatus.LIVED }
    ]

    let mapId: string

    act(() => {
      mapId = result.current.saveMap('My Trip', travelData)
    })

    expect(result.current.savedMaps).toHaveLength(1)
    expect(result.current.savedMaps[0].name).toBe('My Trip')
    expect(result.current.savedMaps[0].travelData).toEqual(travelData)
    expect(result.current.savedMaps[0].id).toBe(mapId!)
    expect(mockLocalStorage.setItem).toHaveBeenCalled()
  })

  it('loads a map by id correctly', () => {
    const { result } = renderHook(() => useTravelMaps())

    const travelData = [{ countryCode: 'US', status: TravelStatus.VISITED }]

    let mapId: string

    act(() => {
      mapId = result.current.saveMap('Test Map', travelData)
    })

    const loadedData = result.current.loadMap(mapId!)

    expect(loadedData).toEqual(travelData)
    expect(loadedData).not.toBe(travelData) // Should return a copy
  })

  it('returns null when loading non-existent map', () => {
    const { result } = renderHook(() => useTravelMaps())

    const loadedData = result.current.loadMap('non-existent-id')

    expect(loadedData).toBeNull()
  })

  it('deletes a map correctly', () => {
    const { result } = renderHook(() => useTravelMaps())

    const travelData = [{ countryCode: 'US', status: TravelStatus.VISITED }]

    let mapId: string

    act(() => {
      mapId = result.current.saveMap('Test Map', travelData)
    })

    expect(result.current.savedMaps).toHaveLength(1)

    act(() => {
      result.current.deleteMap(mapId!)
    })

    expect(result.current.savedMaps).toHaveLength(0)
    expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2) // Once for save, once for delete
  })

  it('updates a map correctly', () => {
    const { result } = renderHook(() => useTravelMaps())

    const originalData = [{ countryCode: 'US', status: TravelStatus.VISITED }]
    const updatedData = [
      { countryCode: 'US', status: TravelStatus.VISITED },
      { countryCode: 'CA', status: TravelStatus.LIVED }
    ]

    let mapId: string

    act(() => {
      mapId = result.current.saveMap('Test Map', originalData)
    })

    const originalUpdatedAt = result.current.savedMaps[0].updatedAt

    // Wait a moment to ensure updatedAt is different
    act(() => {
      // Small delay to ensure different timestamp
      const now = Date.now()
      vi.setSystemTime(now + 1000) // Add 1 second
      result.current.updateMap(mapId!, updatedData)
    })

    expect(result.current.savedMaps[0].travelData).toEqual(updatedData)
    expect(result.current.savedMaps[0].updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
  })

  it('preserves data integrity when saving and loading', () => {
    const { result } = renderHook(() => useTravelMaps())

    const originalData = [
      { countryCode: 'US', status: TravelStatus.VISITED },
      { countryCode: 'CA', subdivisionCode: 'ON', status: TravelStatus.LIVED }
    ]

    let mapId: string

    act(() => {
      mapId = result.current.saveMap('Complex Map', originalData)
    })

    const loadedData = result.current.loadMap(mapId!)

    expect(loadedData).toEqual(originalData)
    expect(loadedData?.[1].subdivisionCode).toBe('ON')
  })
})
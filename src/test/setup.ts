import '@testing-library/jest-dom'
import React from 'react'

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
})

// Mock fetch for API calls
global.fetch = vi.fn()

// Mock Leaflet to avoid DOM/Canvas issues in tests
vi.mock('leaflet', () => ({
  default: {},
  map: vi.fn(),
  tileLayer: vi.fn(),
  geoJSON: vi.fn(),
  icon: vi.fn(),
  divIcon: vi.fn(),
}))

// Mock react-leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'map-container' }, children),
  TileLayer: () => React.createElement('div', { 'data-testid': 'tile-layer' }),
  GeoJSON: () => React.createElement('div', { 'data-testid': 'geojson' }),
  useMap: () => ({
    setView: vi.fn(),
    fitBounds: vi.fn(),
  }),
}))
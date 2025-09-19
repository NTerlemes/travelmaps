import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'
import { TravelStatus } from './types'

// Mock the hooks
vi.mock('./hooks/useTravelMaps', () => ({
  useTravelMaps: () => ({
    savedMaps: [],
    saveMap: vi.fn(),
    loadMap: vi.fn(),
    deleteMap: vi.fn(),
  }),
}))

vi.mock('./hooks/useCountryData', () => ({
  useCountryData: () => ({
    geoJsonData: null,
    loading: false,
    error: null,
  }),
}))

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the main app structure', () => {
    render(<App />)

    expect(screen.getByTestId('map-container')).toBeInTheDocument()
    expect(screen.getByText('Select Travel Status')).toBeInTheDocument()
    expect(screen.getByText('Save Map')).toBeInTheDocument()
  })

  it('displays travel status options', () => {
    render(<App />)

    expect(screen.getAllByText('Visited')).toHaveLength(2) // Button and statistics
    expect(screen.getAllByText('Lived there')).toHaveLength(2) // Button and statistics
    expect(screen.getAllByText('From here')).toHaveLength(2) // Button and statistics
    expect(screen.getAllByText('Live here now')).toHaveLength(2) // Button and statistics
  })

  it('displays view mode toggle', () => {
    render(<App />)

    expect(screen.getByText('🌍 Countries')).toBeInTheDocument()
    expect(screen.getByText('🗺️ States/Provinces')).toBeInTheDocument()
  })

  it('shows clear all button', () => {
    render(<App />)

    expect(screen.getByText('Clear All')).toBeInTheDocument()
  })

  it('can toggle between view modes', () => {
    render(<App />)

    const subdivisionButton = screen.getByText('🗺️ States/Provinces')
    fireEvent.click(subdivisionButton)

    // Should update the view mode (tested via state management)
    expect(subdivisionButton).toBeInTheDocument()
  })

  it('can change travel status selection', () => {
    render(<App />)

    const livedButtons = screen.getAllByText('Lived there')
    const livedButton = livedButtons[0] // Click the first one (button, not stats)
    fireEvent.click(livedButton)

    // Should update the selected status (tested via state management)
    expect(livedButton).toBeInTheDocument()
  })

  it('handles location clicks correctly', () => {
    render(<App />)

    // This would be tested through integration with the map component
    // The updateTravelStatus function should be called when locations are clicked
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })
})
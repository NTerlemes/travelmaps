import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

const mockLoadMap = vi.fn()
const mockSaveMap = vi.fn()

// Mock the hooks
vi.mock('./hooks/useTravelMaps', () => ({
  useTravelMaps: () => ({
    savedMaps: [],
    saveMap: mockSaveMap,
    loadMap: mockLoadMap,
    deleteMap: vi.fn(),
  }),
}))

vi.mock('./hooks/useGeoData', () => ({
  useGeoData: () => ({
    geoJsonData: null,
    loading: false,
    error: null,
    retry: vi.fn(),
  }),
  geoDataCache: new Map(),
}))

vi.mock('./hooks/useCountryData', () => ({
  useCountryData: () => ({
    geoJsonData: null,
    loading: false,
    error: null,
    retry: vi.fn(),
  }),
  dataCache: new Map(),
}))

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the landing page by default', () => {
    render(<App />)
    expect(screen.getByTestId('landing-page')).toBeInTheDocument()
    expect(screen.getByText('Travel Maps')).toBeInTheDocument()
    expect(screen.getByText('Explore')).toBeInTheDocument()
  })

  it('shows scope tabs on landing page', () => {
    render(<App />)
    expect(screen.getByText('World')).toBeInTheDocument()
    expect(screen.getByText('Continent')).toBeInTheDocument()
    expect(screen.getByText('Country')).toBeInTheDocument()
  })

  it('navigates to map when world scope is selected', () => {
    render(<App />)

    // World tab is default, click Explore
    fireEvent.click(screen.getByText('Explore'))

    // Should show map page with controls
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
    expect(screen.getByText('Select Travel Status')).toBeInTheDocument()
    expect(screen.getByText('Save Map')).toBeInTheDocument()
  })

  it('renders export controls on map page', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Explore'))

    expect(screen.getByText('Export Map')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /png/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /jpeg/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /svg/i })).toBeInTheDocument()
  })

  it('shows back button on map page', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Explore'))

    const backButton = screen.getByText(/Back/)
    expect(backButton).toBeInTheDocument()
  })

  it('navigates back to landing page', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Explore'))

    fireEvent.click(screen.getByText(/Back/))
    expect(screen.getByTestId('landing-page')).toBeInTheDocument()
  })

  it('displays travel status options on map page', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Explore'))

    expect(screen.getAllByText('Visited')).toHaveLength(2) // Button and statistics
    expect(screen.getAllByText('Lived there')).toHaveLength(2)
    expect(screen.getAllByText('From here')).toHaveLength(2)
    expect(screen.getAllByText('Live here now')).toHaveLength(2)
  })

  it('displays detail level toggle for world scope', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Explore'))

    expect(screen.getByText('Countries')).toBeInTheDocument()
    expect(screen.getByText('States/Provinces')).toBeInTheDocument()
  })

  it('shows clear all button on map page', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Explore'))

    expect(screen.getByText('Clear All')).toBeInTheDocument()
  })

  it('can change travel status selection on map page', () => {
    render(<App />)
    fireEvent.click(screen.getByText('Explore'))

    const livedButtons = screen.getAllByText('Lived there')
    fireEvent.click(livedButtons[0])
    expect(livedButtons[0]).toBeInTheDocument()
  })
})

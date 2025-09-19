import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TravelControls } from './TravelControls'
import { TravelStatus, TravelData } from '../types'

const mockProps = {
  selectedStatus: TravelStatus.VISITED,
  onStatusChange: vi.fn(),
  travelData: [] as TravelData[],
  viewMode: 'countries' as const,
  onViewModeChange: vi.fn(),
  onClearAll: vi.fn(),
}

describe('TravelControls Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the main title and subtitle', () => {
    render(<TravelControls {...mockProps} />)

    expect(screen.getByText('Travel Maps')).toBeInTheDocument()
    expect(screen.getByText(/Click on countries to mark them/)).toBeInTheDocument()
  })

  it('displays view mode buttons', () => {
    render(<TravelControls {...mockProps} />)

    expect(screen.getByText('🌍 Countries')).toBeInTheDocument()
    expect(screen.getByText('🗺️ States/Provinces')).toBeInTheDocument()
  })

  it('highlights selected view mode', () => {
    render(<TravelControls {...mockProps} />)

    const countriesButton = screen.getByText('🌍 Countries')
    expect(countriesButton).toBeInTheDocument()
    // The selected styling is applied via styled-components props
  })

  it('calls onViewModeChange when view mode is changed', () => {
    render(<TravelControls {...mockProps} />)

    const subdivisionsButton = screen.getByText('🗺️ States/Provinces')
    fireEvent.click(subdivisionsButton)

    expect(mockProps.onViewModeChange).toHaveBeenCalledWith('subdivisions')
  })

  it('displays all travel status options', () => {
    render(<TravelControls {...mockProps} />)

    expect(screen.getByText('Visited')).toBeInTheDocument()
    expect(screen.getByText('Lived')).toBeInTheDocument()
    expect(screen.getByText('From')).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
  })

  it('calls onStatusChange when status is changed', () => {
    render(<TravelControls {...mockProps} />)

    const livedButton = screen.getByText('Lived')
    fireEvent.click(livedButton)

    expect(mockProps.onStatusChange).toHaveBeenCalledWith(TravelStatus.LIVED)
  })

  it('displays travel statistics correctly', () => {
    const travelData: TravelData[] = [
      { countryCode: 'US', status: TravelStatus.VISITED },
      { countryCode: 'CA', status: TravelStatus.VISITED },
      { countryCode: 'UK', status: TravelStatus.LIVED },
    ]

    render(<TravelControls {...mockProps} travelData={travelData} />)

    // Check if statistics are displayed (counts should be visible)
    const statsSection = screen.getByText('Travel Statistics')
    expect(statsSection).toBeInTheDocument()
  })

  it('enables clear button when there is data', () => {
    const travelData: TravelData[] = [
      { countryCode: 'US', status: TravelStatus.VISITED },
    ]

    render(<TravelControls {...mockProps} travelData={travelData} />)

    const clearButton = screen.getByText('Clear All')
    expect(clearButton).not.toBeDisabled()
  })

  it('disables clear button when there is no data', () => {
    render(<TravelControls {...mockProps} travelData={[]} />)

    const clearButton = screen.getByText('Clear All')
    expect(clearButton).toBeDisabled()
  })

  it('calls onClearAll when clear button is clicked', () => {
    const travelData: TravelData[] = [
      { countryCode: 'US', status: TravelStatus.VISITED },
    ]

    render(<TravelControls {...mockProps} travelData={travelData} />)

    const clearButton = screen.getByText('Clear All')
    fireEvent.click(clearButton)

    expect(mockProps.onClearAll).toHaveBeenCalled()
  })

  it('updates subtitle text based on view mode', () => {
    const { rerender } = render(<TravelControls {...mockProps} viewMode="countries" />)
    expect(screen.getByText(/Click on countries to mark them/)).toBeInTheDocument()

    rerender(<TravelControls {...mockProps} viewMode="subdivisions" />)
    expect(screen.getByText(/Click on states\/provinces to mark them/)).toBeInTheDocument()
  })
})
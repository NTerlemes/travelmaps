import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TravelControls } from './TravelControls'
import { TravelStatus, TravelData, MapScope, DetailLevel, AdminLevel } from '../types'

const worldScope: MapScope = { type: 'world' };
const countryScope: MapScope = { type: 'country', countryCode: 'US', countryName: 'United States' };

const mockProps = {
  selectedStatus: TravelStatus.VISITED,
  onStatusChange: vi.fn(),
  travelData: [] as TravelData[],
  scope: worldScope,
  detailLevel: 'countries' as DetailLevel,
  onDetailLevelChange: vi.fn(),
  adminLevel: 'ADM1' as AdminLevel,
  onAdminLevelChange: vi.fn(),
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

  it('displays detail level buttons for world scope', () => {
    render(<TravelControls {...mockProps} />)

    expect(screen.getByText('Countries')).toBeInTheDocument()
    expect(screen.getByText('States/Provinces')).toBeInTheDocument()
  })

  it('hides detail level toggle for country scope', () => {
    render(<TravelControls {...mockProps} scope={countryScope} detailLevel="subdivisions" />)

    expect(screen.queryByText('Map Detail Level')).not.toBeInTheDocument()
    expect(screen.queryByText('Countries')).not.toBeInTheDocument()
  })

  it('shows detail level toggle for continent scope', () => {
    const continentScope: MapScope = { type: 'continent', continent: 'Europe' };
    render(<TravelControls {...mockProps} scope={continentScope} />)

    expect(screen.getByText('Map Detail Level')).toBeInTheDocument()
  })

  it('calls onDetailLevelChange when detail level is changed', () => {
    render(<TravelControls {...mockProps} />)

    const subdivisionsButton = screen.getByText('States/Provinces')
    fireEvent.click(subdivisionsButton)

    expect(mockProps.onDetailLevelChange).toHaveBeenCalledWith('subdivisions')
  })

  it('displays all travel status options', () => {
    render(<TravelControls {...mockProps} />)

    expect(screen.getAllByText('Visited')).toHaveLength(2) // Button and statistics
    expect(screen.getAllByText('Lived there')).toHaveLength(2)
    expect(screen.getAllByText('From here')).toHaveLength(2)
    expect(screen.getAllByText('Live here now')).toHaveLength(2)
  })

  it('calls onStatusChange when status is changed', () => {
    render(<TravelControls {...mockProps} />)

    const livedButtons = screen.getAllByText('Lived there')
    fireEvent.click(livedButtons[0])

    expect(mockProps.onStatusChange).toHaveBeenCalledWith(TravelStatus.LIVED)
  })

  it('displays travel statistics correctly', () => {
    const travelData: TravelData[] = [
      { countryCode: 'US', status: TravelStatus.VISITED },
      { countryCode: 'CA', status: TravelStatus.VISITED },
      { countryCode: 'UK', status: TravelStatus.LIVED },
    ]

    render(<TravelControls {...mockProps} travelData={travelData} />)

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

  it('updates subtitle text based on detail level', () => {
    const { rerender } = render(<TravelControls {...mockProps} detailLevel="countries" />)
    expect(screen.getByText(/Click on countries to mark them/)).toBeInTheDocument()

    rerender(<TravelControls {...mockProps} detailLevel="subdivisions" />)
    expect(screen.getByText(/Click on states\/provinces to mark them/)).toBeInTheDocument()
  })

  it('shows subdivision text for country scope', () => {
    render(<TravelControls {...mockProps} scope={countryScope} detailLevel="subdivisions" />)
    expect(screen.getByText(/Click on subdivisions to mark them/)).toBeInTheDocument()
  })

  it('shows admin level toggle for country scope', () => {
    render(<TravelControls {...mockProps} scope={countryScope} detailLevel="subdivisions" />)

    expect(screen.getByText('Administrative Level')).toBeInTheDocument()
    expect(screen.getByText('Regions')).toBeInTheDocument()
    expect(screen.getByText('Counties')).toBeInTheDocument()
    expect(screen.getByText('Sub-counties')).toBeInTheDocument()
  })

  it('hides admin level toggle for world scope', () => {
    render(<TravelControls {...mockProps} />)

    expect(screen.queryByText('Administrative Level')).not.toBeInTheDocument()
    expect(screen.queryByText('Regions')).not.toBeInTheDocument()
  })

  it('calls onAdminLevelChange when admin level button is clicked', () => {
    render(<TravelControls {...mockProps} scope={countryScope} detailLevel="subdivisions" />)

    fireEvent.click(screen.getByText('Counties'))
    expect(mockProps.onAdminLevelChange).toHaveBeenCalledWith('ADM2')

    fireEvent.click(screen.getByText('Sub-counties'))
    expect(mockProps.onAdminLevelChange).toHaveBeenCalledWith('ADM3')
  })
})

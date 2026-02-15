import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SaveLoadControls } from './SaveLoadControls'
import { TravelData, TravelStatus, UserTravelMap } from '../types'

const mockProps = {
  travelData: [] as TravelData[],
  savedMaps: [] as UserTravelMap[],
  onSave: vi.fn(),
  onLoad: vi.fn(),
  onDelete: vi.fn(),
}

describe('SaveLoadControls Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders save map section', () => {
    render(<SaveLoadControls {...mockProps} />)

    expect(screen.getByText('Save Map')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter map name...')).toBeInTheDocument()
    expect(screen.getByText('Save Current Map')).toBeInTheDocument()
  })

  it('disables save button when no travel data exists', () => {
    render(<SaveLoadControls {...mockProps} travelData={[]} />)

    const saveButton = screen.getByText('Save Current Map')
    expect(saveButton).toBeDisabled()
  })

  it('disables save button when map name is empty', () => {
    const travelData: TravelData[] = [
      { countryCode: 'US', status: TravelStatus.VISITED }
    ]

    render(<SaveLoadControls {...mockProps} travelData={travelData} />)

    const saveButton = screen.getByText('Save Current Map')
    expect(saveButton).toBeDisabled()
  })

  it('enables save button when map name is provided and travel data exists', () => {
    const travelData: TravelData[] = [
      { countryCode: 'US', status: TravelStatus.VISITED }
    ]

    render(<SaveLoadControls {...mockProps} travelData={travelData} />)

    const input = screen.getByPlaceholderText('Enter map name...')
    fireEvent.change(input, { target: { value: 'My Trip' } })

    const saveButton = screen.getByText('Save Current Map')
    expect(saveButton).not.toBeDisabled()
  })

  it('calls onSave when save button is clicked', () => {
    const travelData: TravelData[] = [
      { countryCode: 'US', status: TravelStatus.VISITED }
    ]

    render(<SaveLoadControls {...mockProps} travelData={travelData} />)

    const input = screen.getByPlaceholderText('Enter map name...')
    fireEvent.change(input, { target: { value: 'My Trip' } })

    const saveButton = screen.getByText('Save Current Map')
    fireEvent.click(saveButton)

    expect(mockProps.onSave).toHaveBeenCalledWith('My Trip')
  })

  it('calls onSave when Enter key is pressed in input', () => {
    const travelData: TravelData[] = [
      { countryCode: 'US', status: TravelStatus.VISITED }
    ]

    render(<SaveLoadControls {...mockProps} travelData={travelData} />)

    const input = screen.getByPlaceholderText('Enter map name...')
    fireEvent.change(input, { target: { value: 'My Trip' } })
    fireEvent.keyPress(input, { key: 'Enter', charCode: 13 })

    expect(mockProps.onSave).toHaveBeenCalledWith('My Trip')
  })

  it('clears input after successful save', () => {
    const travelData: TravelData[] = [
      { countryCode: 'US', status: TravelStatus.VISITED }
    ]

    render(<SaveLoadControls {...mockProps} travelData={travelData} />)

    const input = screen.getByPlaceholderText('Enter map name...') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'My Trip' } })

    const saveButton = screen.getByText('Save Current Map')
    fireEvent.click(saveButton)

    expect(input.value).toBe('')
  })

  it('displays empty state when no saved maps exist', () => {
    render(<SaveLoadControls {...mockProps} savedMaps={[]} />)

    expect(screen.getByText('Saved Maps (0)')).toBeInTheDocument()
    expect(screen.getByText('No saved maps yet')).toBeInTheDocument()
  })

  it('displays saved maps correctly', () => {
    const savedMaps: UserTravelMap[] = [
      {
        id: '1',
        name: 'Europe Trip',
        travelData: [],
        createdAt: new Date('2024-01-01T12:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z')
      }
    ]

    render(<SaveLoadControls {...mockProps} savedMaps={savedMaps} />)

    expect(screen.getByText('Saved Maps (1)')).toBeInTheDocument()
    expect(screen.getByText('Europe Trip')).toBeInTheDocument()
    expect(screen.getByText(/Saved:/)).toBeInTheDocument()
  })

  it('shows updated date when map was modified', () => {
    const savedMaps: UserTravelMap[] = [
      {
        id: '1',
        name: 'Europe Trip',
        travelData: [],
        createdAt: new Date('2024-01-01T12:00:00Z'),
        updatedAt: new Date('2024-01-02T12:00:00Z')
      }
    ]

    render(<SaveLoadControls {...mockProps} savedMaps={savedMaps} />)

    expect(screen.getByText(/Updated:/)).toBeInTheDocument()
  })

  it('calls onLoad when load button is clicked', () => {
    const savedMaps: UserTravelMap[] = [
      {
        id: '1',
        name: 'Europe Trip',
        travelData: [],
        createdAt: new Date('2024-01-01T12:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z')
      }
    ]

    render(<SaveLoadControls {...mockProps} savedMaps={savedMaps} />)

    const loadButton = screen.getByText('Load')
    fireEvent.click(loadButton)

    expect(mockProps.onLoad).toHaveBeenCalledWith('1')
  })

  it('calls onDelete when delete button is clicked', () => {
    const savedMaps: UserTravelMap[] = [
      {
        id: '1',
        name: 'Europe Trip',
        travelData: [],
        createdAt: new Date('2024-01-01T12:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z')
      }
    ]

    render(<SaveLoadControls {...mockProps} savedMaps={savedMaps} />)

    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    expect(mockProps.onDelete).toHaveBeenCalledWith('1')
  })

  it('displays scope label for saved maps with country scope', () => {
    const savedMaps: UserTravelMap[] = [
      {
        id: '1',
        name: 'Greece Trip',
        travelData: [],
        createdAt: new Date('2024-01-01T12:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
        scope: { type: 'country', countryCode: 'GR', countryName: 'Greece' },
        detailLevel: 'subdivisions',
        adminLevel: 'ADM2'
      }
    ]

    render(<SaveLoadControls {...mockProps} savedMaps={savedMaps} />)

    expect(screen.getByText('Scope: Greece ADM2')).toBeInTheDocument()
  })

  it('displays scope label for world scope maps', () => {
    const savedMaps: UserTravelMap[] = [
      {
        id: '1',
        name: 'World Map',
        travelData: [],
        createdAt: new Date('2024-01-01T12:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
        scope: { type: 'world' },
        detailLevel: 'countries'
      }
    ]

    render(<SaveLoadControls {...mockProps} savedMaps={savedMaps} />)

    expect(screen.getByText('Scope: World')).toBeInTheDocument()
  })

  it('displays scope label for continent scope maps', () => {
    const savedMaps: UserTravelMap[] = [
      {
        id: '1',
        name: 'Europe Trip',
        travelData: [],
        createdAt: new Date('2024-01-01T12:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z'),
        scope: { type: 'continent', continent: 'Europe' },
        detailLevel: 'countries'
      }
    ]

    render(<SaveLoadControls {...mockProps} savedMaps={savedMaps} />)

    expect(screen.getByText('Scope: Europe')).toBeInTheDocument()
  })

  it('does not display scope label for old maps without scope', () => {
    const savedMaps: UserTravelMap[] = [
      {
        id: '1',
        name: 'Old Map',
        travelData: [],
        createdAt: new Date('2024-01-01T12:00:00Z'),
        updatedAt: new Date('2024-01-01T12:00:00Z')
      }
    ]

    render(<SaveLoadControls {...mockProps} savedMaps={savedMaps} />)

    expect(screen.queryByTestId('map-scope-label')).not.toBeInTheDocument()
  })
})
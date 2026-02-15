import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DebugPanel } from './DebugPanel'

const mockGeoJsonData = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { iso_a2: 'FR', name: 'Île-de-France' }, geometry: { type: 'Polygon', coordinates: [] } },
    { type: 'Feature', properties: { iso_a2: 'FR', name: 'Corsica' }, geometry: { type: 'Polygon', coordinates: [] } },
    { type: 'Feature', properties: { iso_a2: 'FR', name: 'Brittany' }, geometry: { type: 'Polygon', coordinates: [] } },
    { type: 'Feature', properties: { iso_a2: 'DE', name: 'Bavaria' }, geometry: { type: 'Polygon', coordinates: [] } },
    { type: 'Feature', properties: { iso_a2: 'DE', name: 'Saxony' }, geometry: { type: 'Polygon', coordinates: [] } },
    { type: 'Feature', properties: { iso_a2: 'IT', name: 'Lazio' }, geometry: { type: 'Polygon', coordinates: [] } },
  ]
}

describe('DebugPanel', () => {
  it('renders total feature count', () => {
    render(<DebugPanel geoJsonData={mockGeoJsonData} />)
    expect(screen.getByText(/Total: 6/)).toBeInTheDocument()
  })

  it('shows per-country breakdown sorted by count descending', () => {
    render(<DebugPanel geoJsonData={mockGeoJsonData} />)
    // FR=3, DE=2, IT=1
    const items = screen.getAllByTestId('country-count')
    expect(items[0]).toHaveTextContent('FR: 3')
    expect(items[1]).toHaveTextContent('DE: 2')
    expect(items[2]).toHaveTextContent('IT: 1')
  })

  it('does not render when geoJsonData is null', () => {
    const { container } = render(<DebugPanel geoJsonData={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('is collapsible', () => {
    render(<DebugPanel geoJsonData={mockGeoJsonData} />)
    // Initially expanded — country counts visible
    expect(screen.getByText(/FR: 3/)).toBeVisible()

    // Click to collapse
    fireEvent.click(screen.getByRole('button', { name: /toggle/i }))
    expect(screen.queryByText(/FR: 3/)).not.toBeInTheDocument()

    // Click to expand
    fireEvent.click(screen.getByRole('button', { name: /toggle/i }))
    expect(screen.getByText(/FR: 3/)).toBeInTheDocument()
  })
})

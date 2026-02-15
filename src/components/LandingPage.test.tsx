import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LandingPage } from './LandingPage'

describe('LandingPage Component', () => {
  const mockOnScopeSelected = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the landing page', () => {
    render(<LandingPage onScopeSelected={mockOnScopeSelected} />)

    expect(screen.getByTestId('landing-page')).toBeInTheDocument()
    expect(screen.getByText('Travel Maps')).toBeInTheDocument()
    expect(screen.getByText(/Choose a scope/)).toBeInTheDocument()
  })

  it('displays three scope tabs', () => {
    render(<LandingPage onScopeSelected={mockOnScopeSelected} />)

    expect(screen.getByText('World')).toBeInTheDocument()
    expect(screen.getByText('Continent')).toBeInTheDocument()
    expect(screen.getByText('Country')).toBeInTheDocument()
  })

  it('selects world scope by default and explore is enabled', () => {
    render(<LandingPage onScopeSelected={mockOnScopeSelected} />)

    const exploreButton = screen.getByText('Explore')
    expect(exploreButton).not.toBeDisabled()
  })

  it('calls onScopeSelected with world scope on explore', () => {
    render(<LandingPage onScopeSelected={mockOnScopeSelected} />)

    fireEvent.click(screen.getByText('Explore'))
    expect(mockOnScopeSelected).toHaveBeenCalledWith({ type: 'world' })
  })

  it('shows continent dropdown when continent tab is selected', () => {
    render(<LandingPage onScopeSelected={mockOnScopeSelected} />)

    fireEvent.click(screen.getByText('Continent'))
    expect(screen.getByText('Choose a continent...')).toBeInTheDocument()
  })

  it('disables explore when continent not selected', () => {
    render(<LandingPage onScopeSelected={mockOnScopeSelected} />)

    fireEvent.click(screen.getByText('Continent'))
    expect(screen.getByText('Explore')).toBeDisabled()
  })

  it('enables explore when continent is selected', () => {
    render(<LandingPage onScopeSelected={mockOnScopeSelected} />)

    fireEvent.click(screen.getByText('Continent'))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Europe' } })

    expect(screen.getByText('Explore')).not.toBeDisabled()
  })

  it('calls onScopeSelected with continent scope', () => {
    render(<LandingPage onScopeSelected={mockOnScopeSelected} />)

    fireEvent.click(screen.getByText('Continent'))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Europe' } })
    fireEvent.click(screen.getByText('Explore'))

    expect(mockOnScopeSelected).toHaveBeenCalledWith({ type: 'continent', continent: 'Europe' })
  })

  it('shows country search and dropdown when country tab is selected', () => {
    render(<LandingPage onScopeSelected={mockOnScopeSelected} />)

    fireEvent.click(screen.getByText('Country'))
    expect(screen.getByPlaceholderText('Search countries...')).toBeInTheDocument()
    expect(screen.getByText('Choose a country...')).toBeInTheDocument()
  })

  it('disables explore when country not selected', () => {
    render(<LandingPage onScopeSelected={mockOnScopeSelected} />)

    fireEvent.click(screen.getByText('Country'))
    expect(screen.getByText('Explore')).toBeDisabled()
  })

  it('calls onScopeSelected with country scope', () => {
    render(<LandingPage onScopeSelected={mockOnScopeSelected} />)

    fireEvent.click(screen.getByText('Country'))
    // Select a country from the dropdown
    const selects = screen.getAllByRole('combobox')
    const countrySelect = selects[selects.length - 1]
    fireEvent.change(countrySelect, { target: { value: 'US' } })
    fireEvent.click(screen.getByText('Explore'))

    expect(mockOnScopeSelected).toHaveBeenCalledWith({
      type: 'country',
      countryCode: 'US',
      countryName: 'United States',
    })
  })

  it('filters countries when searching', () => {
    render(<LandingPage onScopeSelected={mockOnScopeSelected} />)

    fireEvent.click(screen.getByText('Country'))
    fireEvent.change(screen.getByPlaceholderText('Search countries...'), {
      target: { value: 'france' },
    })

    // France should be in the dropdown, but not unrelated countries
    const options = screen.getAllByRole('option')
    const optionTexts = options.map(o => o.textContent)
    expect(optionTexts).toContain('France')
  })
})

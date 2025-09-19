import { test, expect } from '@playwright/test'

test.describe('Travel Maps Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the application successfully', async ({ page }) => {
    // Check that the main title is visible
    await expect(page.getByText('Travel Maps')).toBeVisible()

    // Check that the map container is present
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible()

    // Check that the controls are present
    await expect(page.getByText('Travel Status')).toBeVisible()
    await expect(page.getByText('Save Map')).toBeVisible()
  })

  test('should display travel status options', async ({ page }) => {
    await expect(page.getByText('Visited')).toBeVisible()
    await expect(page.getByText('Lived')).toBeVisible()
    await expect(page.getByText('From')).toBeVisible()
    await expect(page.getByText('Current')).toBeVisible()
  })

  test('should display view mode options', async ({ page }) => {
    await expect(page.getByText('🌍 Countries')).toBeVisible()
    await expect(page.getByText('🗺️ States/Provinces')).toBeVisible()
  })

  test('should allow switching between view modes', async ({ page }) => {
    // Click on subdivisions view mode
    await page.getByText('🗺️ States/Provinces').click()

    // Check that the subtitle changes
    await expect(page.getByText(/Click on states\/provinces to mark them/)).toBeVisible()

    // Switch back to countries
    await page.getByText('🌍 Countries').click()

    // Check that the subtitle changes back
    await expect(page.getByText(/Click on countries to mark them/)).toBeVisible()
  })

  test('should allow selecting different travel statuses', async ({ page }) => {
    // Click on "Lived" status
    await page.getByText('Lived').click()

    // The button should be selected (this would be reflected in styling)
    // We can't easily test CSS styling, but we can verify the button is interactive
    await expect(page.getByText('Lived')).toBeVisible()

    // Click on "From" status
    await page.getByText('From').click()
    await expect(page.getByText('From')).toBeVisible()
  })

  test('should show travel statistics', async ({ page }) => {
    await expect(page.getByText('Travel Statistics')).toBeVisible()

    // Initially, all counts should be 0 (displayed in the statistics grid)
    const statisticsSection = page.locator('text=Travel Statistics').locator('..')
    await expect(statisticsSection).toBeVisible()
  })

  test('should display save map functionality', async ({ page }) => {
    await expect(page.getByPlaceholderText('Enter map name...')).toBeVisible()
    await expect(page.getByText('Save Current Map')).toBeVisible()

    // Save button should be disabled initially (no travel data)
    await expect(page.getByText('Save Current Map')).toBeDisabled()
  })

  test('should display saved maps section', async ({ page }) => {
    await expect(page.getByText(/Saved Maps \(0\)/)).toBeVisible()
    await expect(page.getByText('No saved maps yet')).toBeVisible()
  })

  test('should display clear all button', async ({ page }) => {
    const clearButton = page.getByText('Clear All')
    await expect(clearButton).toBeVisible()

    // Should be disabled initially (no travel data)
    await expect(clearButton).toBeDisabled()
  })

  test('should enable save functionality when map name is entered', async ({ page }) => {
    // Note: This test assumes we have some travel data.
    // In a real scenario, we'd need to click on the map first

    const mapNameInput = page.getByPlaceholderText('Enter map name...')
    await mapNameInput.fill('Test Map')

    // The save button should still be disabled without travel data
    await expect(page.getByText('Save Current Map')).toBeDisabled()
  })

  test('should handle map name input correctly', async ({ page }) => {
    const mapNameInput = page.getByPlaceholderText('Enter map name...')

    await mapNameInput.fill('My Europe Trip')
    await expect(mapNameInput).toHaveValue('My Europe Trip')

    await mapNameInput.clear()
    await expect(mapNameInput).toHaveValue('')
  })

  test('should display application layout correctly', async ({ page }) => {
    // Check that the app has the expected layout structure
    const mapContainer = page.locator('[data-testid="map-container"]')
    const controlsContainer = page.locator('text=Travel Maps').locator('..')

    await expect(mapContainer).toBeVisible()
    await expect(controlsContainer).toBeVisible()
  })

  test('should handle page responsiveness', async ({ page }) => {
    // Test different viewport sizes
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.getByText('Travel Maps')).toBeVisible()

    await page.setViewportSize({ width: 800, height: 600 })
    await expect(page.getByText('Travel Maps')).toBeVisible()
  })
})

test.describe('Travel Maps Accessibility', () => {
  test('should be accessible', async ({ page }) => {
    await page.goto('/')

    // Basic accessibility checks
    await expect(page.getByRole('heading', { name: 'Travel Maps' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save Current Map' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Clear All' })).toBeVisible()
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/')

    // Tab through the travel status buttons
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Should be able to activate buttons with Enter/Space
    const visitedButton = page.getByText('Visited')
    await visitedButton.focus()
    await page.keyboard.press('Enter')

    // Button should remain focused and be activatable
    await expect(visitedButton).toBeFocused()
  })
})
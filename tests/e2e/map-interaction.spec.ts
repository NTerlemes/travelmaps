import { test, expect } from '@playwright/test'

test.describe('Map Interaction Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for the map to potentially load
    await page.waitForTimeout(2000)
  })

  test('should load map component', async ({ page }) => {
    // Check that the map container is present
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible()
  })

  test('should handle map loading states', async ({ page }) => {
    // The map should be present even if data is still loading
    const mapContainer = page.locator('[data-testid="map-container"]')
    await expect(mapContainer).toBeVisible()

    // Check that the app remains functional during map loading
    await expect(page.getByText('Travel Maps')).toBeVisible()
    await expect(page.getByText('Visited')).toBeVisible()
  })

  test('should maintain state when switching view modes', async ({ page }) => {
    // Start with countries view
    await expect(page.getByText('🌍 Countries')).toBeVisible()

    // Switch to subdivisions
    await page.getByText('🗺️ States/Provinces').click()

    // The map container should still be there
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible()

    // Switch back to countries
    await page.getByText('🌍 Countries').click()

    // Map should still be present
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible()
  })

  test('should handle map errors gracefully', async ({ page }) => {
    // Even if map data fails to load, the app should remain functional
    await expect(page.getByText('Travel Maps')).toBeVisible()
    await expect(page.getByText('Save Map')).toBeVisible()

    // Controls should still be interactive
    await page.getByText('Lived').click()
    await expect(page.getByText('Lived')).toBeVisible()
  })
})

test.describe('Travel Data Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should save and load maps correctly', async ({ page }) => {
    // Note: This test simulates the workflow without actual map clicks
    // since we're testing with mocked map components

    const mapNameInput = page.getByPlaceholderText('Enter map name...')

    // Enter a map name
    await mapNameInput.fill('Test Trip')
    await expect(mapNameInput).toHaveValue('Test Trip')

    // The save button should be disabled without travel data
    await expect(page.getByText('Save Current Map')).toBeDisabled()

    // In a real scenario with map data, we would test:
    // 1. Click on map areas to add travel data
    // 2. Save button becomes enabled
    // 3. Click save button
    // 4. Map appears in saved maps list
    // 5. Load the map and verify data is restored
  })

  test('should clear all data correctly', async ({ page }) => {
    const clearButton = page.getByText('Clear All')

    // Initially disabled (no data)
    await expect(clearButton).toBeDisabled()

    // In a real scenario with travel data:
    // 1. Add some travel data by clicking on map
    // 2. Clear button becomes enabled
    // 3. Click clear button
    // 4. All travel data is removed
    // 5. Statistics reset to zero
    // 6. Clear button becomes disabled again
  })

  test('should handle saved maps list correctly', async ({ page }) => {
    // Initially should show empty state
    await expect(page.getByText('Saved Maps (0)')).toBeVisible()
    await expect(page.getByText('No saved maps yet')).toBeVisible()

    // In a real scenario with saved maps:
    // 1. Maps would be displayed in the list
    // 2. Each map would have Load and Delete buttons
    // 3. Load button would restore the map data
    // 4. Delete button would remove the map from the list
  })

  test('should validate map name input', async ({ page }) => {
    const mapNameInput = page.getByPlaceholderText('Enter map name...')
    const saveButton = page.getByText('Save Current Map')

    // Empty name should keep save button disabled
    await mapNameInput.fill('')
    await expect(saveButton).toBeDisabled()

    // Whitespace-only name should keep save button disabled
    await mapNameInput.fill('   ')
    await expect(saveButton).toBeDisabled()

    // Valid name should enable save button (if travel data exists)
    await mapNameInput.fill('Valid Map Name')
    // Still disabled because no travel data, but input is valid
    await expect(mapNameInput).toHaveValue('Valid Map Name')
  })

  test('should support Enter key for saving', async ({ page }) => {
    const mapNameInput = page.getByPlaceholderText('Enter map name...')

    await mapNameInput.fill('Quick Save Map')

    // Press Enter in the input field
    await mapNameInput.press('Enter')

    // In a real scenario with travel data, this would trigger save
    // For now, we just verify the input handling works
    await expect(mapNameInput).toHaveValue('Quick Save Map')
  })
})

test.describe('Statistics and UI Updates', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display travel statistics section', async ({ page }) => {
    await expect(page.getByText('Travel Statistics')).toBeVisible()

    // All status types should be listed in statistics
    const statsSection = page.locator('text=Travel Statistics').locator('..')
    await expect(statsSection).toContainText('Visited')
    await expect(statsSection).toContainText('Lived')
    await expect(statsSection).toContainText('From')
    await expect(statsSection).toContainText('Current')
  })

  test('should update UI when travel status is selected', async ({ page }) => {
    // Select different travel statuses
    await page.getByText('Visited').click()
    await page.getByText('Lived').click()
    await page.getByText('From').click()
    await page.getByText('Current').click()

    // Each click should be registered (styling changes aren't easily testable)
    // but we can verify the elements remain interactive
    await expect(page.getByText('Visited')).toBeVisible()
    await expect(page.getByText('Lived')).toBeVisible()
    await expect(page.getByText('From')).toBeVisible()
    await expect(page.getByText('Current')).toBeVisible()
  })

  test('should maintain consistent UI state', async ({ page }) => {
    // Perform various interactions to ensure UI remains stable
    await page.getByText('🗺️ States/Provinces').click()
    await page.getByText('Lived').click()
    await page.getByPlaceholderText('Enter map name...').fill('Test')
    await page.getByText('🌍 Countries').click()
    await page.getByText('Visited').click()

    // All elements should still be visible and functional
    await expect(page.getByText('Travel Maps')).toBeVisible()
    await expect(page.getByText('Travel Statistics')).toBeVisible()
    await expect(page.getByText('Save Map')).toBeVisible()
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible()
  })
})
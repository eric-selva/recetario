import { test, expect } from '@playwright/test'

test.describe('Recipe Filters', () => {
  test('meal type filter buttons work', async ({ page }) => {
    await page.goto('/recetas')

    // Click Desayuno filter
    await page.getByRole('button', { name: 'Desayuno' }).click()
    await page.waitForTimeout(500)

    // The button should be active (has accent bg)
    const desayunoBtn = page.getByRole('button', { name: 'Desayuno' })
    await expect(desayunoBtn).toHaveClass(/bg-primary/)

    // Click Todas to reset
    await page.getByRole('button', { name: 'Todas' }).click()
    await page.waitForTimeout(500)

    const todasBtn = page.getByRole('button', { name: 'Todas' })
    await expect(todasBtn).toHaveClass(/bg-primary/)
  })

  test('search input accepts text and triggers search', async ({ page }) => {
    await page.goto('/recetas')

    const search = page.getByPlaceholder(/Buscar por titulo/)
    await expect(search).toBeVisible()

    // Type a search term
    await search.fill('tomate')
    await page.waitForTimeout(500)

    // Verify the input has the value (search works without crashing)
    await expect(search).toHaveValue('tomate')
  })

  test('switching between filter types works', async ({ page }) => {
    await page.goto('/recetas')

    // Cycle through all filters
    for (const filter of ['Desayuno', 'Comida', 'Cena', 'Todas']) {
      await page.getByRole('button', { name: filter }).click()
      await page.waitForTimeout(300)
      await expect(page.getByRole('button', { name: filter })).toHaveClass(/bg-primary/)
    }
  })
})

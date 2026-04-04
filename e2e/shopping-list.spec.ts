import { test, expect } from '@playwright/test'

test.describe('Shopping List', () => {
  test('shopping list shows correct state (items or empty)', async ({ page }) => {
    await page.goto('/lista-compra')
    await page.waitForTimeout(2000)

    // Either shows items or empty state - both are valid
    const isEmpty = await page.getByText('La lista esta vacia').isVisible().catch(() => false)
    const hasItems = await page.getByText('Ingredientes').isVisible().catch(() => false)
    const hasRecipes = await page.getByText('Recetas de esta semana').isVisible().catch(() => false)

    expect(isEmpty || hasItems || hasRecipes).toBe(true)
  })

  test('shopping list empty state has link to recipes', async ({ page }) => {
    await page.goto('/lista-compra')
    await page.waitForTimeout(2000)

    const isEmpty = await page.getByText('La lista esta vacia').isVisible().catch(() => false)
    if (isEmpty) {
      await expect(page.getByRole('link', { name: 'Ver recetas' })).toBeVisible()
    } else {
      // If list has items, verify the vaciar button exists
      await expect(page.getByText('Vaciar lista')).toBeVisible()
    }
  })

  test('shopping list page has correct title', async ({ page }) => {
    await page.goto('/lista-compra')
    await expect(page.getByRole('heading', { name: 'Lista de la compra' })).toBeVisible()
  })
})

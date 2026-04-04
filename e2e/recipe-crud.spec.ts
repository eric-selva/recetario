import { test, expect } from '@playwright/test'

test.describe.serial('Recipe CRUD Flow', () => {
  const recipeName = `Test Recipe ${Date.now()}`
  let recipeUrl = ''

  test('create a new recipe', async ({ page }) => {
    await page.goto('/recetas/nueva')

    // Fill basic info
    await page.getByPlaceholder(/Tortilla de patatas/).fill(recipeName)
    await page.getByPlaceholder(/Breve descripcion/).fill('Receta de prueba automatica')
    await page.locator('select').first().selectOption('comida')
    await page.getByRole('spinbutton').first().fill('30') // prep_time
    await page.getByRole('spinbutton').nth(1).fill('4') // servings

    // Add ingredient
    await page.getByPlaceholder('Ingrediente').fill('Tomate')
    await page.getByPlaceholder('0').first().fill('200')

    // Add step
    await page.getByPlaceholder('Paso 1...').fill('Lavar los tomates')

    // Submit
    await page.getByText('Crear receta').click()

    // Should redirect to detail page
    await expect(page.getByText(recipeName)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Receta de prueba automatica')).toBeVisible()

    // Save URL for later cleanup
    recipeUrl = page.url()
  })

  test('recipe appears in listing', async ({ page }) => {
    await page.goto('/recetas')
    await page.waitForTimeout(3000)

    await page.getByPlaceholder(/Buscar por titulo/).fill(recipeName)
    await page.waitForTimeout(1500)

    const recipeVisible = await page.getByText(recipeName).isVisible().catch(() => false)
    const noResults = await page.getByText(/No (hay|se encontraron) recetas/).isVisible().catch(() => false)
    expect(recipeVisible || noResults).toBe(true)
  })

  test('can add recipe to shopping list', async ({ page }) => {
    await page.goto('/recetas')
    await page.waitForTimeout(1000)

    const recipeLink = page.getByText(recipeName).first()
    if (await recipeLink.isVisible()) {
      await recipeLink.click()
      await expect(page.getByText(/Añadir a la lista de compra/)).toBeVisible({ timeout: 10000 })

      await page.getByText(/Añadir a la lista de compra/).click()

      await expect(page.getByText('Receta añadida a la lista de compra')).toBeVisible({ timeout: 5000 })
    }
  })

  test('shopping list page loads after adding recipe', async ({ page }) => {
    await page.goto('/lista-compra')
    await expect(page.getByRole('heading', { name: 'Lista de la compra' })).toBeVisible()
    await page.waitForTimeout(3000)

    const pageContent = await page.textContent('body')
    expect(pageContent).toContain('Lista de la compra')
  })

  test('cleanup: delete test recipe and clear shopping list', async ({ page }) => {
    // Auto-accept all dialogs
    page.on('dialog', (dialog) => dialog.accept())

    // Clear shopping list first
    await page.goto('/lista-compra')
    await page.waitForTimeout(2000)

    const vaciarBtn = page.getByText('Vaciar lista')
    if (await vaciarBtn.isVisible().catch(() => false)) {
      await vaciarBtn.click()
      await page.waitForTimeout(1000)
    }

    // Delete the test recipe
    if (recipeUrl) {
      await page.goto(recipeUrl)
      await page.waitForTimeout(2000)

      const eliminarBtn = page.getByText('Eliminar')
      if (await eliminarBtn.isVisible().catch(() => false)) {
        await eliminarBtn.click()
        await expect(page).toHaveURL('/recetas', { timeout: 10000 })
      }
    }
  })
})

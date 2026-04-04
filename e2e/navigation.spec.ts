import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('home page loads with hero', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Mi Recetario').first()).toBeVisible()
    await expect(page.getByText('Todas tus recetas en un solo lugar')).toBeVisible()
  })

  test('home page has working CTA links', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Ver recetas' }).click()
    await expect(page).toHaveURL('/recetas')
  })

  test('header navigation works', async ({ page }) => {
    await page.goto('/')

    // Navigate to Recetas
    await page.getByRole('link', { name: 'Recetas' }).first().click()
    await expect(page).toHaveURL('/recetas')
    await expect(page.getByRole('heading', { name: 'Recetas' })).toBeVisible()

    // Navigate to Lista de compra
    await page.getByRole('link', { name: 'Lista de compra' }).first().click()
    await expect(page).toHaveURL('/lista-compra')
    await expect(page.getByRole('heading', { name: 'Lista de la compra' })).toBeVisible()

    // Navigate back to Inicio
    await page.getByRole('link', { name: 'Inicio' }).first().click()
    await expect(page).toHaveURL('/')
  })

  test('nueva receta page loads', async ({ page }) => {
    await page.goto('/recetas/nueva')
    await expect(page.getByRole('heading', { name: 'Nueva receta' })).toBeVisible()
    await expect(page.getByText('Informacion basica')).toBeVisible()
  })

  test('recetas page shows filter buttons', async ({ page }) => {
    await page.goto('/recetas')
    await expect(page.getByText('Todas')).toBeVisible()
    await expect(page.getByText('Desayuno')).toBeVisible()
    await expect(page.getByText('Comida')).toBeVisible()
    await expect(page.getByText('Cena')).toBeVisible()
  })

  test('recetas page shows search input', async ({ page }) => {
    await page.goto('/recetas')
    await expect(page.getByPlaceholder(/Buscar por titulo/)).toBeVisible()
  })
})

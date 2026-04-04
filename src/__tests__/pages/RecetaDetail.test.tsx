import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RecetaDetailPage from '@/app/recetas/[id]/page'
import { mockFetch } from '../setup'

const mockRecipe = {
  id: 'test-id',
  title: 'Espaguetis Boloñesa',
  description: 'Pasta clasica italiana',
  image_url: 'https://example.com/photo.jpg',
  meal_type: 'comida',
  prep_time: 90,
  servings: 2,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ingredients: [
    { id: 'i1', recipe_id: 'test-id', name: 'Espaguetis', quantity: 150, unit: 'g', order: 0 },
    { id: 'i2', recipe_id: 'test-id', name: 'Carne picada', quantity: 250, unit: 'g', order: 1 },
  ],
  steps: [
    { id: 's1', recipe_id: 'test-id', order: 0, instruction: 'Hervir la pasta' },
    { id: 's2', recipe_id: 'test-id', order: 1, instruction: 'Preparar la salsa' },
  ],
}

describe('Receta Detail Page', () => {
  beforeEach(() => {
    mockFetch({
      '/api/recetas/test-id': mockRecipe,
      '/api/lista-compra': { id: 'sl1', recipe_id: 'test-id' },
    })
  })

  it('shows skeleton while loading', () => {
    render(<RecetaDetailPage />)
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })

  it('renders recipe title after loading', async () => {
    render(<RecetaDetailPage />)
    await waitFor(() => {
      expect(screen.getByText('Espaguetis Boloñesa')).toBeInTheDocument()
    })
  })

  it('renders recipe description', async () => {
    render(<RecetaDetailPage />)
    await waitFor(() => {
      expect(screen.getByText('Pasta clasica italiana')).toBeInTheDocument()
    })
  })

  it('renders meal type badge', async () => {
    render(<RecetaDetailPage />)
    await waitFor(() => {
      expect(screen.getByText('Comida')).toBeInTheDocument()
    })
  })

  it('renders prep time and servings', async () => {
    render(<RecetaDetailPage />)
    await waitFor(() => {
      expect(screen.getByText('90 min')).toBeInTheDocument()
      expect(screen.getByText('2 raciones')).toBeInTheDocument()
    })
  })

  it('renders recipe image', async () => {
    render(<RecetaDetailPage />)
    await waitFor(() => {
      const img = screen.getByRole('img', { name: 'Espaguetis Boloñesa' })
      expect(img).toBeInTheDocument()
    })
  })

  it('renders ingredients list', async () => {
    render(<RecetaDetailPage />)
    await waitFor(() => {
      expect(screen.getByText('Ingredientes')).toBeInTheDocument()
      expect(screen.getByText('Espaguetis')).toBeInTheDocument()
      expect(screen.getByText('Carne picada')).toBeInTheDocument()
      expect(screen.getByText('150 g')).toBeInTheDocument()
      expect(screen.getByText('250 g')).toBeInTheDocument()
    })
  })

  it('renders steps', async () => {
    render(<RecetaDetailPage />)
    await waitFor(() => {
      expect(screen.getByText('Paso a paso')).toBeInTheDocument()
      expect(screen.getByText('Hervir la pasta')).toBeInTheDocument()
      expect(screen.getByText('Preparar la salsa')).toBeInTheDocument()
    })
  })

  it('renders action buttons', async () => {
    render(<RecetaDetailPage />)
    await waitFor(() => {
      expect(screen.getByText(/Añadir a la lista de compra/)).toBeInTheDocument()
      expect(screen.getByText('Editar')).toBeInTheDocument()
      expect(screen.getByText('Eliminar')).toBeInTheDocument()
    })
  })

  it('renders back link', async () => {
    render(<RecetaDetailPage />)
    await waitFor(() => {
      expect(screen.getByText('Volver a recetas')).toBeInTheDocument()
    })
  })

  it('shows toast when adding to shopping list', async () => {
    render(<RecetaDetailPage />)
    await waitFor(() => {
      expect(screen.getByText(/Añadir a la lista de compra/)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText(/Añadir a la lista de compra/))

    await waitFor(() => {
      expect(screen.getByText('Receta añadida a la lista de compra')).toBeInTheDocument()
    })
  })

  it('shows not found when recipe does not exist', async () => {
    mockFetch({
      '/api/recetas/test-id': null,
    })
    // Override fetch to return 404
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      })
    ) as unknown as typeof fetch

    render(<RecetaDetailPage />)
    await waitFor(() => {
      expect(screen.getByText('Receta no encontrada')).toBeInTheDocument()
    })
  })
})

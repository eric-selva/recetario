import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RecetasPage from '@/app/recetas/page'
import { mockFetch } from '../setup'

const mockRecipes = [
  {
    id: '1',
    title: 'Espaguetis Boloñesa',
    description: 'Pasta clasica italiana',
    image_url: null,
    meal_type: 'comida',
    prep_time: 90,
    servings: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Tostadas con aguacate',
    description: 'Desayuno saludable',
    image_url: null,
    meal_type: 'desayuno',
    prep_time: 10,
    servings: 1,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
]

describe('Recetas Page', () => {
  beforeEach(() => {
    mockFetch({ '/api/recetas': mockRecipes })
  })

  it('renders page title', () => {
    render(<RecetasPage />)
    expect(screen.getByText('Recetas')).toBeInTheDocument()
  })

  it('renders "Nueva receta" button', () => {
    render(<RecetasPage />)
    expect(screen.getByText('Nueva receta')).toBeInTheDocument()
  })

  it('shows skeleton while loading', () => {
    render(<RecetasPage />)
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })

  it('renders recipe cards after loading', async () => {
    render(<RecetasPage />)
    await waitFor(() => {
      expect(screen.getByText('Espaguetis Boloñesa')).toBeInTheDocument()
      expect(screen.getByText('Tostadas con aguacate')).toBeInTheDocument()
    })
  })

  it('renders search input', () => {
    render(<RecetasPage />)
    expect(screen.getByPlaceholderText(/Buscar por titulo/)).toBeInTheDocument()
  })

  it('renders meal type filter buttons', () => {
    render(<RecetasPage />)
    expect(screen.getByText('Todas')).toBeInTheDocument()
    expect(screen.getByText('Desayuno')).toBeInTheDocument()
    expect(screen.getByText('Comida')).toBeInTheDocument()
    expect(screen.getByText('Cena')).toBeInTheDocument()
  })

  it('calls fetch with meal_type param when filter clicked', async () => {
    const fetchMock = mockFetch({ '/api/recetas': mockRecipes })
    render(<RecetasPage />)

    await waitFor(() => {
      expect(screen.getByText('Espaguetis Boloñesa')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Desayuno' }))

    await waitFor(() => {
      const calls = fetchMock.mock.calls.map((c: unknown[]) => String(c[0]))
      expect(calls.some((url: string) => url.includes('meal_type=desayuno'))).toBe(true)
    })
  })

  it('shows empty state when no recipes', async () => {
    mockFetch({ '/api/recetas': [] })
    render(<RecetasPage />)

    await waitFor(() => {
      expect(screen.getByText('No hay recetas')).toBeInTheDocument()
    })
  })

  it('shows "Crear receta" link in empty state', async () => {
    mockFetch({ '/api/recetas': [] })
    render(<RecetasPage />)

    await waitFor(() => {
      expect(screen.getByText('Crear receta')).toBeInTheDocument()
    })
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RecetasPage from '@/app/recetas/page'
import { mockFetch } from '../setup'
import { invalidateCache } from '@/lib/fetchCache'

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
    description: 'Postre clasico',
    image_url: null,
    meal_type: 'postre',
    prep_time: 10,
    servings: 1,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
]

const paginatedResponse = { data: mockRecipes, total: mockRecipes.length }

describe('Recetas Page', () => {
  beforeEach(() => {
    invalidateCache()
    mockFetch({ '/api/recetas': paginatedResponse })
  })

  it('renders page title', () => {
    render(<RecetasPage />)
    expect(screen.getByText('Recetas')).toBeInTheDocument()
  })

  it('renders "Nueva" button', () => {
    render(<RecetasPage />)
    expect(screen.getByText('+ Nueva')).toBeInTheDocument()
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
    expect(screen.getByText('Comida')).toBeInTheDocument()
    expect(screen.getByText('Cena')).toBeInTheDocument()
    expect(screen.getByText('Postre')).toBeInTheDocument()
  })

  it('calls fetch with meal_type param when filter clicked', async () => {
    const fetchMock = mockFetch({ '/api/recetas': paginatedResponse })
    render(<RecetasPage />)

    await waitFor(() => {
      expect(screen.getByText('Espaguetis Boloñesa')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Postre' }))

    await waitFor(() => {
      const calls = fetchMock.mock.calls.map((c: unknown[]) => String(c[0]))
      expect(calls.some((url: string) => url.includes('meal_type=postre'))).toBe(true)
    })
  })

  it('shows empty state when no recipes', async () => {
    mockFetch({ '/api/recetas': { data: [], total: 0 } })
    render(<RecetasPage />)

    await waitFor(() => {
      expect(screen.getByText('No hay recetas')).toBeInTheDocument()
    })
  })

  it('shows "Crear receta" link in empty state when filter is "todas"', async () => {
    mockFetch({ '/api/recetas': { data: [], total: 0 } })
    render(<RecetasPage />)

    // Default filter is "comida", switch to "todas" to see "Crear receta" link
    fireEvent.click(screen.getByRole('button', { name: 'Todas' }))

    await waitFor(() => {
      expect(screen.getByText('Crear receta')).toBeInTheDocument()
    })
  })
})

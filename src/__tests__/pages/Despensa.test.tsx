import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DespensaPage from '@/app/despensa/page'
import { mockFetch } from '../setup'
import { invalidateCache } from '@/lib/fetchCache'

vi.mock('next/navigation', () => ({
  usePathname: () => '/despensa',
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useParams: () => ({}),
}))

describe('Despensa Page', () => {
  beforeEach(() => {
    invalidateCache()
    mockFetch({
      '/api/despensa': [],
      '/api/ingredientes': [],
      '/api/recetas': [],
      '/api/despensa/tupper-extras': [],
    })
  })

  it('renders page title', () => {
    render(<DespensaPage />)
    expect(screen.getByRole('heading', { name: 'Despensa' })).toBeInTheDocument()
  })

  it('renders subtitle', () => {
    render(<DespensaPage />)
    expect(screen.getByText(/Controla lo que tienes/)).toBeInTheDocument()
  })

  it('renders both tab options', () => {
    render(<DespensaPage />)
    expect(screen.getByText('Despensa', { selector: 'button' })).toBeInTheDocument()
    expect(screen.getByText('Tuppers')).toBeInTheDocument()
  })

  it('shows recipe search on tuppers tab (default)', () => {
    render(<DespensaPage />)
    expect(screen.getByPlaceholderText(/Buscar receta/)).toBeInTheDocument()
  })

  it('shows empty state for tuppers (default)', async () => {
    render(<DespensaPage />)
    await waitFor(() => {
      expect(screen.getByText(/No hay tuppers/)).toBeInTheDocument()
    })
  })

  it('switches to despensa tab', async () => {
    render(<DespensaPage />)
    fireEvent.click(screen.getByText('Despensa', { selector: 'button' }))

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar ingrediente/)).toBeInTheDocument()
    })
  })

  it('shows empty state for despensa', async () => {
    render(<DespensaPage />)
    fireEvent.click(screen.getByText('Despensa', { selector: 'button' }))

    await waitFor(() => {
      expect(screen.getByText(/La despensa esta vacia/)).toBeInTheDocument()
    })
  })

  it('renders nevera items with quantity selector', async () => {
    mockFetch({
      '/api/despensa': [
        { id: '1', name: 'Zanahoria', quantity: 2, unit: 'unidad', location: 'nevera', added_at: '2024-01-01' },
      ],
      '/api/ingredientes': [],
    })

    render(<DespensaPage />)
    fireEvent.click(screen.getByText('Despensa', { selector: 'button' }))

    await waitFor(() => {
      expect(screen.getByText('Zanahoria')).toBeInTheDocument()
    })

    // The selector lives in the DOM (always rendered for the entry/exit
    // animation) but is collapsed via max-w-0 + opacity-0. After clicking
    // the title, the wrapper switches to the expanded classes.
    fireEvent.click(screen.getByText('Zanahoria'))

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('−')).toBeInTheDocument()
      expect(screen.getByText('+')).toBeInTheDocument()
    })
  })

  it('renders tuppers items with servings selector', async () => {
    mockFetch({
      '/api/despensa': [
        {
          id: '1',
          recipe_id: 'r1',
          servings: 4,
          location: 'congelador',
          added_at: '2024-01-01',
          recipe: { id: 'r1', title: 'Pollo asado', meal_type: 'comida', image_url: null },
        },
      ],
      '/api/recetas': [],
      '/api/despensa/tupper-extras': [],
    })

    render(<DespensaPage />)

    await waitFor(() => {
      expect(screen.getByText('Pollo asado')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
    })
  })

  it('shows search suggestions for ingredients', async () => {
    mockFetch({
      '/api/despensa': [],
      '/api/ingredientes': {
        data: [
          { name: 'Zanahoria', unit: 'unidad' },
          { name: 'Cebolla', unit: 'unidad' },
        ],
        total: 2,
      },
    })

    render(<DespensaPage />)
    fireEvent.click(screen.getByText('Despensa', { selector: 'button' }))

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar ingrediente/)).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/Buscar ingrediente/)
    fireEvent.change(input, { target: { value: 'zana' } })
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('Zanahoria')).toBeInTheDocument()
    })
  })

  it('shows item count', async () => {
    mockFetch({
      '/api/despensa': [
        { id: '1', name: 'Zanahoria', quantity: 1, unit: 'unidad', location: 'nevera', added_at: '2024-01-01' },
        { id: '2', name: 'Cebolla', quantity: 1, unit: 'unidad', location: 'nevera', added_at: '2024-01-01' },
      ],
      '/api/ingredientes': [],
    })

    render(<DespensaPage />)
    fireEvent.click(screen.getByText('Despensa', { selector: 'button' }))

    await waitFor(() => {
      expect(screen.getByText('2 ingredientes')).toBeInTheDocument()
    })
  })

  it('shows clear button when items exist', async () => {
    mockFetch({
      '/api/despensa': [
        { id: '1', name: 'Tomate', quantity: 1, unit: 'unidad', location: 'nevera', added_at: '2024-01-01' },
      ],
      '/api/ingredientes': [],
    })

    render(<DespensaPage />)
    fireEvent.click(screen.getByText('Despensa', { selector: 'button' }))

    await waitFor(() => {
      expect(screen.getByText('Vaciar despensa')).toBeInTheDocument()
    })
  })
})

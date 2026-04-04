import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ListaCompraPage from '@/app/lista-compra/page'
import { mockFetch } from '../setup'

const mockShoppingList = [
  {
    id: 'sl1',
    recipe_id: 'r1',
    added_at: '2024-01-01T00:00:00Z',
    recipe: { id: 'r1', title: 'Espaguetis Boloñesa', meal_type: 'comida' },
    ingredients: [
      { id: 'i1', name: 'Espaguetis', quantity: 150, unit: 'g' },
      { id: 'i2', name: 'Tomate', quantity: 200, unit: 'g' },
      { id: 'i5', name: 'Sal', quantity: 1, unit: 'pizca' },
      { id: 'i6', name: 'Aceite de oliva', quantity: 2, unit: 'cucharada' },
    ],
  },
  {
    id: 'sl2',
    recipe_id: 'r2',
    added_at: '2024-01-02T00:00:00Z',
    recipe: { id: 'r2', title: 'Ensalada de tomate', meal_type: 'cena' },
    ingredients: [
      { id: 'i3', name: 'Tomate', quantity: 300, unit: 'g' },
      { id: 'i4', name: 'Lechuga', quantity: 1, unit: 'unidad' },
      { id: 'i7', name: 'Agua', quantity: 500, unit: 'ml' },
      { id: 'i8', name: 'Pimienta', quantity: 1, unit: 'al gusto' },
    ],
  },
]

describe('Lista de Compra Page', () => {
  beforeEach(() => {
    mockFetch({ '/api/lista-compra': mockShoppingList })
  })

  it('renders page title', () => {
    render(<ListaCompraPage />)
    expect(screen.getByText('Lista de la compra')).toBeInTheDocument()
  })

  it('renders recipe pills after loading', async () => {
    render(<ListaCompraPage />)
    await waitFor(() => {
      expect(screen.getByText('Espaguetis Boloñesa')).toBeInTheDocument()
      expect(screen.getByText('Ensalada de tomate')).toBeInTheDocument()
    })
  })

  it('merges duplicate ingredients (tomate: 200g + 300g = 500g)', async () => {
    render(<ListaCompraPage />)
    await waitFor(() => {
      expect(screen.getByText('500 g')).toBeInTheDocument()
    })
  })

  it('renders unique ingredients', async () => {
    render(<ListaCompraPage />)
    await waitFor(() => {
      expect(screen.getByText('Espaguetis')).toBeInTheDocument()
      expect(screen.getByText('Lechuga')).toBeInTheDocument()
    })
  })

  it('excludes pantry items (sal, aceite de oliva, agua)', async () => {
    render(<ListaCompraPage />)
    await waitFor(() => {
      expect(screen.getByText('Espaguetis')).toBeInTheDocument()
    })
    // Pantry items should not appear
    expect(screen.queryByText('Aceite de oliva')).not.toBeInTheDocument()
    expect(screen.queryByText('Agua')).not.toBeInTheDocument()
  })

  it('excludes "al gusto" and "pizca" unit items', async () => {
    render(<ListaCompraPage />)
    await waitFor(() => {
      expect(screen.getByText('Espaguetis')).toBeInTheDocument()
    })
    // "Pimienta" (al gusto) and "Sal" (pizca) should not appear
    expect(screen.queryByText('Pimienta')).not.toBeInTheDocument()
  })

  it('shows pantry exclusion info text', async () => {
    render(<ListaCompraPage />)
    await waitFor(() => {
      expect(screen.getByText(/Sal, aceite, agua y especias se excluyen/)).toBeInTheDocument()
    })
  })

  it('toggles checkbox on click', async () => {
    render(<ListaCompraPage />)
    await waitFor(() => {
      expect(screen.getByText('Espaguetis')).toBeInTheDocument()
    })

    const espaguetisRow = screen.getByText('Espaguetis').closest('button')!
    fireEvent.click(espaguetisRow)

    await waitFor(() => {
      const label = screen.getByText('Espaguetis').closest('span[class*="flex-1"]')
      expect(label?.className).toContain('line-through')
    })
  })

  it('shows "Quitar seleccionados" button when items are checked', async () => {
    render(<ListaCompraPage />)
    await waitFor(() => {
      expect(screen.getByText('Espaguetis')).toBeInTheDocument()
    })

    // Initially no "Quitar seleccionados" button
    expect(screen.queryByText(/Quitar seleccionados/)).not.toBeInTheDocument()

    // Check an item
    const espaguetisRow = screen.getByText('Espaguetis').closest('button')!
    fireEvent.click(espaguetisRow)

    await waitFor(() => {
      expect(screen.getByText(/Quitar seleccionados/)).toBeInTheDocument()
    })
  })

  it('removes individual ingredient on X click', async () => {
    render(<ListaCompraPage />)
    await waitFor(() => {
      expect(screen.getByText('Espaguetis')).toBeInTheDocument()
    })

    const removeButtons = screen.getAllByTitle('Quitar ingrediente')
    fireEvent.click(removeButtons[0])

    await waitFor(() => {
      // One ingredient should be removed from the list
      const ingredients = screen.getAllByTitle('Quitar ingrediente')
      expect(ingredients.length).toBeLessThan(removeButtons.length)
    })
  })

  it('shows progress bar', async () => {
    render(<ListaCompraPage />)
    await waitFor(() => {
      expect(screen.getByText('Progreso')).toBeInTheDocument()
    })
  })

  it('shows counter text', async () => {
    render(<ListaCompraPage />)
    await waitFor(() => {
      // 3 items: Espaguetis, Tomate, Lechuga (pantry items excluded)
      expect(screen.getByText(/0 de 3 ingredientes/)).toBeInTheDocument()
    })
  })

  it('renders "Vaciar lista" button', async () => {
    render(<ListaCompraPage />)
    await waitFor(() => {
      expect(screen.getByText('Vaciar lista')).toBeInTheDocument()
    })
  })

  it('shows empty state when list is empty', async () => {
    mockFetch({ '/api/lista-compra': [] })
    render(<ListaCompraPage />)
    await waitFor(() => {
      expect(screen.getByText('La lista esta vacia')).toBeInTheDocument()
    })
  })

  it('shows link to recipes in empty state', async () => {
    mockFetch({ '/api/lista-compra': [] })
    render(<ListaCompraPage />)
    await waitFor(() => {
      expect(screen.getByText('Ver recetas')).toBeInTheDocument()
    })
  })

  it('removes recipe from list on X click', async () => {
    const fetchMock = mockFetch({ '/api/lista-compra': mockShoppingList })
    render(<ListaCompraPage />)

    await waitFor(() => {
      expect(screen.getByText('Espaguetis Boloñesa')).toBeInTheDocument()
    })

    const removeButtons = screen.getAllByTitle('Quitar de la lista')
    fireEvent.click(removeButtons[0])

    await waitFor(() => {
      const calls = fetchMock.mock.calls.map((c: string[]) => c[0])
      expect(calls.some((url: string) => url.includes('/api/lista-compra?id='))).toBe(true)
    })
  })
})

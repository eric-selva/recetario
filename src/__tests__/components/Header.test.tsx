import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Header from '@/components/Header'
import { mockFetch } from '../setup'

describe('Header', () => {
  beforeEach(() => {
    mockFetch({ '/api/lista-compra': [] })
  })

  it('renders the logo', () => {
    render(<Header />)
    expect(screen.getByText('Mi Recetario')).toBeInTheDocument()
  })

  it('renders all navigation links', () => {
    render(<Header />)
    expect(screen.getAllByText('Inicio').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Recetas').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Lista de compra').length).toBeGreaterThan(0)
  })

  it('toggles mobile menu on hamburger click', () => {
    render(<Header />)
    const button = screen.getByLabelText('Abrir menu')

    // Menu should not be visible initially (mobile nav links are in the DOM but in the desktop nav)
    fireEvent.click(button)

    // After click, mobile menu should show nav links
    const allRecetasLinks = screen.getAllByText('Recetas')
    expect(allRecetasLinks.length).toBeGreaterThanOrEqual(2) // Desktop + mobile
  })

  it('shows cart badge when shopping list has items', async () => {
    mockFetch({ '/api/lista-compra': [{ id: '1', recipe_id: 'r1' }, { id: '2', recipe_id: 'r2' }] })
    render(<Header />)

    // Wait for fetch to resolve
    await vi.waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })
})

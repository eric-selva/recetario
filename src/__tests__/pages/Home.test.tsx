import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home Page', () => {
  it('renders the hero title', () => {
    render(<Home />)
    expect(screen.getByText('Recetario')).toBeInTheDocument()
  })

  it('renders hero description', () => {
    render(<Home />)
    expect(screen.getByText(/Tu cocina, tus recetas/)).toBeInTheDocument()
  })

  it('renders CTA buttons', () => {
    render(<Home />)
    expect(screen.getByText('Ver recetas')).toBeInTheDocument()
    expect(screen.getAllByText('Nueva receta').length).toBeGreaterThan(0)
  })

  it('renders three quick cards', () => {
    render(<Home />)
    // Quick cards have these headings
    expect(screen.getByText('Crear receta')).toBeInTheDocument()
    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings.length).toBe(3)
  })

  it('links to correct pages', () => {
    render(<Home />)
    const links = screen.getAllByRole('link')
    const hrefs = links.map((l) => l.getAttribute('href'))
    expect(hrefs).toContain('/recetas')
    expect(hrefs).toContain('/recetas/nueva')
    expect(hrefs).toContain('/lista-compra')
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import NuevaRecetaPage from '@/app/recetas/nueva/page'

describe('Nueva Receta Page', () => {
  it('renders page title', () => {
    render(<NuevaRecetaPage />)
    expect(screen.getByText('Nueva receta')).toBeInTheDocument()
  })

  it('renders the recipe form', () => {
    render(<NuevaRecetaPage />)
    expect(screen.getByText('Informacion basica')).toBeInTheDocument()
  })

  it('renders title input', () => {
    render(<NuevaRecetaPage />)
    expect(screen.getByPlaceholderText(/Tortilla de patatas/)).toBeInTheDocument()
  })

  it('renders meal type selector', () => {
    render(<NuevaRecetaPage />)
    expect(screen.getByText('Tipo de comida')).toBeInTheDocument()
  })

  it('renders ingredient section', () => {
    render(<NuevaRecetaPage />)
    expect(screen.getByText('Ingredientes')).toBeInTheDocument()
    expect(screen.getByText('Añadir ingrediente')).toBeInTheDocument()
  })

  it('renders steps section', () => {
    render(<NuevaRecetaPage />)
    expect(screen.getByText('Paso a paso')).toBeInTheDocument()
    expect(screen.getByText('Añadir paso')).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<NuevaRecetaPage />)
    expect(screen.getByText('Crear receta')).toBeInTheDocument()
  })

  it('renders cancel button', () => {
    render(<NuevaRecetaPage />)
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
  })

  it('renders image upload section', () => {
    render(<NuevaRecetaPage />)
    expect(screen.getByText('Imagen')).toBeInTheDocument()
    expect(screen.getByText('Subir imagen')).toBeInTheDocument()
  })
})

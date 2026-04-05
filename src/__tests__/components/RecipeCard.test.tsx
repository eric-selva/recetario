import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RecipeCard from '@/components/RecipeCard'
import type { Recipe } from '@/types/database'

const mockRecipe: Recipe = {
  id: '1',
  title: 'Tortilla de patatas',
  description: 'La clasica tortilla española',
  image_url: null,
  meal_type: 'comida',
  prep_time: 30,
  servings: 4,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('RecipeCard', () => {
  it('renders recipe title', () => {
    render(<RecipeCard recipe={mockRecipe} />)
    expect(screen.getByText('Tortilla de patatas')).toBeInTheDocument()
  })

  it('renders meal type badge', () => {
    render(<RecipeCard recipe={mockRecipe} />)
    expect(screen.getByText('Comida')).toBeInTheDocument()
  })

  it('renders prep time', () => {
    render(<RecipeCard recipe={mockRecipe} />)
    expect(screen.getByText('30 min')).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<RecipeCard recipe={mockRecipe} />)
    expect(screen.getByText('La clasica tortilla española')).toBeInTheDocument()
  })

  it('does not render prep time when 0', () => {
    render(<RecipeCard recipe={{ ...mockRecipe, prep_time: 0 }} />)
    expect(screen.queryByText('0 min')).not.toBeInTheDocument()
  })

  it('links to recipe detail page', () => {
    render(<RecipeCard recipe={mockRecipe} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/recetas/1')
  })

  it('shows placeholder when no image', () => {
    render(<RecipeCard recipe={mockRecipe} />)
    // Should have the placeholder SVG area, no img tag
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('shows image when image_url is provided', () => {
    render(<RecipeCard recipe={{ ...mockRecipe, image_url: 'https://example.com/photo.jpg' }} />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('alt', 'Tortilla de patatas')
  })

  it('renders all meal type variants correctly', () => {
    const { rerender } = render(<RecipeCard recipe={{ ...mockRecipe, meal_type: 'postre' }} />)
    expect(screen.getByText('Postre')).toBeInTheDocument()

    rerender(<RecipeCard recipe={{ ...mockRecipe, meal_type: 'cena' }} />)
    expect(screen.getByText('Cena')).toBeInTheDocument()
  })
})

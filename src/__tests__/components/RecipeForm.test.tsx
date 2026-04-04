import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RecipeForm from '@/components/RecipeForm'
import { mockFetch } from '../setup'

describe('RecipeForm', () => {
  beforeEach(() => {
    mockFetch({
      '/api/recetas': { id: 'new-id', title: 'Test' },
      '/api/recetas/upload': { url: 'https://example.com/photo.jpg' },
    })
  })

  it('renders all form sections', () => {
    render(<RecipeForm />)
    expect(screen.getByText('Informacion basica')).toBeInTheDocument()
    expect(screen.getByText('Imagen')).toBeInTheDocument()
    expect(screen.getByText('Ingredientes')).toBeInTheDocument()
    expect(screen.getByText('Paso a paso')).toBeInTheDocument()
  })

  it('renders title input as required', () => {
    render(<RecipeForm />)
    const input = screen.getByPlaceholderText(/Tortilla de patatas/)
    expect(input).toBeRequired()
  })

  it('renders meal type selector with 3 options', () => {
    render(<RecipeForm />)
    const select = screen.getByDisplayValue('Comida') as HTMLSelectElement
    expect(select.options.length).toBe(3)
  })

  it('renders one initial ingredient row', () => {
    render(<RecipeForm />)
    const ingredientInputs = screen.getAllByPlaceholderText('Ingrediente')
    expect(ingredientInputs.length).toBe(1)
  })

  it('adds ingredient row when clicking "Añadir ingrediente"', async () => {
    render(<RecipeForm />)
    fireEvent.click(screen.getByText('Añadir ingrediente'))

    const ingredientInputs = screen.getAllByPlaceholderText('Ingrediente')
    expect(ingredientInputs.length).toBe(2)
  })

  it('adds step row when clicking "Añadir paso"', () => {
    render(<RecipeForm />)
    fireEvent.click(screen.getByText('Añadir paso'))

    const stepInputs = screen.getAllByPlaceholderText(/Paso \d+/)
    expect(stepInputs.length).toBe(2)
  })

  it('shows "Crear receta" button for new recipe', () => {
    render(<RecipeForm />)
    expect(screen.getByText('Crear receta')).toBeInTheDocument()
  })

  it('shows "Guardar cambios" button for editing', () => {
    render(<RecipeForm recipeId="123" initialData={{
      title: 'Test',
      description: '',
      image_url: null,
      meal_type: 'comida',
      prep_time: 0,
      servings: 2,
      ingredients: [{ name: 'Sal', quantity: 1, unit: 'g' }],
      steps: [{ instruction: 'Paso 1' }],
    }} />)
    expect(screen.getByText('Guardar cambios')).toBeInTheDocument()
  })

  it('populates fields when editing', () => {
    render(<RecipeForm recipeId="123" initialData={{
      title: 'Tortilla',
      description: 'Clasica',
      image_url: null,
      meal_type: 'comida',
      prep_time: 30,
      servings: 4,
      ingredients: [{ name: 'Patatas', quantity: 500, unit: 'g' }],
      steps: [{ instruction: 'Pelar patatas' }],
    }} />)

    expect(screen.getByDisplayValue('Tortilla')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Clasica')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Patatas')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Pelar patatas')).toBeInTheDocument()
  })

  it('submit button is disabled when title is empty', () => {
    render(<RecipeForm />)
    const submitBtn = screen.getByText('Crear receta')
    expect(submitBtn).toBeDisabled()
  })

  it('submit button is enabled when title is filled', async () => {
    const user = userEvent.setup()
    render(<RecipeForm />)

    await user.type(screen.getByPlaceholderText(/Tortilla de patatas/), 'Mi receta')
    expect(screen.getByText('Crear receta')).toBeEnabled()
  })

  it('submits form with correct data', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch({
      '/api/recetas': { id: 'new-id' },
    })

    render(<RecipeForm />)

    await user.type(screen.getByPlaceholderText(/Tortilla de patatas/), 'Test Recipe')
    fireEvent.submit(screen.getByText('Crear receta').closest('form')!)

    await waitFor(() => {
      const postCalls = fetchMock.mock.calls.filter(
        (c: [string, RequestInit?]) => c[1]?.method === 'POST'
      )
      expect(postCalls.length).toBe(1)
    })
  })
})

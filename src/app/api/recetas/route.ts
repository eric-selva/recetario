import { supabase } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

// GET /api/recetas — list all recipes (with optional filters)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const mealType = searchParams.get('meal_type')
  const search = searchParams.get('search')

  let query = supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  if (mealType && mealType !== 'todas') {
    query = query.eq('meal_type', mealType)
  }

  const { data: recipes, error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // If search term, filter by title or ingredient names
  if (search && search.trim()) {
    const term = search.toLowerCase().trim()

    // Get ingredient names for all recipes in one query
    const recipeIds = recipes.map((r) => r.id)
    const { data: ingredients } = await supabase
      .from('ingredients')
      .select('recipe_id, name')
      .in('recipe_id', recipeIds)

    const ingredientsByRecipe = new Map<string, string[]>()
    for (const ing of ingredients || []) {
      const list = ingredientsByRecipe.get(ing.recipe_id) || []
      list.push(ing.name.toLowerCase())
      ingredientsByRecipe.set(ing.recipe_id, list)
    }

    const filtered = recipes.filter((recipe) => {
      const titleMatch = recipe.title.toLowerCase().includes(term)
      const ingredientMatch = (ingredientsByRecipe.get(recipe.id) || []).some(
        (name) => name.includes(term)
      )
      return titleMatch || ingredientMatch
    })

    return Response.json(filtered)
  }

  return Response.json(recipes)
}

// POST /api/recetas — create a new recipe with ingredients and steps
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { title, description, image_url, meal_type, prep_time, servings, ingredients, steps } = body

  // Insert recipe
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({ title, description, image_url, meal_type, prep_time, servings })
    .select()
    .single()

  if (recipeError) {
    return Response.json({ error: recipeError.message }, { status: 500 })
  }

  // Insert ingredients
  if (ingredients?.length) {
    const ingredientRows = ingredients.map((ing: { name: string; quantity: number; unit: string; shoppable?: boolean }, i: number) => ({
      recipe_id: recipe.id,
      name: ing.name,
      quantity: ing.quantity,
      unit: ing.unit,
      order: i,
      ...(ing.shoppable !== undefined && { shoppable: ing.shoppable }),
    }))

    const { error: ingError } = await supabase.from('ingredients').insert(ingredientRows)
    if (ingError) {
      return Response.json({ error: ingError.message }, { status: 500 })
    }
  }

  // Insert steps
  if (steps?.length) {
    const stepRows = steps.map((step: { instruction: string }, i: number) => ({
      recipe_id: recipe.id,
      order: i,
      instruction: step.instruction,
    }))

    const { error: stepError } = await supabase.from('steps').insert(stepRows)
    if (stepError) {
      return Response.json({ error: stepError.message }, { status: 500 })
    }
  }

  return Response.json(recipe, { status: 201 })
}

import { supabase } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

// GET /api/recetas/[id] — get recipe with ingredients and steps
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [recipeRes, ingredientsRes, stepsRes] = await Promise.all([
    supabase.from('recipes').select('*').eq('id', id).single(),
    supabase.from('ingredients').select('*').eq('recipe_id', id).order('order'),
    supabase.from('steps').select('*').eq('recipe_id', id).order('order'),
  ])

  if (recipeRes.error) {
    return Response.json({ error: 'Receta no encontrada' }, { status: 404 })
  }

  return Response.json({
    ...recipeRes.data,
    ingredients: ingredientsRes.data || [],
    steps: stepsRes.data || [],
  })
}

// PUT /api/recetas/[id] — update recipe
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const { title, description, image_url, meal_type, prep_time, servings, ingredients, steps } = body

  // Update recipe
  const { error: recipeError } = await supabase
    .from('recipes')
    .update({ title, description, image_url, meal_type, prep_time, servings })
    .eq('id', id)

  if (recipeError) {
    return Response.json({ error: recipeError.message }, { status: 500 })
  }

  // Replace ingredients: delete old, insert new
  if (ingredients) {
    await supabase.from('ingredients').delete().eq('recipe_id', id)
    if (ingredients.length) {
      const ingredientRows = ingredients.map((ing: { name: string; quantity: number; unit: string; shoppable?: boolean }, i: number) => ({
        recipe_id: id,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        order: i,
        ...(ing.shoppable !== undefined && { shoppable: ing.shoppable }),
      }))
      await supabase.from('ingredients').insert(ingredientRows)
    }
  }

  // Replace steps: delete old, insert new
  if (steps) {
    await supabase.from('steps').delete().eq('recipe_id', id)
    if (steps.length) {
      const stepRows = steps.map((step: { instruction: string }, i: number) => ({
        recipe_id: id,
        order: i,
        instruction: step.instruction,
      }))
      await supabase.from('steps').insert(stepRows)
    }
  }

  return Response.json({ success: true })
}

// DELETE /api/recetas/[id] — delete recipe (cascade deletes ingredients, steps, shopping_list)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { error } = await supabase.from('recipes').delete().eq('id', id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}

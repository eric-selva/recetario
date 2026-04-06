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
    supabase.from('ingredients').select('*, catalog:catalog_id(id, name, shoppable)').eq('recipe_id', id).order('order'),
    supabase.from('steps').select('*').eq('recipe_id', id).order('order'),
  ])

  if (recipeRes.error) {
    return Response.json({ error: 'Receta no encontrada' }, { status: 404 })
  }

  // Enrich ingredients with catalog data
  const ingredients = (ingredientsRes.data || []).map((ing) => {
    const catalog = ing.catalog as { id: string; name: string; shoppable: boolean } | null
    return {
      id: ing.id,
      recipe_id: ing.recipe_id,
      catalog_id: ing.catalog_id,
      name: catalog?.name ?? '',
      quantity: ing.quantity,
      unit: ing.unit,
      order: ing.order,
      shoppable: catalog?.shoppable ?? true,
    }
  })

  return Response.json({
    ...recipeRes.data,
    ingredients,
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
      const ingredientRows = []
      for (let i = 0; i < ingredients.length; i++) {
        const ing = ingredients[i] as {
          name: string
          quantity: number
          unit: string
          shoppable?: boolean
          catalog_id?: string
        }
        const catalogId = ing.catalog_id ?? await resolveCatalogId(ing.name, ing.unit, ing.shoppable)
        ingredientRows.push({
          recipe_id: id,
          catalog_id: catalogId,
          quantity: ing.quantity,
          unit: ing.unit,
          order: i,
        })
      }
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

// Look up or create a catalog entry, returns catalog ID
async function resolveCatalogId(
  name: string,
  unit: string,
  shoppable?: boolean,
): Promise<string | null> {
  const trimmed = name.trim()

  // Try to find existing
  const { data: existing } = await supabase
    .from('catalog')
    .select('id')
    .ilike('name', trimmed)
    .limit(1)
    .single()

  if (existing) return existing.id

  // Create new catalog entry
  const { data: created } = await supabase
    .from('catalog')
    .insert({
      name: trimmed,
      default_unit: unit,
      shoppable: shoppable ?? true,
    })
    .select('id')
    .single()

  return created?.id ?? null
}
